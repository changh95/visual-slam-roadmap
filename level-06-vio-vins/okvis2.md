# OKVIS2

> Leutenegger 2022 · [Paper](https://arxiv.org/abs/2202.09199)

**One-line summary** — OKVIS2 upgrades the classic OKVIS sliding-window VIO into a real-time, scalable visual-inertial *SLAM* system by marginalizing common observations into pose-graph edges that can be fluidly turned back into landmarks upon loop closure.

## Key ideas

- **Reactivatable landmarks / improved marginalization**: instead of irreversibly compressing old landmarks into a dense Schur-complement prior, marginalized observations become sparse pose-graph edges between the co-observing keyframes. At loop closure these edges are converted back into explicit landmarks and reprojection factors.
- **One factor graph, two roles**: a bounded-size real-time factor graph mixes reprojection factors, IMU preintegration error terms, and pose-graph edges — so the system moves seamlessly between "odometry mode" and "full SLAM mode" without a map reset.
- **Asynchronous large-loop optimization**: bigger loops are optimized asynchronously by re-using the same factor graph, keeping the real-time estimator bounded while still achieving global consistency after long and repeated loop closures.
- **Multi-session capability**: because past maps are kept as a compact pose graph with recoverable landmarks, previously built maps can be re-entered and extended across sessions.
- Retains OKVIS's tightly-coupled, keyframe-based, multi-camera + IMU design with nonlinear least-squares optimization.

## Why it matters for SLAM

OKVIS (2015) defined the sliding-window optimization + marginalization architecture for VIO, but like all sliding-window estimators it could not undo marginalization when a loop was found. OKVIS2's pose-graph-edge representation is a principled middle ground between Schur-complement priors and full landmark retention, and it achieves or in part outperforms state-of-the-art open-source systems on standard benchmarks. It is the direct foundation for OKVIS2-X, which extends the same framework with depth, LiDAR, and GNSS.

## Related

- [OKVIS](okvis.md)
- [OKVIS2-X](okvis2-x.md)
- [IMU preintegration](imu-preintegration.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [VINS-Mono](vins-mono.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
