# OKVIS2-X

> Boche & Leutenegger 2025 · [Paper](https://arxiv.org/abs/2510.04612)

**One-line summary** — OKVIS2-X extends OKVIS2 into a unified multi-sensor SLAM system that fuses visual, inertial, measured or learned depth, LiDAR, and GNSS measurements while building dense volumetric occupancy maps that scale to multi-kilometer environments in real time.

## Problem

Most state-of-the-art SLAM systems produce accurate trajectories but only sparse landmark maps that are not directly usable for autonomous navigation, and each system is typically built around one fixed sensor suite. A robot that carries cameras, an IMU, a depth or LiDAR sensor, and a GNSS receiver has traditionally needed to stitch together separate VIO, LiDAR-inertial, and mapping stacks. OKVIS2-X asks for all of it at once: highest state-estimation accuracy and robustness, dense globally consistent volumetric maps, scalability to large environments, and real-time operation — in a single configurable framework.

## Key ideas

- **One estimator, many sensors**: cameras, IMU, dense depth (measured RGB-D or learned monocular depth), LiDAR point clouds, and GNSS are all integrated into a single keyframe-based factor-graph framework inherited from OKVIS2, each modality contributing its own factors.
- **Dense volumetric occupancy mapping**: unlike most sparse-landmark SLAM systems, OKVIS2-X advocates dense volumetric map representations whenever depth or range sensing is available, producing maps directly usable for autonomous navigation (collision checking, path planning).
- **Submapping for scale**: the environment is split into submaps, each holding a local volumetric map, allowing the system to remain real-time on large sequences — showcased on sequences of up to 9 km — while staying globally consistent.
- **Map alignment factors**: the estimator and the submaps are tightly coupled through map alignment factors, so dense mapping improves trajectory accuracy and robustness rather than being a passive by-product of localization.
- **Learned depth as a sensor**: when no depth or LiDAR hardware is present, a learned monocular depth network can supply the dense depth input, letting the same volumetric pipeline run on vision-only platforms.
- **GNSS integration**: fusing GNSS measurements globally references the map and bounds long-range drift outdoors, within the same unified factor graph.
- **Online extrinsics calibration**: camera extrinsics can optionally be refined online for additional accuracy and robustness.

## Results & impact

Per the paper: OKVIS2-X achieves the highest trajectory accuracy on EuRoC against state-of-the-art alternatives, outperforms all competitors in the Hilti22 VI-only benchmark while also proving competitive in the LiDAR version, and shows state-of-the-art accuracy on the diverse, large-scale sequences of the VBR dataset. Scalability is demonstrated on sequences up to 9 kilometers, and the system delivers globally consistent maps directly usable for autonomous navigation. It is fully open source, making it one of the most complete multi-sensor SLAM references available.

## Why it matters for SLAM

OKVIS2-X represents the current frontier of open-source multi-sensor SLAM: it shows that the sliding-window + pose-graph architecture pioneered by OKVIS/OKVIS2 generalizes cleanly from a camera-IMU pair to a full sensor suite including LiDAR and GNSS. For practitioners it is a single configurable system covering use cases that previously required stitching together separate VIO, LiDAR-inertial, and mapping stacks — a good study target for how modern estimators unify heterogeneous measurements.

## Related

- [OKVIS2](okvis2.md)
- [OKVIS](okvis.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [Multi-Sensor Fusion SLAM Survey](../level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md)

[Back to Level 6](../README.md#level-6-vio--vins)
