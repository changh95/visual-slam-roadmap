# SVO

> Forster 2014 · [Paper](https://ieeexplore.ieee.org/document/6906584)

**One-line summary** — A semi-direct visual odometry method that detects FAST corners but tracks them with direct photometric alignment instead of descriptor matching, reaching very high frame rates.

## Problem

Feature-based pipelines (PTAM, later ORB-SLAM) spend most of their per-frame budget extracting and matching descriptors, while dense direct methods (DTAM) need a GPU. Micro aerial vehicles need pose estimates at very high rate and very low latency on small onboard computers, and neither camp fit that budget. SVO (ICRA 2014, University of Zurich) asked: what is the minimum per-frame work needed for accurate motion estimation — and answered by keeping sparse *features* but dropping descriptors and explicit matching entirely.

## Key ideas

- **Semi-direct = features + direct tracking**: FAST corners decide *where* to look, but motion is estimated by minimising photometric error over small patches around the 3D-to-2D projections of map points — no descriptors, no explicit matching, no RANSAC in the tracking loop.
- **Sparse model-based image alignment**: frame-to-frame pose $\mathbf{T}_{k,k-1}$ comes from direct alignment, $\min_{\mathbf{T}} \sum_i \lVert I_k(\pi(\mathbf{T}\,\mathbf{X}_i)) - I_{k-1}(\pi(\mathbf{X}_i)) \rVert^2$, over patches of known-depth points — much cheaper than dense direct methods and faster than descriptor pipelines.
- **Feature alignment refinement**: each patch's 2D position is then refined individually against its reference keyframe, breaking the frame-to-frame drift chain by re-anchoring measurements to older observations.
- **Pose and structure refinement**: motion-only BA and local BA polish poses and 3D points using the refined feature positions — classical reprojection-error optimisation on top of a direct frontend.
- **Probabilistic depth filters**: new features are initialised with a recursive depth filter modelling the depth posterior as a Gaussian (inlier) plus uniform (outlier) mixture; a point enters the map only once its depth estimate has converged, keeping outliers out of the map by construction.

## Results & impact

SVO ran at hundreds of frames per second on laptop-class hardware (the paper reports more than 300 FPS on a consumer laptop and 55 FPS on an onboard embedded computer), which made it the odometry of choice for micro aerial vehicles for years. Its depth-filter initialisation was reused by many later systems, and the semi-direct recipe was extended by SVO2 to multi-camera rigs, fisheye/omnidirectional lenses, and edgelet features.

## Why it matters for SLAM

SVO demonstrated that dropping descriptor computation enables extremely low-latency odometry, making it a favourite for micro aerial vehicles and embedded platforms where compute and latency budgets are tight. It defined the "hybrid" category between feature-based (PTAM, ORB-SLAM) and direct (LSD-SLAM, DSO) methods, and its depth-filter initialisation influenced many later systems. SVO2 extended the approach to multi-camera and wide-angle setups.

## Related

- [PTAM](ptam.md)
- [SVO2](svo2.md)
- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [Visual Odometry](visual-odometry.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
