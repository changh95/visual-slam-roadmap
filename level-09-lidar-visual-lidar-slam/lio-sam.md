# LIO-SAM

> Shan 2020 · [Paper](https://arxiv.org/abs/2007.00258)

**One-line summary** — LIO-SAM reformulated LiDAR-inertial odometry as factor-graph smoothing, letting IMU preintegration, scan-matching, GPS, and loop closures all enter one principled MAP estimation problem.

## Key ideas

- **Factor graph backend**: poses and IMU biases are estimated by jointly optimizing IMU preintegration factors, LiDAR odometry factors, optional GPS (absolute) factors, and loop-closure factors — heterogeneous relative and absolute measurements in a single framework (implemented on GTSAM/iSAM2).
- **IMU preintegration does double duty**: it de-skews the point cloud (per-point motion correction within a sweep) and provides the initial guess for LiDAR scan-matching; in turn, the optimized LiDAR odometry is used to estimate the IMU bias.
- **Keyframes + local sliding window**: instead of matching scans against a global map, new keyframes are registered to a fixed-size set of recent "sub-keyframes," keeping computation bounded and real-time.
- **LOAM-style features**: retains edge/planar feature matching for scan registration, but embeds it in the smoothing framework instead of LOAM's two-stage pipeline.
- Extensively evaluated on datasets from three platforms across various scales and environments; the open-source ROS implementation became one of the most used LiDAR SLAM codebases.

## Why it matters for SLAM

LIO-SAM did for LiDAR what VINS-Mono and OKVIS did for cameras: it made tightly-coupled inertial fusion via graph optimization the default architecture. Its clean separation of measurement sources as factors makes it easy to extend — LVI-SAM adds an entire visual-inertial subsystem on top of it — and it remains the standard factor-graph baseline against which filter-based systems like FAST-LIO2 are compared. Use it when you want loop closure, GPS fusion, and a smoothing backend out of the box.

## Related

- [LOAM](loam.md) — the feature extraction and scan-matching foundation
- [LVI-SAM](lvi-sam.md) — direct extension to LiDAR-visual-inertial fusion
- [FAST-LIO2](fast-lio2.md) — the competing direct, filter-based approach
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — the key inertial machinery
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the backend formalism

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
