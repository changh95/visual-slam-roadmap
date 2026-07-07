# Kimera / 3D Dynamic Scene Graph

> Rosinol 2020 · [Paper](https://arxiv.org/abs/2002.06289)

**One-line summary** — Introduces the 3D Dynamic Scene Graph (DSG) — a layered, actionable world model spanning mesh, objects, agents, places, rooms, and building — and SPIN, the first fully automatic Spatial PerceptIon eNgine that builds one from stereo + IMU data using the open-source Kimera metric-semantic SLAM library.

## Problem

Geometric SLAM produces metric maps — point clouds, meshes, volumetric models — that are flat and unstructured, while metric-semantic mapping adds labels but stays non-hierarchical: neither can ground a command like "search for survivors on the second floor of the tall building" or feed both motion planning (fine meshes) and task planning (abstract concepts) from one representation. Early hierarchical maps were 2D, static, and pre-deep-learning; the pioneering 3D scene graphs of Armeni et al. and Kim et al. were built semi-automatically or offline, captured no actionable information such as traversability, and ignored dynamic entities. The paper asks how to represent moving agents — humans in particular — inside one hierarchical spatial representation, built automatically from visual-inertial data.

## Method & architecture

**The DSG** is a layered directed graph where nodes are spatially grounded semantic concepts and edges are pairwise spatio-temporal relations ("agent A is in room B at time $t$"). Five layers for a single-story indoor scene:

1. **Metric-semantic mesh** — vertices with position, normal, RGB, and panoptic label; faces define topology.
2. **Objects and agents** — objects carry pose, bounding box, and class; agents (humans, robots) carry a time-stamped 3D pose graph, a mesh model, and a class.
3. **Places and structures** — places sample free space, edges encode straight-line traversability (a topological map for planning); structures are walls/floor/ceiling.
4. **Rooms** — connected by adjacency (door) edges, each linked to the places it contains.
5. **Building** — a root node connected to all rooms. The hierarchy is compositional (e.g., a "Level" layer can be inserted for multi-story buildings).

**SPIN pipeline** (input: stereo + IMU; mesh and agents built incrementally in real time, higher layers at end of run):

- **Layer 1 via Kimera**: Kimera-VIO (IMU preintegration + fixed-lag smoothing), Kimera-RPGO (robust pose-graph optimization), Kimera-Mesher, and Kimera-Semantics, which fuses 2D panoptic segmentation into a Voxblox-based volumetric model with Bayesian label updates and extracts a semantic mesh plus an ESDF.
- **Crowd-robust VIO (DVIO)**: the Lucas-Kanade tracker is replaced by IMU-aware optical flow, and 5-point RANSAC by 2-point RANSAC that uses the IMU rotation to prune outlier feature tracks.
- **Human nodes**: a Graph-CNN regresses SMPL mesh vertices (6890 vertices, 23 joints) per detection; full pose is recovered with PnP. Each human is tracked by a pose graph with zero-velocity motion factors and per-detection prior factors; a detection $d_{t}$ is associated to track $h^{(i)}_{1:t-1}$ only if every joint moves less than 3 m per second (detections at image borders or under 30 pixels are rejected). **Dynamic masking** feeds human pixels back to Kimera-Semantics as free-space-only rays so walkers leave no "contrails" in the mesh.
- **Object nodes**: the class-labeled mesh is split into instances by Euclidean clustering (threshold twice the 0.1 m voxel size) giving centroid + bounding box; if a CAD model exists, 3D Harris keypoints (0.15 m radius) are matched and registered with TEASER++ to recover a full object pose.
- **Places and rooms**: a topological graph is sampled from the ESDF; rooms come from a 2D ESDF section cut 0.3 m below the detected ceiling and truncated above 0.2 m so door openings disconnect — places are labeled by the component they fall in, remaining ones by majority voting over graph neighbors.

## Results

Evaluated in a photo-realistic 65m x 65m Unity office (the released uHumans datasets: uH_01/02/03 with 12, 24, 60 humans) plus EuRoC:

- **VIO in crowds** (ATE, cm): on uH_03, 5-point RANSAC 160 → 2-point 111 → DVIO 88; on static EuRoC the approach stays on par with the state of the art (e.g., MH_01: 9.3 → 8.1).
- **Dynamic masking**: mesh RMSE with ground-truth poses on uH_03 drops from 0.192 m to 0.061 m; the gain persists with VIO poses.
- **Human tracking**: mean torso localization error improves from 1.20 m (single-image detections, uH_03) to 0.63 m with the pose-graph tracker; unknown-shape objects localize within 1.31–1.70 m, CAD-fitted (TEASER++) objects within 0.20–0.38 m.
- **Room parsing**: place-to-room classification reaches 99.89% precision / 99.84% recall on uH_01, with errors confined to doorways.

## Why it matters for SLAM

This is the paper that reconciled visual-inertial SLAM with dense human mesh tracking and generalized SLAM into a "spatial perception engine" — SLAM becomes one module inside a system that also infers relations, dynamics, and abstractions. The DSG's bounding-volume hierarchy gives fast collision checking, its place graph gives hierarchical planning, and its layered pruning gives principled map compression for long-term autonomy. Kimera became the default open-source research platform for metric-semantic SLAM, and the DSG data structure directly seeded Hydra and the entire hierarchical scene-graph line.

## Hands-on

- [Run Kimera](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/kimera)

## Related

- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — the visual-inertial front-end in detail
- [Hydra](hydra.md) — makes DSG construction real-time and incremental
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot extension
- [GNC](../level-02-getting-familiar/gnc.md) — robust estimation from the same lab, used in later scene-graph optimizers
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — earlier semantic label fusion in dense SLAM
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the back-end machinery behind robot and human trajectory estimation
