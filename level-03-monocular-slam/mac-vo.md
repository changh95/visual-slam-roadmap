# MAC-VO

> Qiu 2024 · [Paper](https://arxiv.org/abs/2409.09479)

**One-line summary** — A learning-based stereo visual odometry that predicts *metrics-aware* matching covariances and uses them both to select keypoints and to weight residuals in pose optimisation.

## Problem

Learning-based VO models reliability poorly: confidence weights learned unsupervised (DROID-SLAM, DPVO) are *scale-agnostic* — they rank matches relative to each other but do not reflect actual 3D estimation error in metres, which "makes the covariance inconsistent across different environments that vary in scale" and "harder to integrate multiple constraints from different modalities or sensors." Meanwhile keypoint selection still prefers texture-rich edges and corners, exactly where learned matching and depth are least accurate due to interpolation and edge ambiguity — D3VO showed such features can perform worse than random selection. MAC-VO replaces both with a single learned, metrics-aware uncertainty model.

## Method & architecture

**Uncertainty-aware matching network.** A shared FlowFormer-backbone network jointly estimates depth, optical flow $\hat{f} \in \mathbb{R}^2$, and their uncertainties $\hat{\Sigma}_f = \mathrm{diag}(\sigma_u^2, \sigma_v^2)$ between frames. A covariance decoder rides the recurrent flow decoder, predicting iterative updates $\log \Delta\sigma$ in log space (additive updates, guaranteed-positive variance, stable gradients). Supervision is a negative log-likelihood loss over the update iterations:

$$L_{cov} = \sum_i^N \alpha_i \left( (y - \hat{f}_i)^\top \hat{\Sigma}_f^{-1} (y - \hat{f}_i) + \log(\det \hat{\Sigma}_f) \right)$$

with ground-truth flow $y$ and exponentially decaying weights $\alpha_i$ (ratio 0.8). Trained on TartanAir only; evaluated everywhere else zero-shot.

**Uncertainty-based keypoint selection.** Three stacked filters: non-minimum suppression (spatial spread), a geometry filter (image borders, invalid depth), and an uncertainty filter that drops pixels whose depth or flow uncertainty exceeds 1.5x the frame median — implicitly removing moving vehicles, occlusions, reflections, and featureless regions.

**Metrics-aware 3D covariance.** 2D uncertainty is propagated through the pinhole model into a full 3D covariance per keypoint. Diagonal terms (for $x$; $y$ symmetric, $\sigma_z^2 = \sigma_d^2$):

$$\sigma_{x}^2 = \left( \sigma_u^2 \sigma_d^2 + \sigma_u^2 d^2 + (u - c_x)^2 \sigma_d^2 \right) / \mathrm{f}_x^2$$

Because all three coordinates share the depth $d$, the model keeps the off-diagonal terms, e.g. $\sigma_{xz} = \sigma_d^2 (u - c_x)/\mathrm{f}_x$ and $\sigma_{xy} = \sigma_d^2 (u - c_x)(v - c_y)/(\mathrm{f}_x \mathrm{f}_y)$ — an anisotropic, correlated covariance in metric units, unlike DROID-SLAM's scale-agnostic diagonal. Depth uncertainty is additionally corrected for scene geometry: within a 32-pixel patch around the match, $\sigma_d^2 = \sum_j \varphi_j (d_j - \mu_D)^2$, a variance weighted by a 2D Gaussian kernel $\varphi$ built from $(\sigma_u^2, \sigma_v^2)$ — so a match near a depth discontinuity inherits large depth uncertainty.

**Pose graph optimisation.** The camera pose $T_t \in SE(3)$ is initialised by TartanVO's motion estimate and refined by two-frame registration of matched 3D keypoints, weighted by the propagated covariances:

$$T^{\star} = \operatorname*{arg\,min}_{T_t} \sum_i \left\lVert \mathbf{p}_{i,t-1} - T_t\, {}^c\mathbf{p}_{i,t} \right\rVert^2_{\Sigma_i}, \qquad \Sigma_i = \Sigma^p_{i,t-1} + R_t\, {}^c\Sigma^p_{i,t}\, R_t^\top$$

solved with Levenberg-Marquardt in PyPose. Notably there is *no* multi-frame bundle adjustment or loop closure — accuracy comes entirely from calibrated weighting.

## Results

Same configuration and weights across all datasets; evaluation uses per-frame relative errors $t_{rel}$ (m/frame) and $r_{rel}$ (deg/frame).

- **EuRoC**: comparable average $t_{rel}$ to DROID-SLAM (a full SLAM system) and about 10% better $r_{rel}$ than all baselines.
- **TartanAir v2** (new Hard split with indoor-outdoor transitions and low light): 61.9% lower $t_{rel}$ than DROID-SLAM; on the lunar-like H00 sequence, 82.4% lower $t_{rel}$ and the best $r_{rel}$ of all baselines. ORB-SLAM3 and MASt3R-SLAM lose track on every Hard sequence.
- **KITTI**: 53.3% lower $t_{rel}$ than other VO methods, ranking behind only ORB-SLAM3 (a full SLAM system with loop closure); $r_{rel}$ suffers from the lack of multi-frame optimisation.
- **Ablations** (TartanAir v2 Hard, $t_{rel}$/$r_{rel}$): full model .0141/.1429 vs diagonal-only covariance .0461/.3023 vs scale-agnostic .0204/.2321 vs identity covariance .0679/.3776 — both metric scale and off-diagonal terms matter.
- **Cost**: 4.20 GB GPU memory (6.7x less than DROID-SLAM); 2.15 fps raw, 10.5 fps in fast mode (bf16, 4 update iterations) at ~70% of full accuracy on a 3090 Ti.

## Why it matters for SLAM

MAC-VO represents the maturing of learning-based odometry: not just predicting poses or flow, but predicting *how wrong* the predictions are, in a form (metric, correlated covariances) that classical estimation theory knows how to consume. Calibrated uncertainty is exactly what is needed to fuse learned front-ends with filters, factor graphs, and multi-sensor systems — the authors' stated next step — and the uncertainty map doubles as a reliability signal for downstream decision-making.

## Related

- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [DROID-SLAM](droid-slam.md)
- [D3VO](d3vo.md)
- [FlowFormer](../level-05-deep-learning/flowformer.md) — the matching backbone
- [Consistency](../level-02-getting-familiar/consistency.md)
