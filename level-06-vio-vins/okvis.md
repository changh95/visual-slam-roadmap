# OKVIS
> Leutenegger 2015 · [Paper](https://journals.sagepub.com/doi/10.1177/0278364914554813)

**One-line summary** — OKVIS (Open Keyframe-based Visual-Inertial SLAM) established the tightly-coupled sliding-window optimization paradigm for VIO: jointly minimizing reprojection and IMU errors over a bounded keyframe window with Schur-complement marginalization.

## Key ideas
- **Joint nonlinear cost**: one optimization over keyframe poses, velocities, and IMU biases (plus landmarks and optionally the camera-IMU extrinsic), combining a marginalization prior, IMU residuals between consecutive frames, and robustified (Cauchy) reprojection residuals — re-linearized every iteration, unlike a filter.
- **Keyframe-based sliding window**: frames stay in the window based on visual overlap rather than pure recency; a frame becomes a keyframe when too few tracked features overlap the last keyframe, so the window spans diverse viewpoints. Non-keyframes are used and immediately marginalized.
- **Schur-complement marginalization**: when the window is full, the oldest keyframe and its landmarks are folded into a dense Gaussian prior $(\mathbf{H}_{\text{prior}}, \mathbf{b}_{\text{prior}})$, bounding computation while retaining past information.
- **IMU error term**: raw IMU measurements between keyframes are integrated (Runge-Kutta; the paper predates Forster's on-manifold preintegration) with Jacobians stored for efficient relative constraints.
- **Stereo + Ceres**: the reference implementation is a stereo-inertial system solved with Ceres, exploiting the sparse landmark structure.

## Key results
Demonstrated that tightly-coupled nonlinear optimization outperforms filter-based VIO (MSCKF-class) in accuracy while remaining real-time — the empirical result that shifted the field toward optimization.

## Why it matters for SLAM
The sliding-window-BA-plus-marginalization architecture OKVIS defined is the template that VINS-Mono, Basalt, ORB-SLAM3's VI mode, DM-VIO, and OKVIS2 all follow. Its keyframe selection logic and marginalization strategy are still the default answers to "how do you bound VIO compute without discarding information." OKVIS also seeded a long lineage: OKVIS2 added loop closure with reactivatable landmarks, and OKVIS2-X extended the framework to LiDAR, depth, and GNSS.

## Related
- [VINS-Mono](vins-mono.md) — the most widely deployed successor of this architecture.
- [OKVIS2](okvis2.md) — the direct successor adding scalable loop closure.
- [Basalt](basalt.md) — addresses the linearization weakness of OKVIS-style marginalization priors.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the later, now-standard IMU factor formulation.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the core mechanism behind the sliding window.

[Back to Level 6](../README.md#level-6-vio--vins)
