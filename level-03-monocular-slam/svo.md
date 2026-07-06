# SVO

> Forster 2014 · [Paper](https://ieeexplore.ieee.org/document/6906584)

**One-line summary** — A semi-direct visual odometry method that detects FAST corners but tracks them with direct photometric alignment instead of descriptor matching, reaching very high frame rates.

## Key ideas

- **Semi-direct = features + direct tracking**: FAST corners define where to look, but motion is estimated by minimising photometric error over small patches around the 3D-to-2D projections of map points — no descriptors, no explicit matching.
- **Sparse model-based image alignment**: frame-to-frame pose comes from direct alignment of sparse patches, which is much cheaper than dense direct methods and faster than descriptor pipelines.
- **Feature alignment refinement**: sub-pixel 2D positions of feature projections are refined by direct alignment before pose/structure refinement.
- **Probabilistic depth filters**: new features are initialised with a depth filter modelling depth as a Gaussian (inlier) plus uniform (outlier) mixture that converges over multiple observations.
- **Pose and structure refinement**: motion-only and local bundle adjustment polish poses and 3D points.

## Why it matters for SLAM

SVO demonstrated that dropping descriptor computation enables extremely low-latency odometry, making it a favourite for micro aerial vehicles and embedded platforms where compute and latency budgets are tight. It defined the "hybrid" category between feature-based (PTAM, ORB-SLAM) and direct (LSD-SLAM, DSO) methods, and its depth-filter initialisation influenced many later systems. SVO2 extended the approach to multi-camera and wide-angle setups.

## Related

- [PTAM](ptam.md)
- [SVO2](svo2.md)
- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
