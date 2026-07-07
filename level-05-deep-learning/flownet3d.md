# FlowNet3D

> Liu 2019 · [Paper](https://arxiv.org/abs/1806.01411)

**One-line summary** — First end-to-end deep network for 3D scene flow on point clouds, using a PointNet++ backbone with novel flow embedding layers to predict a 3D motion vector for every point.

## Problem

Robotics and human-computer interaction need to understand the 3D motion of points in a dynamic environment — *scene flow* — but most prior methods estimated it from stereo or RGB-D images, with few attempts to work directly on point clouds. LiDAR point clouds are sparse, unordered, and grid-free, so standard CNNs (and image-space optical flow architectures) do not apply. FlowNet3D asks how to learn per-point 3D motion end-to-end from raw pairs of point clouds.

## Key ideas

- **From 2D flow to 3D scene flow**: instead of pixel displacements, the network outputs a translation vector $\Delta\mathbf{x}_i \in \mathbb{R}^3$ for every point in the source cloud — the 3D analogue of dense optical flow.
- **PointNet++ backbone**: set abstraction layers hierarchically downsample and aggregate deep features from the source cloud $P_1$ and target cloud $P_2$, giving the network multi-scale geometric context on irregular data.
- **Flow embedding layer (new learning layer #1)**: for each source point, a learned soft correspondence over nearby target points aggregates motion evidence, $\mathbf{fe}_i = \sum_{j \in \mathcal{N}(i)} w_{ij}\, h(\mathbf{f}_{2,j} - \mathbf{f}_{1,i})$ — no hard matching between clouds is ever computed.
- **Set upconv refinement (new learning layer #2)**: learned upsampling layers propagate and refine the flow embeddings back to full resolution, smarter than interpolation because they weight neighbors by feature similarity.
- **Synthetic-to-real training**: the network trains purely on synthetic FlyingThings3D data, following the recipe its 2D namesake established.

## Results & impact

- Trained on synthetic data only, it successfully generalizes to real LiDAR scans from KITTI, outperforming various baselines and showing competitive results with the prior art.
- Inference on a GPU is fast enough to be practical for robotics use.
- The paper demonstrates two downstream applications of its scene flow output — scan registration and motion segmentation — previewing exactly how SLAM systems would use it.
- Founded deep point-cloud scene flow, inspiring PointPWC-Net, FLOT, FastFlow3D, and self-supervised follow-ups.

## Why it matters for SLAM

FlowNet3D founded deep scene-flow estimation on point clouds, which is how LiDAR SLAM systems can detect and handle dynamic objects — separating moving vehicles and pedestrians from the static structure that mapping should rely on. Its soft-correspondence layer for unordered point sets influenced a wave of successors (PointPWC-Net, FLOT, FastFlow3D) and complements image-based scene flow like RAFT-3D on the RGB-D side.

## Related

- [FlowNet](flownet.md) — the 2D optical-flow ancestor whose name it inherits
- [RAFT-3D](raft-3d.md) — scene flow from RGB-D imagery with rigid-motion structure
- [RAFT](raft.md) — modern dense 2D correspondence backbone
- [LiDAR](../level-02-getting-familiar/lidar.md) — the sensor producing the point clouds this operates on
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md) — the classical matching problem this network learns to soften

[Back to Level 5](../README.md#level-5-applying-deep-learning)
