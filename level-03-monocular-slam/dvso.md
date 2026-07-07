# DVSO

> Yang 2018 · [Paper](https://arxiv.org/abs/1807.02570)

**One-line summary** — Deep Virtual Stereo Odometry feeds CNN disparity predictions into DSO as "virtual stereo" measurements, achieving stereo-level accuracy and metric scale from a single camera.

## Problem

Monocular VO that relies purely on geometric cues is "prone to scale drift and require[s] sufficient motion parallax in successive frames for motion estimation and 3D reconstruction." Stereo rigs fix both problems but cost hardware, calibration, and baseline constraints. DVSO ("Deep Virtual Stereo Odometry: Leveraging Deep Depth Prediction for Monocular Direct Sparse Odometry") asks whether a depth-prediction network can stand in for the second camera: keep DSO's windowed photometric bundle adjustment, but add the constraints a stereo camera would have provided.

## Method & architecture

**StackNet** — a stacked disparity network: *SimpleNet* (ResNet-50 encoder-decoder from DispNet, skip connections, resize-convolution upsampling) predicts left and right disparity maps at 4 scales from the left image alone; *ResidualNet* (12 residual blocks) takes SimpleNet's output plus warped reconstructions and the $\ell_1$ reconstruction error $e_l$, and learns additive residuals: $\mathit{disp}_s=\mathit{disp}_{\mathit{simple},s}\oplus\mathit{disp}_{\mathit{res},s}$. Training is **semi-supervised** on stereo pairs with per-scale loss combining a self-supervised photometric term, a supervised term against Stereo DSO's sparse reconstructions (no LiDAR needed), left-right consistency, second-order smoothness, and occlusion regularisation. The self-supervised term is

$$\mathcal{L}_{U}^{\mathit{left}}=\frac{1}{N}\sum_{x,y}\alpha\,\frac{1-\mathrm{SSIM}\big(I^{\mathit{left}},I^{\mathit{left}}_{\mathit{recons}}\big)}{2}+(1-\alpha)\big\lVert I^{\mathit{left}}-I^{\mathit{left}}_{\mathit{recons}}\big\rVert_1,\qquad \alpha=0.84$$

and the supervised term uses the reverse Huber (berHu) norm $\beta_{\epsilon}$ on $\mathit{disp}^{\mathit{left}}-\mathit{disp}^{\mathit{left}}_{\mathit{DSO}}$ over the sparse pixel set $\Omega_{\mathit{DSO}}$ — classical stereo geometry distilled into a monocular network.

**Odometry** — DVSO builds on monocular DSO's windowed direct bundle adjustment ($N=7$ keyframes, marginalisation via Schur complement) and uses the predictions in two ways. (1) *Initialisation*: each new point's inverse depth is set from the left disparity, $d_{\mathbf{p}}=D^{L}(\mathbf{p})/(f_x b)$, giving stable, metric initialisation; points failing a left-right consistency check $e_{lr}=|D^{L}(\mathbf{p})-D^{R}(\mathbf{p}')|>1$ are rejected as likely occlusions. (2) *Virtual stereo term*: alongside DSO's temporal photometric energy

$$E_{ij}^{\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert (I_j[\tilde{\mathbf{p}}]-b_j)-\frac{e^{a_j}}{e^{a_i}}(I_i[\mathbf{p}]-b_i)\right\rVert_{\gamma}$$

(with affine brightness parameters $a,b$, gradient-dependent weight $\omega_{\mathbf{p}}$, Huber norm $\lVert\cdot\rVert_{\gamma}$), each point gets a residual against a *virtual* right image synthesised from the predicted right disparity $D^R$:

$$E_i^{\dagger\mathbf{p}}=\omega_{\mathbf{p}}\left\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\right\rVert_{\gamma},\qquad I_i^{\dagger}[\mathbf{p}^{\dagger}]=I_i\big[\mathbf{p}^{\dagger}-(D^{R}(\mathbf{p}^{\dagger}),0)^{\top}\big]$$

where $\mathbf{p}^{\dagger}=\Pi_c(\Pi_c^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}_b)$ projects through the known virtual baseline $\mathbf{t}_b$. The total energy $E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_i^{\dagger\mathbf{p}}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{ij}^{\mathbf{p}}\big)$ is minimised by Gauss-Newton, so triangulated and predicted depth are traded off with robust norms inside the optimisation — the right image itself is never used at runtime.

## Results

**Depth (KITTI, Eigen split)**: StackNet reaches RMSE **4.442 m** (0–80 m range), beating the self-supervised state of the art of Godard et al. (4.935) and the LiDAR-semi-supervised Kuznietsov et al. (4.621) on most metrics; at 1–50 m it scores 3.390 vs 3.518/3.729. Inference takes under 40 ms at 512×256. **Odometry (KITTI)**: monocular DSO averages 65.6% translational drift ($t_{rel}$) over sequences 00–10; DVSO without baseline tuning reaches 1.06%, and the full system ($in{,}vs{,}lr{,}tb$) **0.77% / 0.20°**, better than Stereo DSO (0.84/0.20), stereo ORB-SLAM2 without loop closure (0.81/0.26), and Stereo LSD-VO (1.14/0.40) — from one camera. It also outperforms end-to-end methods (DeepVO, UnDeepVO, SfMLearner) on all available sequences, and swapping StackNet for Godard's depth degrades the mean to 1.51%, confirming the depth network matters.

## Why it matters for SLAM

DVSO showed that learned depth can close the accuracy gap between monocular and stereo visual odometry, and its "CNN as a virtual stereo camera" framing — expressing the depth prior as a photometric residual with the same units as the geometric terms — became an influential pattern for integrating networks into direct pipelines. It is the middle step of the CNN-SLAM → DVSO → D3VO lineage, which D3VO completed by adding learned pose and uncertainty on top of learned depth; the geometry-teaches-network loop (Stereo DSO supervising the net that upgrades monocular DSO) also prefigured later self-improving systems.

## Related

- [DSO](dso.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [D3VO](d3vo.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Scale ambiguity](scale-ambiguity.md)
