# OKVIS2-X

> Boche & Leutenegger 2025 · [Paper](https://arxiv.org/abs/2510.04612)

**One-line summary** — OKVIS2-X extends OKVIS2 into a unified multi-sensor SLAM system that fuses visual, inertial, measured or learned depth, LiDAR, and GNSS measurements while building dense volumetric occupancy maps that scale to multi-kilometer environments in real time.

## Key ideas

- **One estimator, many sensors**: cameras, IMU, dense depth (measured RGB-D or learned monocular depth), LiDAR point clouds, and GNSS are all integrated into a single keyframe-based factor-graph framework inherited from OKVIS2.
- **Dense volumetric occupancy mapping**: unlike most sparse-landmark SLAM systems, OKVIS2-X advocates dense volumetric map representations whenever depth or range sensing is available, producing maps directly usable for autonomous navigation.
- **Submapping for scale**: the environment is split into submaps, allowing the system to remain real-time on large sequences — demonstrated up to 9 km — while staying globally consistent.
- **Map alignment factors**: submaps are tightly coupled with the estimator through inter-submap alignment factors, so dense mapping improves trajectory accuracy rather than being a passive by-product.
- **Online extrinsics calibration**: camera extrinsics can optionally be refined online for additional accuracy and robustness.
- Achieves top trajectory accuracy among comparable systems on EuRoC and the Hilti 2022 SLAM challenge benchmarks; fully open-source.

## Why it matters for SLAM

OKVIS2-X represents the current frontier of open-source multi-sensor SLAM: it shows that the sliding-window + pose-graph architecture pioneered by OKVIS/OKVIS2 generalizes cleanly from a camera-IMU pair to a full sensor suite including LiDAR and GNSS. For practitioners it is a single configurable system covering use cases that previously required stitching together separate VIO, LiDAR-inertial, and mapping stacks — a good study target for how modern estimators unify heterogeneous measurements.

## Related

- [OKVIS2](okvis2.md)
- [OKVIS](okvis.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
