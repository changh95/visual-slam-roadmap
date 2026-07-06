# RGBD-SLAM-V2

> Endres 2013 · [Paper](https://felixendres.github.io/rgbdslam_v2/)

**One-line summary** — A complete graph-based RGB-D SLAM system using visual feature matching with depth back-projection and g2o pose-graph optimization, accompanied by the influential TUM RGB-D benchmark and evaluation tools.

## Key ideas

- **Tracking from color + depth**: visual features (SIFT/SURF/ORB) are extracted from the color image and back-projected to 3D points using the aligned depth image, yielding 3D-3D correspondences between frames.
- **RANSAC relative pose**: the transformation between frames is estimated robustly from the 3D-3D correspondences:
  $$\mathbf{T}_{ij}^* = \arg\min_{\mathbf{T}} \sum_{k \in \text{inliers}} \left\|\mathbf{p}_k^j - \mathbf{T}\,\mathbf{p}_k^i\right\|^2$$
- **Pose graph back-end**: keyframes become nodes, relative transforms become edges, and the graph is optimized with g2o; loop closures are found by matching features against earlier keyframes with geometric verification.
- **Mapping with OctoMap (2013)**: the optimized trajectory is used to build a probabilistic octree occupancy map, giving a memory-efficient volumetric map usable for robot navigation.
- **Benchmark contribution**: the authors co-created the TUM RGB-D benchmark and the ATE/RPE evaluation tools, which became the standard way to evaluate RGB-D SLAM and odometry.

## Why it matters for SLAM

RGBD-SLAM-V2 established the feature-based front-end + pose-graph back-end pipeline as the standard baseline for RGB-D SLAM, in contrast to the dense GPU fusion line started by KinectFusion. Its lasting influence is arguably even larger through the TUM RGB-D benchmark and evaluation metrics, which nearly every subsequent SLAM paper reports on. It remains a very readable reference implementation of a full classical SLAM system.

## Related

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [DVO](dvo.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
