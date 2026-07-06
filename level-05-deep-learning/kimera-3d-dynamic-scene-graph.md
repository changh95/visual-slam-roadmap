# Kimera / 3D Dynamic Scene Graph

> Rosinol 2020 · [Paper](https://arxiv.org/abs/2002.06289)

**One-line summary** — Complete open-source metric-semantic SLAM library (visual-inertial odometry + robust pose-graph optimization + CPU meshing + semantic label fusion) whose companion 3D Dynamic Scene Graph work organizes the resulting map into a hierarchical, layered world model.

## Key ideas

- **Kimera-VIO**: Stereo/monocular visual-inertial odometry front-end with IMU preintegration and FAST + KLT feature tracking, using iSAM2 fixed-lag smoothing with structureless smart factors.
- **Kimera-RPGO**: Robust pose-graph optimizer that rejects outlier loop closures via Graduated Non-Convexity (GNC) instead of RANSAC-style gating.
- **Kimera-Mesher**: Lightweight CPU-based mesher that stitches per-keyframe local meshes into a global 3D mesh in real time — no GPU required.
- **Kimera-Semantics**: Fuses 2D CNN semantic segmentation into the 3D mesh volumetrically, accumulating a label probability distribution across views; **Kimera-PGMO** jointly deforms the mesh with the pose graph after loop closures.
- **3D Dynamic Scene Graph (Kimera-DSG)**: A hierarchical graph with layers for the metric-semantic mesh, objects, places, rooms, and buildings — and dynamic entities such as humans tracked as time-varying nodes.

## Why it matters for SLAM

Kimera was the first widely used open-source pipeline going from raw stereo + IMU data all the way to a dense semantic 3D map in real time on a laptop CPU, so it became the default research platform for metric-semantic SLAM. The 3D Dynamic Scene Graph introduced the vocabulary and data structure for hierarchical spatial reasoning that Hydra later made real-time, and Kimera's modules (VIO, GNC-based robust PGO) are reused as standalone components across the field, including in multi-robot systems.

## Related

- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — the visual-inertial front-end in detail
- [Hydra](hydra.md) — real-time scene-graph successor
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot extension
- [GNC](gnc.md) — the robust optimization behind Kimera-RPGO
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — earlier semantic label fusion in dense SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
