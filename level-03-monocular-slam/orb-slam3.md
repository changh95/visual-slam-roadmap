# ORB-SLAM3

> Campos 2020 · [Paper](https://arxiv.org/abs/2007.11898)

**One-line summary** — The first SLAM library to support visual, visual-inertial, and multi-map SLAM across monocular, stereo, and RGB-D cameras with pinhole and fisheye models, substantially improving accuracy over prior systems.

## Problem

ORB-SLAM2 lacked IMU integration and could not recover from tracking failures: once tracking was lost, the map was effectively gone. Real-world deployments — AR headsets, drones, long robot missions — require surviving temporary occlusion, degenerate motion, and long periods of poor visual information. ORB-SLAM3 (IEEE TRO, University of Zaragoza) addresses both gaps: tightly-integrated visual-inertial estimation and a multi-map mechanism that turns tracking loss from a catastrophe into a recoverable event.

## Key ideas

- **Multi-map Atlas**: when tracking is lost, a new map is started automatically and stored in an Atlas; when a previously mapped area is revisited, maps are seamlessly merged via place recognition and $\mathrm{Sim}(3)$/$\mathrm{SE}(3)$ alignment. The system thus "is able to survive to long periods of poor visual information" (abstract).
- **Tightly-coupled visual-inertial SLAM via MAP estimation**: IMU preintegration factors ($\Delta\mathbf{R}_{ij}, \Delta\mathbf{v}_{ij}, \Delta\mathbf{p}_{ij}$) are jointly optimised with visual reprojection errors in bundle adjustment — the abstract calls it "a feature-based tightly-integrated visual-inertial SLAM system that fully relies on Maximum-a-Posteriori (MAP) estimation, even during the IMU initialization phase".
- **MAP-based IMU initialisation**: gravity direction, scale, IMU biases, and velocities are estimated by maximum-a-posteriori optimisation rather than ad-hoc heuristics, giving fast, reliable inertial bootstrap.
- **Improved place recognition**: a DBoW2-based method with stronger geometric verification raises recall, which is what makes both loop closing and multi-map merging dependable.
- **Reuse of *all* past information**: unlike odometry systems that only use the last few seconds, ORB-SLAM3 can include in BA co-visible keyframes that "provide high parallax observations boosting accuracy, even if they are widely separated in time or if they come from a previous mapping session" (abstract).
- **Broad sensor support**: monocular, stereo, and RGB-D with pinhole *and* fisheye lens models, all in the familiar ORB-SLAM three-thread architecture extended with an Atlas manager.

## Results & impact

Per the abstract, the tightly-integrated VI system is "2 to 5 times more accurate than previous approaches"; in experiments across all sensor configurations ORB-SLAM3 is as robust as the best available systems and significantly more accurate. Notably, stereo-inertial SLAM achieves an average accuracy of 3.6 cm on the EuRoC drone benchmark and 9 mm under quick hand-held motions in the TUM-VI room sequences — a setting representative of AR/VR. The open-source release became the standard baseline in hundreds of subsequent papers and a common starting point for production systems.

## Why it matters for SLAM

ORB-SLAM3 is the culmination of the feature-based SLAM lineage that began with PTAM and ORB-SLAM, and on release it was the most complete and accurate open-source SLAM library available. The multi-map Atlas made lifelong, failure-tolerant operation practical, and its MAP-based visual-inertial initialisation set a new standard for VIO systems. It remains one of the most common baselines and one of the most common production starting points in the field.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM2](orb-slam2.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Basalt](../level-06-vio-vins/basalt.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
