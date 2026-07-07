# RGBD-SLAM-V2

> Endres 2013 · [Paper](https://felixendres.github.io/rgbdslam_v2/)

**One-line summary** — A complete graph-based RGB-D SLAM system using visual feature matching with depth back-projection and g2o pose-graph optimization, accompanied by the influential TUM RGB-D benchmark and evaluation tools.

## Problem

Early RGB-D SLAM approaches lacked a standardized, modular pipeline and reproducible benchmarks: papers evaluated on private sequences with incompatible metrics, making methods impossible to compare. The community needed two things at once — a robust, open baseline system that combines visual features with depth measurements in a principled graph-based back-end, and a rigorous evaluation framework with ground-truth trajectories and agreed-upon error metrics.

## Key ideas

- **Tracking from color + depth**: visual features (SIFT/SURF/ORB) are extracted from the color image and back-projected to 3D points using the aligned depth image, yielding 3D-3D correspondences between frames — sidestepping the scale ambiguity and triangulation machinery of monocular SLAM.
- **RANSAC relative pose**: the transformation between frames is estimated robustly from the 3D-3D correspondences:
  $$\mathbf{T}_{ij}^* = \arg\min_{\mathbf{T}} \sum_{k \in \text{inliers}} \left\|\mathbf{p}_k^j - \mathbf{T}\,\mathbf{p}_k^i\right\|^2$$
  which has the closed-form (SVD) solution familiar from ICP, wrapped in RANSAC for outlier rejection.
- **Pose graph back-end**: keyframes become nodes and relative transforms become edges; g2o minimizes the sum of squared edge residuals on the manifold,
  $$\mathbf{T}_1^*,\ldots,\mathbf{T}_n^* = \arg\min \sum_{(i,j)\in\mathcal{E}} \left\|\log\!\left(\mathbf{T}_{ij}^{-1}\,\mathbf{T}_i^{-1}\,\mathbf{T}_j\right)^\vee\right\|_{\boldsymbol{\Sigma}_{ij}}^2$$
- **Loop closure with geometric verification**: candidate loop closures are found by matching features against earlier keyframes; RANSAC-based geometric verification filters false positives before edges are added to the graph.
- **Mapping with OctoMap**: the optimized trajectory is used to build a probabilistic octree occupancy map — memory-efficient, explicitly modeling free vs. occupied space, and directly usable for robot navigation (unlike raw point clouds or TSDFs).
- **Benchmark contribution**: the authors co-created the TUM RGB-D benchmark and its ATE (absolute trajectory error) / RPE (relative pose error) evaluation tools, which became the standard way to evaluate RGB-D SLAM and odometry.

## Results & impact

Published in IEEE Transactions on Robotics (2014), the system achieved centimeter-level ATE on the desk and room sequences of the TUM RGB-D benchmark, with ORB features providing the best speed-accuracy trade-off among the descriptors tested. Its deepest impact is methodological: the TUM RGB-D benchmark and the ATE/RPE tools were adopted universally — nearly every subsequent SLAM paper reports on them — and the feature-based front-end + pose-graph back-end pipeline it packaged became the standard baseline architecture for RGB-D SLAM, the same skeleton later perfected by ORB-SLAM2.

## Why it matters for SLAM

RGBD-SLAM-V2 established the feature-based front-end + pose-graph back-end pipeline as the standard baseline for RGB-D SLAM, in contrast to the dense GPU fusion line started by KinectFusion. Its lasting influence is arguably even larger through the TUM RGB-D benchmark and evaluation metrics, which nearly every subsequent SLAM paper reports on. It remains a very readable reference implementation of a full classical SLAM system.

## Related

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [DVO](dvo.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [Metrics](../level-02-getting-familiar/metrics.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
