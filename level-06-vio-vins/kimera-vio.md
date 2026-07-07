# Kimera-VIO

> Rosinol 2020 · [Paper](https://arxiv.org/abs/1910.02490)

**One-line summary** — The fast stereo-inertial odometry module of the Kimera library: on-manifold IMU preintegration plus GTSAM structureless vision factors solved by iSAM2 fixed-lag smoothing — the state-estimation core of a real-time, CPU-only metric-semantic SLAM pipeline.

## Problem

Robots operating around people need more than a trajectory: they need a metrically accurate *and semantically labeled* model of the scene. Existing open libraries (ORB-SLAM, VINS-Mono, OKVIS, ROVIO) stop at poses and sparse points, while real-time metric-semantic systems (SLAM++, SemanticFusion, Voxblox++) rely on RGB-D sensing and mostly GPUs. Kimera goes "beyond existing visual and visual-inertial SLAM libraries ... by enabling mesh reconstruction and semantic labeling in 3D" — with visual-inertial sensing, on a CPU, in real time — anchored by a VIO front-end fast and accurate enough to carry the whole stack.

## Method & architecture

Kimera takes stereo frames and high-rate IMU data and is parallelized across four threads hosting four modules:

- **Kimera-VIO** implements the keyframe-based maximum-a-posteriori visual-inertial estimator of Forster et al. as a fixed-lag (or optionally full) smoother. The *front-end* performs on-manifold IMU preintegration between keyframes and, on the vision side, detects Shi-Tomasi corners, tracks them with the Lucas-Kanade tracker, finds left-right stereo matches, and runs geometric verification — 5-point RANSAC (mono) and 3-point RANSAC (stereo), with optional 2-point/1-point variants using the IMU rotation. Detection, stereo matching, and verification run only at keyframes; intermediate frames are tracked. The *back-end* adds preintegrated IMU factors and the **structureless vision model** to a GTSAM factor graph solved with iSAM2: at each iteration, observed features are triangulated by DLT from current pose estimates and the 3D points are analytically eliminated from the VIO state, after removing degenerate points (behind camera, low parallax) and outliers (large reprojection error). States beyond the smoothing horizon are marginalized out; the front-end publishes state estimates at IMU rate.
- **Kimera-RPGO** detects loop closures with DBoW2 bag-of-words plus mono/stereo geometric verification, then applies a robust PGO with *incremental Pairwise Consistent Measurement set maximization (PCM)*: each loop must be consistent with the odometry along its cycle (Chi-squared test) and pairwise consistent with previous loops, tracked in an adjacency matrix $\boldsymbol{A}\in\mathbb{R}^{L\times L}$ grown incrementally; a fast maximum-clique search selects the largest consistent set before Gauss–Newton optimization.
- **Kimera-Mesher** builds a per-frame 3D mesh in under 5 ms by 2D Delaunay triangulation over tracked features back-projected with back-end depth, and a multi-frame mesh over the VIO horizon; detected planar surfaces feed regularity factors back into the VIO — a tight coupling of mesh regularization and state estimation.
- **Kimera-Semantics** runs dense stereo (semi-global matching) per keyframe, fuses the point cloud into a Voxblox TSDF via bundled raycasting while Bayesian-updating per-voxel semantic label probabilities from 2D segmentations, and extracts the global metric-semantic mesh with marching cubes.

The modules "can be run in isolation or in combination, hence Kimera can easily fall back to a state-of-the-art VIO or a full SLAM system."

## Results

On EuRoC (RMSE ATE, SE(3) alignment), Kimera achieves top performance per category: in fixed-lag smoothing, Kimera-VIO reaches 0.05–0.35 m (e.g., MH_1 0.11, V1_3 0.07) vs OKVIS 0.09–0.47, MSCKF 0.10–1.13, ROVIO 0.10–0.52, VINS-Mono 0.08–0.32; with full smoothing 0.04 m on MH_1 where SVO-GTSAM fails three V sequences; with loop closures, Kimera-RPGO gets 0.19 m on V2_3 where VINS-LC reports 1.39 m. Robustness: without PCM, PGO error explodes to 1.74 m as the DBoW2 threshold $\alpha$ loosens, while Kimera-RPGO stays at ~0.05 m for every $\alpha$ — no parameter tuning needed. Geometry: the global semantic mesh is accurate to 0.35–0.48 m against EuRoC ground-truth clouds; the fast multi-frame mesh is up to 24% noisier but two orders of magnitude faster. In a photo-realistic simulator, Kimera-Semantics reaches 80.03% mIoU with ground-truth depth and Kimera-VIO poses (ATE 0.04 m), dropping to 57.23% with dense stereo. Timing (CPU): IMU preintegration ~40 µs (>200 Hz state output), tracking 4.5 ms/frame, keyframe processing 45 ms, back-end <40 ms, RPGO ~55 ms, semantics ~0.1 s per keyframe.

## Why it matters for SLAM

Kimera showed that a clean, modular open-source stack can go from raw stereo+IMU to a semantically labeled 3D mesh in real time on a CPU — making it both a practical VIO baseline and the substrate for a whole research lineage: 3D Dynamic Scene Graphs, Hydra, and Kimera-Multi all build on this front-end. Its GTSAM smart-factor + iSAM2 recipe is now a standard alternative to Ceres-style sliding-window optimization, and Kimera-RPGO's robust pose graph optimization is used as a standalone library.

## Hands-on

- [Run Kimera](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/kimera)

## Related

- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the IMU factor Kimera-VIO uses.
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — the scene-understanding layer built on this VIO.
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — the multi-robot extension.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 machinery underneath.
- [GNC](../level-05-deep-learning/gnc.md) — robust optimization later adopted in Kimera-RPGO.
- [MSCKF](msckf.md) — the filtering ancestor of the structureless measurement idea.
