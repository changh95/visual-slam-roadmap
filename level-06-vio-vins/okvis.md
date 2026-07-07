# OKVIS
> Leutenegger 2015 · [Paper](https://journals.sagepub.com/doi/10.1177/0278364914554813)

**One-line summary** — OKVIS (Open Keyframe-based Visual-Inertial SLAM) established the tightly-coupled sliding-window optimization paradigm for VIO: jointly minimizing reprojection and IMU errors over a bounded window of keyframes plus recent frames, with Schur-complement marginalization compressing everything older into a prior.

## Problem
Filter-based VIO (MSCKF-class) linearizes each measurement once, at update time; the accumulated linearization error costs accuracy. Full bundle adjustment re-linearizes everything at every iteration and drifts far less — but BA over all past frames cannot run in real time, and inertial measurements arriving at hundreds of Hz create dense temporal constraints between successive states. OKVIS resolves the tension with a bounded *keyframe* window: keyframes may be spaced arbitrarily far apart in time (so the estimate stays drift-free even when stationary), and old states are folded into a Gaussian prior via marginalization.

## Method & architecture
- **States and joint cost.** Each robot state holds pose, velocity, and IMU biases, $\mathbf{x}_R = \begin{bmatrix} {}_W\mathbf{r}_S^\top & \mathbf{q}_{WS}^\top & {}_S\mathbf{v}^\top & \mathbf{b}_g^\top & \mathbf{b}_a^\top \end{bmatrix}^\top$, alongside 3D landmarks ${}_W\mathbf{l}^j$ and (optionally, online-calibrated) camera extrinsics. The estimator minimizes one cost combining weighted reprojection errors $\mathbf{e}_r$ and IMU error terms $\mathbf{e}_s$ (Eq. 7):
  $$J(\mathbf{x}) := \sum_{i=1}^{I}\sum_{k=1}^{K}\sum_{j \in \mathcal{J}(i,k)} \mathbf{e}_r^{i,j,k\,\top}\,\mathbf{W}_r^{i,j,k}\,\mathbf{e}_r^{i,j,k} \;+\; \sum_{k=1}^{K-1} \mathbf{e}_s^{k\,\top}\,\mathbf{W}_s^{k}\,\mathbf{e}_s^{k},$$
  with camera index $i$, frame index $k$, landmark index $j$, and information matrices $\mathbf{W}$ — solved with Google Ceres, re-linearized every iteration (unlike a filter).
- **Reprojection error.** $\mathbf{e}_r^{i,j,k} = \mathbf{z}^{i,j,k} - \mathbf{h}_i\big(\mathbf{T}_{C_iS}\,\mathbf{T}_{SW}\,{}_W\mathbf{l}^j\big)$, where $\mathbf{h}_i$ is the (distortion-aware) projection of camera $i$; analytic Jacobians double as ingredients of the marginalization step.
- **IMU error term.** Raw IMU measurements between frames $k$ and $k{+}1$ are integrated with classical Runge-Kutta (the paper pre-dates on-manifold preintegration) into a prediction $\hat{\mathbf{x}}^{k+1}$, and the 15-dimensional residual is the prediction-vs-estimate difference — position, minimal quaternion error $2\big[\hat{\mathbf{q}}_{WS}^{k+1} \otimes \mathbf{q}_{WS}^{k+1\,-1}\big]_{1:3}$, velocity, and biases — with information matrix $\mathbf{W}_s^k$ obtained by propagating the covariance $\mathbf{P}\big(\delta\hat{\boldsymbol{\chi}}_R^{k+1}\,\vert\,\mathbf{x}_R^k, \mathbf{z}_s^k\big)$ through the residual Jacobians.
- **Keyframe window.** The optimization spans $S$ most-recent frames (the temporal/IMU window) plus $M$ keyframes possibly far in the past. A frame becomes a keyframe when the hull of projected, matched landmarks covers less than ~50% of the image or fewer than ~20% of detected keypoints are matched — so kept keyframes span diverse viewpoints.
- **Marginalization.** Dropping states $\mathbf{x}_\mu$ applies the Schur complement to the Gauss-Newton system $\mathbf{H}\delta\boldsymbol{\chi} = \mathbf{b}$:
  $$\mathbf{H}^{*}_{\lambda\lambda} = \mathbf{H}_{\lambda\lambda} - \mathbf{H}_{\lambda\mu}\mathbf{H}_{\mu\mu}^{-1}\mathbf{H}_{\mu\lambda}, \qquad \mathbf{b}^{*}_{\lambda} = \mathbf{b}_{\lambda} - \mathbf{H}_{\lambda\mu}\mathbf{H}_{\mu\mu}^{-1}\mathbf{b}_{\mu},$$
  with the linearization point fixed at the estimate at marginalization time (a first-estimate treatment). Non-keyframes have their measurements dropped and states marginalized; old keyframes are marginalized together with landmarks visible only in them, keeping the problem sparse.
- **Front end.** Multi-scale SSE-optimized Harris corners with BRISK descriptors (uniform keypoint distribution enforced), brute-force 3D-2D matching gated by a Mahalanobis test plus absolute-pose RANSAC, then 2D-2D matching with triangulation and relative RANSAC against the newest keyframe; stereo and monocular variants share the pipeline.

## Results
Evaluated on datasets from a custom FPGA-synchronized stereo-inertial sensor (ADIS16448 IMU at 800 Hz, two WVGA global-shutter cameras at 20 Hz, 11 cm baseline) against a reference MSCKF-style stochastic-cloning sliding-window filter fed the same keypoints and IMU data, with $M{=}7$ keyframes and $S{=}3$ recent frames. On the 1200 m **Vicon Loops** sequence (14 min, Vicon ground truth) all methods stay below 0.1% median position error per distance traveled, but OKVIS shows less yaw drift than the filter. On the 7.9 km **Bicycle Trajectory** (23 min, speeds to 13.1 m/s, DGPS ground truth) and the 620 m **ETH Main Building** handheld dataset, both the stereo (aslam) and monocular (aslam-mono) versions consistently outperform msckf-mono. Online extrinsics calibration from a rough CAD guess removes the scale error that miscalibration otherwise causes; increasing keyframes from 7 to 12 brings no significant gain, and cutting keypoints per image from 240 to 45 degrades accuracy only mildly.

## Why it matters for SLAM
The sliding-window-BA-plus-marginalization architecture OKVIS defined is the template that VINS-Mono, Basalt, ORB-SLAM3's VI mode, DM-VIO, and OKVIS2 all follow, and it provided the first strong evidence that tightly-coupled nonlinear optimization beats filtering in accuracy at acceptable cost. Its keyframe selection logic and marginalization strategy are still the default answers to "how do you bound VIO compute without discarding information." OKVIS also seeded a long lineage: OKVIS2 added loop closure with reactivatable landmarks, and OKVIS2-X extended the framework to LiDAR, depth, and GNSS.

## Related
- [VINS-Mono](vins-mono.md) — the most widely deployed successor of this architecture.
- [OKVIS2](okvis2.md) — the direct successor adding scalable loop closure.
- [Basalt](basalt.md) — addresses the linearization weakness of OKVIS-style marginalization priors.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the later, now-standard IMU factor formulation.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the core mechanism behind the sliding window.
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — the linear-algebra tool doing the compression.
