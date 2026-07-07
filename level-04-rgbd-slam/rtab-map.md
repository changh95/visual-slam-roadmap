# RTAB-Map

> Labbé 2019 · [Paper](https://doi.org/10.1002/rob.21831)

**One-line summary** — A memory-managed, multi-sensor open-source SLAM library supporting RGB-D, stereo, and LiDAR, whose bounded-time loop closure detection enables large-scale, long-term, and multi-session operation.

## Problem

Long-duration SLAM accumulates an ever-growing map, and loop-closure retrieval that scans all stored locations grows with it — eventually violating real-time constraints. For robots operating over hours, days, or multiple sessions, loop closure must run in bounded time regardless of exploration duration. Separately, real-world robots carry diverse sensor suites (stereo outdoors, RGB-D indoors, 2D/3D LiDAR, wheel odometry), yet most research systems supported exactly one configuration; a unified, deployable framework was missing.

## Key ideas

- **Memory management for bounded-time loop closure**: locations are partitioned into a fixed-size working memory (WM) and a long-term memory (LTM); only WM participates in loop-closure retrieval, so detection cost is $O(|\text{WM}|) = O(1)$ regardless of total map size. When WM overflows, the least recently accessed locations are transferred to LTM; locations implicated in loop-closure hypotheses are retrieved back into WM, along with their graph neighborhoods.
- **Bayesian appearance-based loop closure**: bag-of-words similarity feeds a Bayesian filter over WM locations; a loop closure is accepted when the posterior exceeds a threshold, with temporal-consistency filtering to reject spurious matches, followed by geometric verification before a constraint is added.
- **Multi-sensor odometry front-ends**: pluggable odometry sources — visual (RGB-D or stereo, frame-to-map or frame-to-frame), LiDAR (2D/3D ICP scan matching), and wheel odometry — can be used independently or fused as weighted residuals in a single pose estimate:
  $$\mathbf{T}_{k}^{k+1} = \arg\min_{\mathbf{T}} \sum_{s \in \mathcal{S}} w_s \left\| \mathbf{e}_s(\mathbf{T}) \right\|^2_{\boldsymbol{\Sigma}_s}$$
- **Proximity-based loop closure**: in addition to appearance-based detection, spatially nearby graph nodes are checked with ICP scan matching — particularly effective with LiDAR, and complementary to visual place recognition when the camera viewpoint has changed.
- **Multi-session mapping**: maps from separate sessions can be loaded, aligned (via loop closures or GPS priors), and merged into one globally consistent pose graph, enabling incremental mapping over days or weeks.
- **Practical ROS integration**: ships as a standard ROS package producing occupancy grids and point clouds directly consumable by navigation stacks — a key reason for its adoption far beyond the SLAM research community.

## Results & impact

The original memory-management paper (IROS 2014) showed constant loop-closure processing time — under 700 ms per frame — even on maps with thousands of locations, with trajectory accuracy competitive with unbounded-retrieval systems. The 2019 Journal of Field Robotics version evaluated across KITTI (stereo + LiDAR), TUM RGB-D, EuRoC (stereo), and custom outdoor datasets, achieving accuracy competitive with specialized single-sensor systems (ORB-SLAM2, LOAM) while supporting all sensor types in one framework, and demonstrated multi-session outdoor mapping over 4 km trajectories. RTAB-Map became one of the most versatile and widely deployed open-source SLAM libraries in ROS.

## Why it matters for SLAM

RTAB-Map is one of the most widely deployed SLAM systems in practical robotics: its combination of bounded-time loop closure, support for virtually every common sensor configuration, and turnkey ROS integration lets non-specialists get reliable mapping running with minimal configuration. It is the go-to baseline when you need a robust, full-featured SLAM stack on a real robot rather than a research prototype, and its memory-management design remains the reference approach for long-term SLAM scalability.

## Related

- [RGBD-SLAM-V2](rgbd-slam-v2.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
