# FlowNet3D

> Liu 2019 · [Paper](https://arxiv.org/abs/1806.01411)

**One-line summary** — First end-to-end deep network for 3D scene flow on point clouds, using a PointNet++ backbone with novel flow embedding layers to predict a 3D motion vector for every point.

## Key ideas

- **From 2D flow to 3D scene flow**: optical flow lives in image space, but LiDAR-equipped robots need to know where each 3D point moves between consecutive scans. Point clouds are sparse, unordered, and grid-free, so standard CNNs do not apply.
- **PointNet++ backbone**: set abstraction layers hierarchically downsample and aggregate features from the source cloud $P_1$ and target cloud $P_2$.
- **Learned soft correspondence**: for each source point, a mixture over nearby target points is computed with learned weights over spatial and feature similarity, $\mathbf{fe}_i = \sum_{j \in \mathcal{N}(i)} w_{ij}\, h(\mathbf{f}_{2,j} - \mathbf{f}_{1,i})$ — no hard matching required.
- **Flow embedding + refinement**: the correspondence signal is encoded into a per-point flow embedding, then feature-propagation layers upsample and refine it back to full resolution, outputting per-point translations $\Delta\mathbf{x}_i \in \mathbb{R}^3$.
- Outperformed ICP-based baselines on KITTI scene flow and runs in roughly a tenth of a second per frame on GPU for thousands of points.

## Why it matters for SLAM

FlowNet3D founded deep scene-flow estimation on point clouds, which is how LiDAR SLAM systems can detect and handle dynamic objects — separating moving vehicles and pedestrians from the static structure that mapping should rely on. Its soft-correspondence layer for unordered point sets influenced a wave of successors (PointPWC-Net, FLOT, FastFlow3D) and complements image-based scene flow like RAFT-3D on the RGB-D side.

## Related

- [FlowNet](flownet.md) — the 2D optical-flow ancestor whose name it inherits
- [RAFT-3D](raft-3d.md) — scene flow from RGB-D imagery with rigid-motion structure
- [RAFT](raft.md) — modern dense 2D correspondence backbone
- [LiDAR](../level-02-getting-familiar/lidar.md) — the sensor producing the point clouds this operates on

[Back to Level 5](../README.md#level-5-applying-deep-learning)
