# ORB-SLAM3

> Campos 2020 · [Paper](https://arxiv.org/abs/2007.11898)

**One-line summary** — The first SLAM library to support visual, visual-inertial, and multi-map SLAM across monocular, stereo, and RGB-D cameras with pinhole and fisheye models, substantially improving accuracy over prior systems.

## Key ideas

- **Multi-map Atlas**: when tracking is lost, a new map is started automatically and stored in an Atlas; when a previously mapped area is revisited, maps are seamlessly merged via place recognition and $\mathrm{Sim}(3)$/$\mathrm{SE}(3)$ alignment — no more catastrophic map loss.
- **Tightly-coupled visual-inertial SLAM**: IMU preintegration factors are jointly optimised with visual reprojection errors in bundle adjustment, fusing camera and IMU in one MAP estimation problem.
- **MAP-based IMU initialisation**: gravity direction, scale, IMU biases, and velocities are estimated by maximum-a-posteriori optimisation rather than ad-hoc heuristics, even during initialisation.
- **Improved place recognition**: a DBoW2-based method with stronger geometric verification raises recall, enabling robust loop closure and multi-map merging.
- **Broad sensor support**: monocular, stereo, and RGB-D with pinhole and fisheye lens models, all in the familiar ORB-SLAM three-thread architecture extended with an Atlas manager.

## Why it matters for SLAM

ORB-SLAM3 is the culmination of the feature-based SLAM lineage that began with PTAM and ORB-SLAM, and on release it was the most complete and accurate open-source SLAM library available. The multi-map Atlas made lifelong, failure-tolerant operation practical, and its MAP-based visual-inertial initialisation set a new standard for VIO systems. It remains one of the most common baselines and one of the most common production starting points in the field.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM2](orb-slam2.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Basalt](../level-06-vio-vins/basalt.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
