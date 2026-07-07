# VINS-Mono

> Qin 2018 · [Paper](https://arxiv.org/abs/1708.03852)

**One-line summary** — VINS-Mono is a complete tightly-coupled monocular visual-inertial estimator — robust initialization, sliding-window optimization with marginalization, relocalization, and 4-DoF pose-graph loop closure — that became one of the most widely used VIO systems in robotics.

## Problem

A monocular camera with a low-cost IMU forms the *minimum* sensor suite for metric six-DoF state estimation — but the lack of any direct distance measurement poses significant challenges in IMU processing, estimator initialization, extrinsic calibration, and nonlinear optimization. Earlier systems solved parts of this pipeline; a practitioner still had to assemble initialization, tightly-coupled estimation, and drift correction from separate pieces. VINS-Mono's goal was a single robust, versatile, complete system covering all of it, with failure recovery included.

## Key ideas

- **Minimum sensor suite, full metric state**: a monocular camera + low-cost IMU is the smallest suite for metric 6-DoF estimation; the challenge is that depth is never measured directly, so initialization, extrinsic calibration, and scale must all be estimated.
- **Robust loosely-coupled initialization**: a visual SfM bootstrap is aligned with IMU preintegration to solve for gyroscope bias, gravity, velocities, and metric scale — enabling reliable start-up (and failure recovery) from unknown initial conditions.
- **Tightly-coupled sliding-window optimization**: preintegrated IMU factors and visual reprojection factors (features tracked by KLT optical flow, outliers rejected by RANSAC) are jointly minimized over a window of keyframe states,
  $$\min_{\mathcal{X}}\;\Big\{\|\mathbf{r}_p - \mathbf{H}_p\mathcal{X}\|^2 + \sum_{\mathcal{B}} \|\mathbf{r}_{\mathcal{B}}\|^2_{\mathbf{P}} + \sum_{\mathcal{C}} \rho\big(\|\mathbf{r}_{\mathcal{C}}\|^2_{\mathbf{P}}\big)\Big\},$$
  where $\mathbf{r}_p$ is the marginalization prior, $\mathbf{r}_{\mathcal{B}}$ the preintegrated IMU residuals, $\mathbf{r}_{\mathcal{C}}$ the visual residuals under a Huber loss $\rho$, solved with Ceres.
- **Two-way marginalization strategy**: marginalize the oldest keyframe when a new keyframe enters, or discard the second-newest frame's visual measurements otherwise — keeping the window computationally bounded without losing IMU continuity.
- **Relocalization + 4-DoF pose graph**: DBoW2-based loop detection feeds a *tightly-coupled* relocalization step with minimum computation overhead, and a global pose graph optimizes only the four drift-prone degrees of freedom (x, y, z, yaw) to enforce global consistency — roll and pitch are left fixed because gravity makes them observable.

## Results & impact

The paper validates the system on public datasets and real-world experiments against other state-of-the-art algorithms, and goes further than benchmarks: onboard closed-loop autonomous flight on an MAV and a port of the algorithm to an iOS demonstration, with open-source implementations released for both PCs and iOS devices. That completeness made VINS-Mono the default monocular VIO of its era — the system a lab would reach for on drones, handhelds, and phones — and the direct basis for VINS-Fusion and countless derived systems.

## Why it matters for SLAM

VINS-Mono is arguably the reference monocular VIO system: it packaged the sliding-window + marginalization architecture pioneered by OKVIS with a practical initialization and a full loop-closure back-end, all in one open-source release that runs on drones and phones. Its design choices — preintegration, Huber-robust reprojection factors, sliding-window marginalization, 4-DoF pose graph — became the standard pattern that later systems (VINS-Fusion, ORB-SLAM3's inertial mode, many commercial trackers) follow or refine.

## Related

- [IMU preintegration](imu-preintegration.md)
- [OKVIS](okvis.md)
- [VINS-Fusion](vins-fusion.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)

[Back to Level 6](../README.md#level-6-vio--vins)
