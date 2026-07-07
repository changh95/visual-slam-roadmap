# LIO-SAM

> Shan 2020 · [Paper](https://arxiv.org/abs/2007.00258)

**One-line summary** — LIO-SAM reformulated LiDAR-inertial odometry as factor-graph smoothing, letting IMU preintegration, scan-matching, GPS, and loop closures all enter one principled MAP estimation problem.

## Problem

LOAM-style pipelines had no principled way to fuse IMU or GPS: inertial data served only as a motion prior, wasting information and struggling under aggressive motion, and absolute measurements could not be integrated cleanly. At the same time, matching every scan against a global map does not stay real-time as the map grows. LIO-SAM solves both problems at once — a factor graph accepts heterogeneous relative and absolute measurements as factors, and scan-matching at a *local* scale keeps computation bounded.

## Key ideas

- **Factor graph backend**: poses and IMU biases are estimated by jointly optimizing IMU preintegration factors, LiDAR odometry factors, optional GPS (absolute) factors, and loop-closure factors,

  $$\mathbf{X}^* = \arg\min_{\mathbf{X}} \sum \|\mathbf{r}^{\text{IMU}}\|^2_{\Sigma_I} + \sum \|\mathbf{r}^{\text{LiDAR}}\|^2_{\Sigma_L} + \sum \|\mathbf{r}^{\text{GPS}}\|^2_{\Sigma_G} + \sum \|\mathbf{r}^{\text{loop}}\|^2_{\Sigma_{lp}},$$

  where $\mathbf{X}$ contains keyframe poses and IMU biases (implemented on GTSAM/iSAM2).
- **IMU preintegration does double duty**: it de-skews the point cloud (per-point motion correction within a sweep) and provides the initial guess for LiDAR scan-matching optimization; in turn, the optimized LiDAR odometry solution is used to estimate the IMU bias.
- **Keyframes + sliding window of sub-keyframes**: to ensure real-time performance, old LiDAR scans are marginalized rather than matched against a global map; a new keyframe is registered to a fixed-size set of prior "sub-keyframes" merged into a local map — scan-matching at local rather than global scale is one of the paper's headline efficiency choices.
- **Selective keyframing**: keyframes are added only after sufficient motion, keeping the graph compact over long trajectories.
- **LOAM-style features retained**: edge/planar feature matching still does the geometric work of registration, but it is embedded in the smoothing framework instead of LOAM's two-stage pipeline.

## Results & impact

The method was extensively evaluated on datasets gathered from three platforms over various scales and environments (the paper's platforms span handheld, unmanned ground and surface vehicles). The system runs in real time, and GPS factors bound global drift where available. Beyond the numbers, LIO-SAM's open-source ROS implementation became one of the most widely used LiDAR SLAM codebases, and its factor-per-measurement architecture made it the natural base for extensions — most directly LVI-SAM, which adds an entire visual-inertial subsystem.

## Why it matters for SLAM

LIO-SAM did for LiDAR what VINS-Mono and OKVIS did for cameras: it made tightly-coupled inertial fusion via graph optimization the default architecture. Its clean separation of measurement sources as factors makes it easy to extend — LVI-SAM adds an entire visual-inertial subsystem on top of it — and it remains the standard factor-graph baseline against which filter-based systems like FAST-LIO2 are compared. Use it when you want loop closure, GPS fusion, and a smoothing backend out of the box.

## Related

- [LOAM](loam.md) — the feature extraction and scan-matching foundation
- [LVI-SAM](lvi-sam.md) — direct extension to LiDAR-visual-inertial fusion
- [FAST-LIO2](fast-lio2.md) — the competing direct, filter-based approach
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — the key inertial machinery
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the backend formalism

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
