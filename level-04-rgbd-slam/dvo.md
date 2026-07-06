# DVO

> Kerl 2013 · [Project page](https://vision.in.tum.de/data/software/dvo)

**One-line summary** — Direct (featureless) RGB-D odometry that jointly minimizes photometric and depth residuals over all pixels with a robust Student-t error model, later extended with keyframes and pose-graph loop closure into DVO-SLAM.

## Key ideas

- **Direct method, no features**: instead of sparse keypoints, DVO aligns consecutive RGB-D frames by warping every pixel under a candidate motion $\boldsymbol{\xi} \in \mathfrak{se}(3)$ and minimizing the resulting residuals — exploiting all image information, which pays off in texture-poor scenes.
- **Joint photometric + depth residuals**: each pixel contributes both an intensity error and a depth error after warping, combining the strengths of photometric alignment and geometric (ICP-like) alignment in one objective.
- **Robust Student-t weighting**: residuals are modeled with a Student-t distribution rather than a Gaussian, giving weights $w_i = \frac{\nu+1}{\nu + \mathbf{r}_i^\top \Sigma^{-1}\mathbf{r}_i}$ that automatically down-weight outliers from occlusions, specular surfaces, and sensor noise.
- **Coarse-to-fine IRLS**: optimization runs over an image pyramid with iteratively reweighted least squares, enlarging the convergence basin; the method is fast enough for real time on a CPU.
- **Keyframes + loop closure (DVO-SLAM)**: the odometry was extended with keyframe selection and pose-graph optimization, turning drift-prone frame-to-frame alignment into a full SLAM system.

## Why it matters for SLAM

DVO established direct RGB-D odometry as a serious alternative to feature-based pipelines on indoor benchmarks, and its Student-t robust weighting became a standard ingredient of direct methods — the same philosophy of principled robust dense alignment reappears in LSD-SLAM and DSO. It is also the cleanest paper to learn the mechanics of direct alignment (warping, residuals, robust weights, coarse-to-fine) before tackling more complex dense systems.

## Related

- [RGBD-SLAM-V2](rgbd-slam-v2.md) — the feature-based RGB-D contemporary it outperformed
- [KinectFusion](kinectfusion.md) — ICP-based dense tracking against a volumetric model
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md) — direct alignment carried to monocular semi-dense SLAM
- [DSO](../level-03-monocular-slam/dso.md) — sparse direct odometry that adopted robust direct alignment

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
