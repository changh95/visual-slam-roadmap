# DVO

> Kerl 2013 · [Project page](https://vision.in.tum.de/data/software/dvo)

**One-line summary** — Direct (featureless) RGB-D odometry that jointly minimizes photometric and depth residuals over all pixels under a robust t-distribution error model, extended with entropy-based keyframe selection and pose-graph loop closure into DVO-SLAM.

## Problem

Feature-based RGB-D odometry discards most of the image by reducing it to sparse keypoints, which starve in texture-poor indoor scenes. Direct methods can exploit every pixel, but dense residuals are contaminated by outliers — occlusions, reflections, dynamic objects, sensor noise — and the authors found that a Gaussian noise assumption fits real residual histograms poorly, letting outliers bias the estimate. Frame-to-frame alignment also inherently drifts. What was missing was a principled probabilistic formulation for robust dense RGB-D alignment, plus a lightweight way to select keyframes and validate loop closures so the drift can be optimized away.

## Method & architecture

Two papers make up "DVO": the ICRA 2013 robust odometry (photometric term, t-distribution, motion prior) and the IROS 2013 dense visual SLAM (adds the depth term, keyframes, loop closure, g2o pose graph).

- **Warping**: a pixel $\mathbf{x}$ with depth $\mathcal{Z}_1(\mathbf{x})$ is reconstructed with the inverse projection $\pi^{-1}$, transformed by the rigid motion $\boldsymbol{T} = \exp(\hat{\boldsymbol{\xi}})$ (twist $\boldsymbol{\xi}\in\mathbb{R}^6$), and reprojected: $\mathbf{x}' = \tau(\mathbf{x},\boldsymbol{T}) = \pi\big(\boldsymbol{T}\,\pi^{-1}(\mathbf{x}, \mathcal{Z}_1(\mathbf{x}))\big)$.
- **Photometric + depth residuals**: each pixel contributes a stacked residual $\mathbf{r} = (r_{\mathcal{I}}, r_{\mathcal{Z}})^\top$ with

$$r_{\mathcal{I}} = \mathcal{I}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \mathcal{I}_1(\mathbf{x}), \qquad r_{\mathcal{Z}} = \mathcal{Z}_2\big(\tau(\mathbf{x},\boldsymbol{T})\big) - \big[\boldsymbol{T}\,\pi^{-1}(\mathbf{x},\mathcal{Z}_1(\mathbf{x}))\big]_Z ,$$

  where $[\cdot]_Z$ is the Z-component; the depth error is equivalent to point-to-plane ICP with projective lookup. Unlike earlier work that combined the two errors linearly with hand-tuned weights, they are modeled jointly.
- **Probabilistic robust estimation**: MAP estimation $\boldsymbol{\xi}^* = \arg\max_{\boldsymbol{\xi}} p(\boldsymbol{\xi} \mid \mathbf{r})$ with the bivariate residual following a t-distribution $p_t(\mathbf{0}, \boldsymbol{\Sigma}, \nu)$ — an infinite mixture of Gaussians whose heavy tails cover outliers. This leads to iteratively re-weighted least squares:

$$\boldsymbol{\xi}^* = \arg\min_{\boldsymbol{\xi}} \sum_{i}^{n} w_i\, \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i, \qquad w_i = \frac{\nu+1}{\nu + \mathbf{r}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i},$$

  with $\nu = 5$ degrees of freedom and the scale matrix $\boldsymbol{\Sigma}$ re-estimated by expectation-maximization at every iteration — no hand-tuned robust-kernel thresholds. Gauss-Newton normal equations $\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \boldsymbol{J}_i\, \Delta\boldsymbol{\xi} = -\sum_i w_i \boldsymbol{J}_i^\top \boldsymbol{\Sigma}^{-1} \mathbf{r}_i$ (2×6 Jacobians $\boldsymbol{J}_i$) are solved coarse-to-fine over an image pyramid. A constant-velocity motion prior can be added, turning the update into $(J^\top W J + \Sigma^{-1})\Delta\boldsymbol{\xi} = -J^\top W \mathbf{r}(\mathbf{0}) + \Sigma^{-1}(\boldsymbol{\xi}_{t-1} - \boldsymbol{\xi}_t^{(k)})$.
- **Entropy-based keyframes and loop closure (DVO-SLAM)**: the approximate Hessian $\boldsymbol{A}$ gives the pose covariance $\boldsymbol{\Sigma}_{\boldsymbol{\xi}} = \boldsymbol{A}^{-1}$, whose entropy is $H(\boldsymbol{\xi}) \propto \ln \lvert\boldsymbol{\Sigma}_{\boldsymbol{\xi}}\rvert$. Frames are matched against the current keyframe until the entropy ratio

$$\alpha = \frac{H(\boldsymbol{\xi}_{k:k+j})}{H(\boldsymbol{\xi}_{k:k+1})}$$

  falls below a threshold, at which point a new keyframe is inserted. Loop-closure candidates are found by metric nearest-neighbour search in a sphere around each keyframe, tested first at coarse resolution, and validated with the same entropy-ratio test; validated constraints enter a keyframe pose graph optimized with g2o, re-searched over all keyframes at the end.

## Results

On the TUM RGB-D benchmark (ICRA paper, drift as RMSE of translational RPE): on fr1/desk the t-distribution weights reduce drift to 0.0458 m/s vs 0.0551 unweighted; averaged over the four "desk" sequences, t-distribution + temporal prior achieves 0.0428 m/s — an 82.35% improvement over the reference method (0.2425 m/s) — and 0.0316 m/s on the fr3 "sitting" dynamic-object sequences. Runtime is real-time (30 Hz) on a single CPU core, with weighted variants around 50 ms per frame. For full DVO-SLAM (IROS paper, freiburg1 set): keyframe tracking alone cuts drift by 16% and pose-graph optimization by 20% on average; absolute trajectory error drops from 0.19 m (frame-to-frame) to 0.07 m. Compared system-to-system (ATE RMSE average), DVO-SLAM reaches 0.034 m vs RGB-D SLAM 0.054 m, MRSMap 0.043 m, and KinFu 0.297 m, e.g. fr1/desk 0.021 m and fr1/xyz 0.011 m. Frame-to-keyframe tracking takes ~32 ms (Intel i7-2600); the average map update takes 135 ms.

## Why it matters for SLAM

DVO established direct RGB-D odometry as a serious alternative to feature-based pipelines, and it remains the cleanest paper for learning the mechanics of direct alignment — warping, stacked residuals, robust weights, coarse-to-fine IRLS — before tackling more complex dense systems. Its t-distribution weighting and entropy-based keyframe/loop-closure criteria became standard ingredients; the direct half of modern SLAM (LSD-SLAM, DSO, dense trackers inside neural SLAM) reads as variations on this theme.

## Related

- [RGBD-SLAM-V2](rgbd-slam-v2.md) — the feature-based RGB-D contemporary it outperformed
- [KinectFusion](kinectfusion.md) — ICP-based dense tracking against a volumetric model
- [ICP](icp.md) — the purely geometric ancestor of DVO's depth residual
- [MRS-Map](mrs-map.md) — surfel-statistics registration compared against in the same benchmark
- [LSD-SLAM](../level-03-monocular-slam/lsd-slam.md) — direct alignment carried to monocular semi-dense SLAM
- [DSO](../level-03-monocular-slam/dso.md) — sparse direct odometry that adopted robust direct alignment
