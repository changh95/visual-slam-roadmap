# OKVIS
> Leutenegger 2015 · [Paper](https://journals.sagepub.com/doi/10.1177/0278364914554813)

**One-line summary** — OKVIS (Open Keyframe-based Visual-Inertial SLAM) established the tightly-coupled sliding-window optimization paradigm for VIO: jointly minimizing reprojection and IMU errors over a bounded keyframe window with Schur-complement marginalization.

## Problem
Filter-based VIO (MSCKF-class) linearizes each measurement once, at update time; the accumulated linearization error costs accuracy. Bundle adjustment re-linearizes everything at every iteration and drifts far less — but naive BA over all past frames cannot run in real time, and inertial measurements arrive at hundreds of Hz.

OKVIS resolved the tension with a bounded *keyframe* window: re-linearize a small, viewpoint-diverse set of recent states every iteration, and compress everything older into a prior via the Schur complement.

## Key ideas
- **One joint nonlinear cost.** The window state $\mathcal{X}$ holds keyframe poses $\mathbf{T}_{WS_i} \in SE(3)$, velocities, IMU biases, landmarks, and optionally the camera-IMU extrinsic $\mathbf{T}_{SC}$. The optimizer minimizes
  $$\|\mathbf{r}_p\|^2_{\Omega_p} + \sum_{(i,j)} \|\mathbf{r}_s\|^2_{\mathbf{Q}^{-1}_{ij}} + \sum_{k,i} \rho\big(\|\mathbf{r}_r\|^2_{\mathbf{R}^{-1}}\big)$$
  — a marginalization prior $\mathbf{r}_p$, IMU residuals $\mathbf{r}_s$ between consecutive frames, and Cauchy-robustified reprojection residuals $\mathbf{r}_r$ — re-linearized every iteration, unlike a filter.
- **IMU error term.** Raw IMU measurements between frames are integrated with 4th-order Runge-Kutta (the paper predates Forster's on-manifold preintegration) with stored Jacobians. The resulting residual stacks five components between consecutive states:
  - position: predicted vs integrated relative translation (gravity-compensated),
  - orientation: quaternion error of the relative rotation,
  - velocity: predicted vs integrated velocity change,
  - gyro and accel bias: random-walk consistency $\mathbf{b}_j - \mathbf{b}_i$.
- **Keyframe-based window.** Frames stay in the window by *visual overlap*, not recency: a frame becomes a keyframe when too few tracked features overlap the last keyframe, so the window spans diverse viewpoints (good triangulation baselines) while non-keyframes are used and immediately marginalized.
- **Schur-complement marginalization.** When the window is full, the oldest keyframe and its landmarks (variables $\mathbf{m}$) are folded into a dense Gaussian prior on the kept variables $\mathbf{k}$:
  $$\mathbf{H}_{\text{prior}} = \mathbf{H}_{kk} - \mathbf{H}_{km}\mathbf{H}_{mm}^{-1}\mathbf{H}_{mk}, \qquad
  \mathbf{b}_{\text{prior}} = \mathbf{b}_k - \mathbf{H}_{km}\mathbf{H}_{mm}^{-1}\mathbf{b}_m,$$
  bounding computation while retaining (linearized) past information.
- **Stereo + Ceres implementation.** The reference system is stereo-inertial, solved with Ceres and exploiting the sparse landmark structure inside each solve; online estimation of the camera-IMU extrinsic is supported.

## Results & impact
Published in IJRR (2015) and evaluated on stereo-IMU sequences from a custom visual-inertial sensor rig, OKVIS demonstrated lower drift than MSCKF-class filtering and visual-only odometry on aggressive motion sequences while running in real time.

This was the empirical result that shifted the field toward optimization: the sliding-window-BA-plus-marginalization template it defined is followed by VINS-Mono, Basalt, ORB-SLAM3's VI mode, DM-VIO, and OKVIS2. It also seeded a long lineage of its own — OKVIS2 added scalable loop closure with reactivatable landmarks, and OKVIS2-X extended the framework to LiDAR, depth, and GNSS.

## Why it matters for SLAM
The sliding-window-BA-plus-marginalization architecture OKVIS defined is the template that VINS-Mono, Basalt, ORB-SLAM3's VI mode, DM-VIO, and OKVIS2 all follow. Its keyframe selection logic and marginalization strategy are still the default answers to "how do you bound VIO compute without discarding information." OKVIS also seeded a long lineage: OKVIS2 added loop closure with reactivatable landmarks, and OKVIS2-X extended the framework to LiDAR, depth, and GNSS.

## Related
- [VINS-Mono](vins-mono.md) — the most widely deployed successor of this architecture.
- [OKVIS2](okvis2.md) — the direct successor adding scalable loop closure.
- [Basalt](basalt.md) — addresses the linearization weakness of OKVIS-style marginalization priors.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the later, now-standard IMU factor formulation.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the core mechanism behind the sliding window.
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — the linear-algebra tool doing the compression.

[Back to Level 6](../README.md#level-6-vio--vins)
