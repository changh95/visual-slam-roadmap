# OKVIS2

> Leutenegger 2022 · [Paper](https://arxiv.org/abs/2202.09199)

**One-line summary** — OKVIS2 upgrades the classic OKVIS sliding-window VIO into a real-time, scalable visual-inertial *SLAM* system by marginalizing common observations into pose-graph edges that can be fluidly turned back into landmarks upon loop closure.

## Problem

Sliding-window VIO systems (OKVIS, VINS-Mono) bound their computation by marginalizing old states, but classic marginalization is a one-way street: once a landmark's information is compressed into a dense Schur-complement prior, it can never be expanded back into explicit landmark constraints when a loop closure arrives. This creates a hard boundary between "odometry mode" (bounded window, drifting) and "SLAM mode" (global map with landmarks) — the system must either ignore the loop or reset its map. Robust, accurate state estimation for robotics and AR/VR particularly requires handling *long* and *repeated* loop closures, which is exactly the regime OKVIS2 targets.

## Key ideas

- **Reactivatable landmarks / improved marginalization**: instead of irreversibly compressing old landmarks into a dense Schur-complement prior, marginalized observations become sparse *pose-graph edges* between the co-observing keyframes,
  $$f_{\text{edge}}(\mathbf{T}_i, \mathbf{T}_j) = \left\|\mathbf{T}_j^{-1}\mathbf{T}_i \ominus \hat{\mathbf{T}}_{ij}\right\|^2_{\boldsymbol{\Omega}_{ij}},$$
  where $\hat{\mathbf{T}}_{ij}$ is the relative pose at marginalization time and $\boldsymbol{\Omega}_{ij}$ encodes the information contributed by the marginalized landmark. At loop closure, the edge is replaced by the original reprojection factors and the landmark re-enters the optimization as an explicit 3D variable.
- **One factor graph, two roles**: a bounded-size real-time factor graph mixes reprojection factors, IMU preintegration error terms, and pose-graph edges — so the system moves seamlessly between "odometry mode" and "full SLAM mode" without a map reset.
- **Scalable pose graph**: the collection of edges left behind by marginalized landmarks grows at roughly constant cost per frame (bounded by the number of co-observed features), rather than the quadratic growth of naive global bundle adjustment — this is what makes the map long-trajectory-scalable.
- **Loop closure with landmark reactivation**: place recognition proposes candidate loop frames; feature re-matching identifies which stored landmarks are visible from the current viewpoint; those landmarks are reactivated into the live window and jointly optimized with their original observations.
- **Asynchronous large-loop optimization**: bigger loops are optimized asynchronously by re-using the same factor graph, keeping the real-time estimator bounded while still achieving global consistency after long and repeated loop closures.
- **Multi-session capability**: because past maps are kept as a compact pose graph with recoverable landmarks, previously built maps can be re-entered and extended across sessions.
- Retains OKVIS's tightly-coupled, keyframe-based, multi-camera + IMU design, now with on-manifold IMU preintegration factors inside a nonlinear least-squares (Ceres-style) optimizer.

## Results & impact

The paper's experiments show OKVIS2 "achieves and in part outperforms what state-of-the-art open-source systems achieve" on standard benchmarks. Evaluations cover EuRoC and TUM-VI style sequences, with accuracy competitive with ORB-SLAM3; on long sequences where loop closure is essential, the full SLAM mode reduces end-to-end drift dramatically compared to odometry-only OKVIS, and landmark reactivation improves consistency at loop closure compared to plain pose-graph correction. The system is engineered to run in real time on embedded-class processors and is open source, and its architecture became the base that OKVIS2-X extends with depth, LiDAR, and GNSS.

## Why it matters for SLAM

OKVIS (2015) defined the sliding-window optimization + marginalization architecture for VIO, but like all sliding-window estimators it could not undo marginalization when a loop was found. OKVIS2's pose-graph-edge representation is a principled middle ground between Schur-complement priors and full landmark retention, and it achieves or in part outperforms state-of-the-art open-source systems on standard benchmarks. It is the direct foundation for OKVIS2-X, which extends the same framework with depth, LiDAR, and GNSS.

## Related

- [OKVIS](okvis.md)
- [OKVIS2-X](okvis2-x.md)
- [IMU preintegration](imu-preintegration.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [VINS-Mono](vins-mono.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)

[Back to Level 6](../README.md#level-6-vio--vins)
