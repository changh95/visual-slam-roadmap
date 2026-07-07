# Kimera / 3D Dynamic Scene Graph

> Rosinol 2020 · [Paper](https://arxiv.org/abs/2002.06289)

**One-line summary** — Complete open-source metric-semantic SLAM library (visual-inertial odometry + robust pose-graph optimization + CPU meshing + semantic label fusion) whose companion 3D Dynamic Scene Graph work organizes the resulting map into a hierarchical, layered world model.

## Problem

Geometric SLAM produces metric maps — point clouds, surfels, meshes — that are flat and unstructured: they cannot answer questions like "how many chairs are in the kitchen?" or "which room is adjacent to the corridor?". Semantic SLAM systems add class labels but still lack hierarchical structure, and no open-source library provided a complete pipeline from raw stereo + IMU data to a dense semantic 3D map running in real time on a laptop CPU. The 3D Dynamic Scene Graph paper additionally asks how to represent *dynamic* entities — humans and robots moving through the scene — inside one actionable spatial representation that supports planning and decision-making.

## Key ideas

- **Kimera-VIO**: Stereo/monocular visual-inertial odometry front-end with IMU preintegration and FAST + KLT feature tracking, using iSAM2 fixed-lag smoothing with structureless smart factors over a sliding keyframe window.
- **Kimera-RPGO**: Robust pose-graph optimizer that rejects outlier loop closures via Graduated Non-Convexity (GNC) instead of RANSAC-style gating:

  $$\min_{\mathbf{T}_{1:N}} \sum_{(i,j)\in\mathcal{E}} \rho_\mu\!\left(\left\|\log\!\left(\mathbf{T}_i^{-1}\mathbf{T}_j\,\tilde{\mathbf{T}}_{ij}^{-1}\right)^{\!\vee}\right\|^2_{\mathbf{\Omega}_{ij}}\right)$$

  where the surrogate $\rho_\mu$ is annealed toward an $\ell_0$-like cost, automatically down-weighting false loop closures.
- **Kimera-Mesher**: Lightweight CPU-based mesher with a local-to-global strategy — a per-keyframe local mesh is stitched into a global 3D mesh as the camera moves. No GPU required.
- **Kimera-Semantics**: Projects 2D CNN semantic segmentation onto the 3D mesh via volumetric label integration, accumulating a label probability distribution across views; **Kimera-PGMO** jointly deforms the mesh with the pose graph after loop closures.
- **3D Dynamic Scene Graph (Kimera-DSG)**: A hierarchical graph with layers for the metric-semantic mesh, objects (3D bounding boxes with class labels), places (free-space nodes with navigability edges), rooms, and buildings — plus dynamic agents (humans, robots) tracked as time-varying nodes with spatio-temporal relations.
- **Spatial PerceptIon eNgine (SPIN)**: The first fully automatic engine to build a DSG from visual-inertial data, integrating object and human detection and pose estimation, and robustly inferring object, robot, and human nodes in crowded scenes — the first work to reconcile visual-inertial SLAM with dense human mesh tracking.

## Results & impact

The full Kimera pipeline — visual-inertial odometry, robust pose-graph optimization, meshing, and semantic label fusion — runs in real time on a laptop CPU without a GPU. The 3D Dynamic Scene Graph engine was demonstrated in a photo-realistic Unity-based simulator, where its robustness and expressiveness were assessed. Kimera became the default open-source research platform for metric-semantic SLAM, and the DSG concept directly seeded Hydra and the whole hierarchical scene-graph line.

## Why it matters for SLAM

Kimera was the first widely used open-source pipeline going from raw stereo + IMU data all the way to a dense semantic 3D map in real time on a laptop CPU, so it became the default research platform for metric-semantic SLAM. The 3D Dynamic Scene Graph introduced the vocabulary and data structure for hierarchical spatial reasoning that Hydra later made real-time, and Kimera's modules (VIO, GNC-based robust PGO) are reused as standalone components across the field, including in multi-robot systems.

## Related

- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — the visual-inertial front-end in detail
- [Hydra](hydra.md) — real-time scene-graph successor
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot extension
- [GNC](gnc.md) — the robust optimization behind Kimera-RPGO
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — earlier semantic label fusion in dense SLAM
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the back-end problem Kimera-RPGO robustifies

[Back to Level 5](../README.md#level-5-applying-deep-learning)
