# RGBD-SLAM-V2

> Endres 2013 · [Paper](https://felixendres.github.io/rgbdslam_v2/)

**One-line summary** — A complete graph-based RGB-D SLAM system ("3-D Mapping With an RGB-D Camera", T-RO 2014) using visual features back-projected to 3D, a beam-based transformation validation model, g2o pose-graph optimization, and OctoMap output — evaluated exhaustively on the TUM RGB-D benchmark.

## Problem

Early RGB-D SLAM approaches lacked a standardized, modular pipeline and reproducible evaluation. Beyond that, feature-based RANSAC and ICP both lack reliable *failure detection*: a low inlier count may just mean low overlap, while repetitive man-made structure (identical chairs, wallpapers) produces confidently wrong transformations. The community needed a robust open baseline that combines color features with dense depth in a principled graph back-end, plus a rigorous benchmark-driven characterization of what actually matters for accuracy.

## Method & architecture

The system splits into the classic frontend / backend / map-representation triad.

**Frontend: egomotion from features + depth.** Keypoints are extracted from the RGB image (SIFT via GPU, SURF, or ORB; descriptor $\mathbf{d} \in \mathbb{R}^{64}$ for SURF) and localized in 3D through the depth image. Matching uses Lowe's nearest/second-nearest ratio test (Hamming distance for ORB; Euclidean or the better-performing Hellinger distance for SIFT/SURF). The relative transformation between two frames is estimated by RANSAC: three 3D-3D correspondences initialize an estimate, inliers are counted by Mahalanobis distance, and the estimate is recursively refined with a decreasing inlier threshold via a closed-form least-squares solution.

**Environment measurement model (EMM).** To validate a candidate transformation independently of how it was estimated, depth points of one frame are projected into the other; each depth pixel implicitly defines a *beam* whose free space observed points must respect. Modeling both measurements of a common surface point with sensor-noise covariances $\Sigma_i, \Sigma_j$, the paper derives

$$p(\mathbf{y}_i \mid \mathbf{y}_j) = \mathcal{N}(\mathbf{y}_i;\, \mathbf{y}_j,\, \Sigma_{ij}), \qquad \Sigma_{ij} = \Sigma_i + \Sigma_j$$

Points within 3 sigma count as inliers; points projected far behind the associated beam are "occluded" and ignored; points landing in observed free space are outliers. A transformation is rejected unless the quality $q = I/(I+O)$ (inliers over inliers-plus-outliers) exceeds a threshold and inliers are at least 25% of observed points — a robust per-point hypothesis test instead of a brittle joint $\chi^2_{3N}$ test.

**Loop-closure search.** Candidate frames for pairwise matching combine (i) $n$ immediate predecessors, (ii) $k$ frames sampled from the geodesic (graph) neighborhood of the previous frame via a limited-depth spanning tree — so found loop closures guide the search for more — and (iii) $l$ frames sampled from designated keyframes for large loops.

**Backend: pose-graph optimization with g2o.** Validated transformations $z_{ij}$ with information matrices $\Omega_{ij}$ form edges of a pose graph over sensor poses $\mathbf{X}$, optimized by minimizing

$$F(\mathbf{X}) = \sum_{\langle i,j\rangle \in \mathcal{C}} e(\mathbf{x}_i, \mathbf{x}_j, z_{ij})^{\top}\, \Omega_{ij}\, e(\mathbf{x}_i, \mathbf{x}_j, z_{ij})$$

After optimization, edges whose Mahalanobis discrepancy is too large are pruned — a second robustness layer against bogus loop closures from repetitive structure.

**Map: OctoMap.** The optimized trajectory projects the clouds into a probabilistic octree occupancy map that explicitly represents free and unknown space (2 cm resolution maps of the test sequences take only 4.2-25 MB) and is directly usable for navigation, unlike raw point clouds.

## Results

Evaluated on the TUM RGB-D benchmark (which the authors co-created) using ATE: $\mathrm{ATE}_{\mathrm{RMSE}} = \sqrt{\tfrac{1}{n}\sum_i \|\mathrm{trans}(\hat{\mathbf{x}}_i) - \mathrm{trans}(\mathbf{x}_i)\|^2}$. Headline numbers (Intel i7 3.4 GHz + GTX 570): ATE RMSE of **0.026 m on fr1/desk** (15.2 Hz), 0.087 m on fr1/room, 0.057 m on fr2/desk, 0.86 m on fr2/large_no_loop, and 1.65 m on a 229 m MIT Stata Center sequence — better than the respective best previously published results on all but fr2/large_no_loop. Feature study: GPU-SIFT is the most accurate (median RMSE 0.04 m over the fr1 sequences, ~600-700 features per frame sufficing), while ORB and Shi-Tomasi+SURF are fast options whose ~15 cm average error suits only benign scenarios; the Hellinger distance improved matching by up to 25.8% on some datasets at no runtime cost. On the challenging "Robot SLAM" Pioneer sequences, geodesic-neighborhood sampling cut average error by 26%, and the EMM (0.82 ms average evaluation) plus edge pruning drastically reduced error, with best results using both. The system is fully open source.

## Why it matters for SLAM

RGBD-SLAM-V2 established the feature-based frontend + pose-graph backend pipeline as the standard baseline for RGB-D SLAM, in contrast to the dense GPU-fusion line started by KinectFusion, and its EMM introduced principled, estimator-independent failure detection using dense depth. Its influence is arguably even larger through the TUM RGB-D benchmark and the ATE/RPE evaluation tools, which nearly every subsequent SLAM paper reports on. It remains a very readable reference implementation of a full classical SLAM system.

## Related

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [DVO](dvo.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [Metrics](../level-02-getting-familiar/metrics.md)
