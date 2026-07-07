# D3VO

> Yang 2020 · [Paper](https://arxiv.org/abs/2003.01060)

**One-line summary** — Integrated three deep predictions — depth, pose, and photometric uncertainty — into a DSO-style direct VO framework, leveraging learned priors in both front-end tracking and back-end photometric bundle adjustment.

## Problem

By 2020 it was clear that a single learned quantity (depth, as in CNN-SLAM and DVSO) could strengthen classical monocular VO, but purely geometric monocular systems still trailed stereo and visual-inertial pipelines in accuracy and robustness. D3VO ("Deep Depth, Deep Pose and Deep Uncertainty for Monocular Visual Odometry") asks how much of the gap can be closed by exploiting deep networks on *three* levels at once, tightly integrated into both the tracking front-end and the windowed nonlinear optimisation back-end of a sparse direct odometry framework.

## Method & architecture

**Self-supervised network** — DepthNet predicts depth maps $D_t, D_{t^s}$ and uncertainty $\Sigma_t$ from a single left image; PoseNet predicts the relative pose $\mathbf{T}_t^{t'}$ plus affine brightness parameters $a,b$ from concatenated image pairs (both UNet-like). Training minimises the per-pixel minimum photometric reprojection error over temporal *and* static-stereo warps $I_{t'}\in\{I_{t-1},I_{t+1},I_{t^s}\}$, with two additions. First, predicted **brightness transformation** aligns illumination on the fly, $I_t^{a_{t'},b_{t'}}=a_{t\rightarrow t'}I_t+b_{t\rightarrow t'}$ — the learning-time analogue of DSO's affine brightness model. Second, **heteroscedastic aleatoric uncertainty**: the loss is attenuated by a predicted variance map,

$$L_{self}=\frac{1}{|V|}\sum_{\mathbf{p}\in V}\frac{\min_{t'}\,r\big(I_t^{a_{t'},b_{t'}},\,I_{t'\rightarrow t}\big)}{\Sigma_t}+\log\Sigma_t$$

so pixels violating brightness constancy (non-Lambertian surfaces, moving objects, high-frequency areas) get high $\Sigma_t$, with $r$ the usual SSIM + $\ell_1$ photometric error.

**Odometry** — a windowed sparse photometric bundle adjustment as in DSO, minimising $E_{photo}$ over keyframes $\mathcal{F}$ and points $\mathcal{P}_i$ with the standard affine-brightness Huber residual $E_{\mathbf{p}j}$. D3VO injects the network on three levels:

- *Deep depth*: point depths are initialised metrically as $d_{\mathbf{p}}=\widetilde{D}_i[\mathbf{p}]$, and DVSO's virtual stereo term $E_{\mathbf{p}}^{\dagger}=w_{\mathbf{p}}\lVert I_i^{\dagger}[\mathbf{p}^{\dagger}]-I_i[\mathbf{p}]\rVert_{\gamma}$ keeps optimised depth consistent with the prediction: $E_{photo}=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_i}\big(\lambda E_{\mathbf{p}}^{\dagger}+\sum_{j\in\mathrm{obs}(\mathbf{p})}E_{\mathbf{p}j}\big)$.
- *Deep uncertainty*: the empirical gradient-based residual weight of DSO is replaced by the learned map,

$$w_{\mathbf{p}}=\frac{\alpha^2}{\alpha^2+\lVert\widetilde{\Sigma}(\mathbf{p})\rVert_2^2}$$

  down-weighting reflections, moving objects, and depth-discontinuity boundaries.
- *Deep pose*: PoseNet's prediction replaces the constant-velocity model to initialise front-end direct image alignment (via a small factor graph over the current and last frames), and enters the back-end as a relative-pose prior between consecutive keyframes,

$$E_{pose}=\sum_{i\in\mathcal{F}}\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big)^{\top}\,\Sigma_{\tilde{\xi}}^{-1}\,\mathrm{Log}\big(\widetilde{\mathbf{T}}_{i-1}^{i}\,\mathbf{T}_{i}^{i-1}\big),\qquad E_{total}=E_{photo}+w\,E_{pose}$$

an analogy to an IMU pre-integration prior — but from a camera alone. $E_{total}$ is minimised with Gauss-Newton.

## Results

**Depth**: on the KITTI Eigen split the full network reaches RMSE **4.485** vs Monodepth2's 4.750 under the same stereo+mono self-supervision, close to DVSO (4.442) which needs sparse depth supervision; on EuRoC V2_01 it scores RMSE 0.337 vs Monodepth2's 0.370, with the brightness transformation providing most of the gain. **Odometry (KITTI)**: on the test split (01, 02, 06, 08, 09, 10), mean $t_{rel}$ is **0.82%** vs Stereo DSO 0.89, stereo ORB-SLAM2 0.91, and monocular DSO 65.8; on Seq. 09/10 D3VO gets 0.78/0.62 vs DVSO's 0.83/0.74 and far below all end-to-end methods. **EuRoC MAV**: mean RMSE ATE **0.10 m** over 5 test sequences — better than VI-DSO (0.11), VINS-Mono (0.18), OKVIS (0.28), ROVIO (0.24), MSCKF (0.25) despite using no IMU, and matching stereo-inertial Basalt (0.08 on the 4-sequence subset). Ablations show deep pose is what rescues the violent-motion sequences V1_03 and V2_03 (0.63→0.13 and 0.52→0.19 with Dd+Dp).

## Why it matters for SLAM

D3VO is the culmination of the "deep priors inside a direct VO backend" line that runs CNN-SLAM → DVSO → D3VO: each step incorporated more learned quantities into the classical pipeline. Matching stereo and visual-inertial systems with a single passive camera was the strongest evidence to date that learned priors can substitute for extra sensors, and its learned uncertainty-weighted residuals and network-pose-as-IMU-prior designs became influential patterns in later hybrid systems.

## Related

- [DSO](dso.md)
- [DVSO](dvso.md)
- [CNN-SLAM](cnn-slam.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
