# Kimera-VIO
> Rosinol 2020 · [Paper](https://arxiv.org/abs/1910.02490)

**One-line summary** — The fast stereo-inertial odometry front-end of the Kimera library, pairing on-manifold IMU preintegration with GTSAM structureless "smart" vision factors and iSAM2 smoothing — the state-estimation core of a real-time metric-semantic SLAM pipeline.

## Problem
Robots operating around people need more than a trajectory: they need a metrically accurate *and semantically labeled* model of the scene. Existing open libraries (ORB-SLAM, VINS-Mono, OKVIS, ROVIO) stopped at poses and sparse points, and running dense reconstruction plus semantics alongside SLAM was considered impractical on modest hardware.

Kimera set out to "go beyond existing visual and visual-inertial SLAM libraries ... by enabling mesh reconstruction and semantic labeling in 3D" (abstract) — in real time, on a CPU — with a VIO front-end fast and accurate enough to anchor the whole stack.

## Key ideas
- **Lightweight stereo-inertial front-end.** FAST corners tracked with KLT optical flow, stereo matching for depth, RANSAC-based outlier rejection, and Forster-style on-manifold IMU preintegration between keyframes — deliberately simple components chosen for CPU real-time operation.
- **Structureless "smart" vision factors.** Instead of keeping 3D landmarks in the state, Kimera-VIO uses GTSAM's SmartProjectionFactor: for a feature seen in frames $\{i_1,\dots,i_N\}$, the factor encodes

  $$\min_{\{\mathbf{T}_{WC_k}\}} \sum_{k=1}^{N} \left\| \mathbf{z}_k - \pi\!\big(\mathbf{T}_{WC_k}^{-1}\,{}^W\hat{\mathbf{p}}_f\big) \right\|^2_{\mathbf{R}^{-1}}$$

  where the landmark ${}^W\hat{\mathbf{p}}_f$ is triangulated from the current pose estimates and marginalized in closed form inside the solve — a multi-view constraint over poses only, the smoothing-world analogue of MSCKF's null-space trick, avoiding state growth.
- **iSAM2 incremental smoothing.** The Bayes-tree-based incremental solver re-linearizes only the part of the factor graph touched by new measurements, giving near-constant-time updates without a hand-built sliding window.
- **Four modular components** (per the abstract):
  1. the VIO module for fast, accurate state estimation;
  2. a robust pose graph optimizer (Kimera-RPGO) that rejects outlier loop closures via graduated non-convexity;
  3. a lightweight 3D mesher for fast mesh reconstruction;
  4. a dense metric-semantic reconstruction module that back-projects 2D semantic labels (from a deep network) onto the 3D mesh.
- **Run alone or together.** The modules "can be run in isolation or in combination, hence Kimera can easily fall back to a state-of-the-art VIO or a full SLAM system" — the modularity is itself a design contribution, letting researchers benchmark or replace any single stage.

## Results & impact
Kimera "runs in real-time on a CPU and produces a 3D metric-semantic mesh from semantically labeled images" (abstract), with the VIO module delivering state estimation competitive with the established open-source pipelines it is designed to complement.

Its bigger impact is as a substrate: 3D Dynamic Scene Graphs, Hydra, and Kimera-Multi all build on this front-end, the GTSAM smart-factor + iSAM2 recipe became a standard alternative to Ceres-style sliding windows, and Kimera-RPGO's GNC-based robust pose graph optimization is used as a standalone library.

## Why it matters for SLAM
Kimera showed that a clean, modular open-source stack can go from raw stereo+IMU to a semantically labeled 3D mesh in real time — making it both a practical VIO baseline and the substrate for a whole research lineage: 3D Dynamic Scene Graphs, Hydra, and Kimera-Multi all build on this front-end. Its GTSAM smart-factor + iSAM2 recipe is now a standard alternative to Ceres-style sliding-window optimization, and its robust pose graph module (GNC-based) is used as a standalone library.

## Related
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the IMU factor Kimera-VIO uses.
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — the scene-understanding layer built on this VIO.
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — the multi-robot extension.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 machinery underneath.
- [GNC](../level-05-deep-learning/gnc.md) — the robust optimization used in Kimera-RPGO.
- [MSCKF](msckf.md) — the filtering ancestor of the structureless measurement idea.

[Back to Level 6](../README.md#level-6-vio--vins)
