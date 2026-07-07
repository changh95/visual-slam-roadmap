# GS-ICP SLAM

> Ha 2024 · [Paper](https://arxiv.org/abs/2403.12550)

**One-line summary** — "RGBD GS-ICP SLAM" fuses Generalized ICP tracking and 3DGS mapping through their shared common factor — Gaussians (mean + covariance) — so covariances flow both ways between tracking and mapping, reaching up to 107 FPS for the entire system.

## Problem

Early 3DGS SLAM systems (SplaTAM, MonoGS, GS-SLAM) track the camera by rendering the Gaussian map and minimising dense photometric error — dozens of rasterisation passes per frame — so tracking is slow, while decoupled systems (Photo-SLAM, Orbeez-SLAM, vMAP) bolt an ORB-SLAM frontend onto a neural map, requiring "separate maps containing ORB feature information for tracking" whose computations are never reused for mapping. GS-ICP SLAM's observation: a 3D Gaussian already *is* a probability distribution, and G-ICP registration needs exactly means and covariances — so "G-ICP and 3DGS can share the same Gaussian world."

## Method & architecture

The scene is one set of Gaussians $\boldsymbol{G}=\{\boldsymbol{\mathcal{X}},\boldsymbol{\mathcal{C}}\}$ (3D points plus covariances, with colour and opacity sets $\boldsymbol{H},\boldsymbol{O}$ for rendering). Per frame: downsample and back-project the depth image into source Gaussians, track with G-ICP against the map, and (for keyframes) insert the source Gaussians as new map primitives while a parallel mapping thread optimises them by rasterisation.

- **G-ICP tracking**: with correspondences $\boldsymbol{x}^s_i \leftrightarrow \boldsymbol{x}^t_i$ from nearest-neighbour search and residual $d_i=\boldsymbol{x}^t_i-\mathbf{T}\boldsymbol{x}^s_i$, each point is a Gaussian random variable, so $d_i\sim\mathcal{N}(0,\,C^t_i+\mathbf{T}C^s_i\mathbf{T}^\top)$ and maximum-likelihood estimation gives the distribution-to-distribution (Mahalanobis) objective

$$\mathbf{T}^{*}=\operatorname*{argmin}_{\mathbf{T}}\sum_i^N d_i^{\top}\left(C_i^{t}+\mathbf{T}C_i^{s}\mathbf{T}^{\top}\right)^{-1}d_i ,$$

  i.e. registration weighted by the combined uncertainty of both distributions. No image is ever rendered for tracking.
- **Covariance sharing**: covariances computed for the current frame during G-ICP become the initial covariances of newly inserted map Gaussians, and the map's optimised Gaussians serve directly as G-ICP targets — no recomputation, no densification or opacity reset needed.
- **Ellipse scale regularisation (tracking)**: decomposing $C=\boldsymbol{R}\boldsymbol{\Lambda}^{2}\boldsymbol{R}^{\top}$ by SVD, instead of the classic plane-forcing $\boldsymbol{S}=[1,1,\epsilon]^{\top}$, scales are normalised as $\boldsymbol{\Lambda}'=\frac{1}{median(\boldsymbol{S})}\,diag(s_2,s_1,s_0)$, preserving each map Gaussian's optimised shape (lines, corners) rather than flattening everything to planes.
- **Scale aligning (mapping)**: sensor point clouds get sparser with distance, so kNN covariances far from the camera are too large; new keyframe Gaussians are normalised as $\boldsymbol{\Lambda}''=\frac{1}{z^{p}}\boldsymbol{\Lambda}'$ (best with $p=1.5$) before insertion.
- **Mapping loss**: Gaussian positions, covariances, colours, opacities are optimised by $\lambda_{I_1}\mathcal{L}_1(I,I_{gt})+\lambda_{I_2}\mathcal{L}_{D\text{-}SSIM}(I,I_{gt})+\lambda_{D}\mathcal{L}_1(D,D_{gt})$, randomly sampling one past keyframe per iteration to avoid viewpoint-local minima, plus pruning of degenerate Gaussians.
- **Two-tier keyframes**: tracking keyframes are chosen by the proportion of G-ICP correspondences (a free by-product of tracking); extra *mapping-only* keyframes densify training views without feeding scan-matching error back into tracking.

## Results

On a Ryzen 7 7800X3D + RTX 4090, RGB-D input:

- **Replica ATE RMSE**: 0.16 cm average across 8 scenes — best in every scene, less than half the previous best (SplaTAM 0.36, GS-SLAM 0.50, Point-SLAM 0.54 cm).
- **Replica map quality / speed**: with tracking limited to 30 FPS, PSNR 38.83 dB / SSIM 0.975 / LPIPS 0.041 (SOTA across all scenes; SplaTAM 33.89, Point-SLAM 35.62 dB). With no speed limit the whole system averages 98.11 FPS, peaking at 107.06 FPS (office1), still at 35.93 dB — vs SplaTAM's 0.23 FPS and Point-SLAM's 0.30 FPS.
- **TUM RGB-D**: ATE avg 2.4 cm, best among coupled systems (SplaTAM 3.2, GS-SLAM 3.7, NICE-SLAM 4.0); decoupled ORB-SLAM3/Photo-SLAM reach 1.3 cm but need a separate feature map. System runs at 73.92 FPS unlimited with PSNR ~11.7% below SplaTAM — at roughly 92x (30-FPS mode) to 227x its speed.
- **Ablations**: ellipse vs plane vs no scale regularisation on TUM: 2.37 vs 29.12 vs 236.54 cm ATE; using G-ICP covariances with $z^{1.5}$ scale aligning improves Replica from 8.89 cm ATE / 24.81 dB (vanilla kNN init) to 0.157 cm / 38.83 dB.

## Why it matters for SLAM

GS-ICP SLAM shows that classical geometric registration and modern differentiable rendering can share a single data structure: track by geometry, map by appearance, one probabilistic Gaussian world serving both. Conceptually it reconnects the 3DGS wave with decades of ICP-based RGB-D SLAM (KinectFusion lineage) — and because tracking never renders, it is inherently robust to exposure changes that plague photometric trackers. For practitioners it remains the go-to demonstration that dense photorealistic SLAM does not have to be slow.

## Related

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [RTG-SLAM](rtg-slam.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
