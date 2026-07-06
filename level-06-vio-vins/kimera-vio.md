# Kimera-VIO
> Rosinol 2020 · [Paper](https://arxiv.org/abs/1910.02490)

**One-line summary** — The fast stereo-inertial odometry front-end of the Kimera library, pairing on-manifold IMU preintegration with GTSAM structureless "smart" vision factors and iSAM2 smoothing — the state-estimation core of a real-time metric-semantic SLAM pipeline.

## Key ideas
- **Lightweight VIO front-end**: FAST corners tracked with KLT optical flow, stereo matching for depth, RANSAC-based outlier rejection, and Forster-style on-manifold IMU preintegration between keyframes.
- **Structureless vision factors**: instead of keeping 3D landmarks in the state, Kimera-VIO uses GTSAM's SmartProjectionFactor, which marginalizes each landmark in closed form during the solve — multi-view constraints without state growth, the smoothing-world analogue of MSCKF's null-space trick.
- **iSAM2 incremental smoothing**: the Bayes-tree-based incremental solver re-linearizes only the part of the factor graph touched by new measurements, giving near-constant-time updates.
- **Modular Kimera pipeline**: Kimera-VIO feeds Kimera-RPGO (robust pose graph optimization with outlier-rejecting loop closures via graduated non-convexity), a real-time 3D mesher, and a metric-semantic reconstruction module that back-projects 2D semantic labels onto the mesh.
- **CPU real-time**: the estimation core runs in real time on a CPU, with accuracy on EuRoC comparable to VINS-Mono-class systems.

## Why it matters for SLAM
Kimera showed that a clean, modular open-source stack can go from raw stereo+IMU to a semantically labeled 3D mesh in real time — making it both a practical VIO baseline and the substrate for a whole research lineage: 3D Dynamic Scene Graphs, Hydra, and Kimera-Multi all build on this front-end. Its GTSAM smart-factor + iSAM2 recipe is now a standard alternative to Ceres-style sliding-window optimization, and its robust pose graph module (GNC-based) is used as a standalone library.

## Related
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the IMU factor Kimera-VIO uses.
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — the scene-understanding layer built on this VIO.
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — the multi-robot extension.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 machinery underneath.
- [GNC](../level-05-deep-learning/gnc.md) — the robust optimization used in Kimera-RPGO.

[Back to Level 6](../README.md#level-6-vio--vins)
