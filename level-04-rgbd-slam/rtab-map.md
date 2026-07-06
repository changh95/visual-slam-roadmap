# RTAB-Map

> Labbé 2019 · [Paper](https://doi.org/10.1002/rob.21831)

**One-line summary** — A memory-managed, multi-sensor open-source SLAM library supporting RGB-D, stereo, and LiDAR, whose bounded-time loop closure detection enables large-scale, long-term, and multi-session operation.

## Key ideas

- **Memory management for bounded-time loop closure**: locations are split into a fixed-size working memory (WM) and a long-term memory (LTM); only WM participates in loop-closure retrieval, so detection time stays constant regardless of how large the map grows. Locations are transferred to LTM when WM overflows and retrieved back when relevant.
- **Bayesian appearance-based loop closure**: bag-of-words similarity feeds a Bayesian filter over WM locations; hypotheses above a posterior threshold are geometrically verified before adding a constraint.
- **Multi-sensor front-ends**: pluggable odometry sources — visual (RGB-D or stereo, frame-to-map or frame-to-frame), LiDAR (2D/3D ICP scan matching), and wheel odometry — can be used independently or fused, with proximity-based ICP loop closures complementing appearance-based ones.
- **Multi-session mapping**: maps from separate sessions can be aligned and merged into a single globally consistent pose graph, supporting mapping over days or weeks.
- **Practical ROS integration**: ships as a standard ROS package with occupancy-grid and point-cloud outputs usable directly for navigation.

## Why it matters for SLAM

RTAB-Map is one of the most widely deployed SLAM systems in practical robotics: its combination of bounded-time loop closure, support for virtually every common sensor configuration, and turnkey ROS integration lets non-specialists get reliable mapping running with minimal configuration. It is the go-to baseline when you need a robust, full-featured SLAM stack on a real robot rather than a research prototype, and its memory-management design remains the reference approach for long-term SLAM scalability.

## Related

- [RGBD-SLAM-V2](rgbd-slam-v2.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
