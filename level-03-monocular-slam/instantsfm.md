# InstantSfM

> Zhong 2025 · [Paper](https://arxiv.org/abs/2510.13310)

**One-line summary** — A fully GPU-based, PyTorch-compatible global SfM pipeline with sparsity-aware optimisation, reaching up to ~40x speedups over COLMAP on large scenes at comparable accuracy.

## Problem

Mature SfM systems remain CPU-centric and built on traditional optimisation toolchains (Ceres-style solvers), creating "a growing mismatch with modern GPU-based, learning-driven pipelines" and limiting scalability — large collections can take hours to days. GPU-accelerated bundle adjustment had shown the potential of parallel sparse optimisation, but extending it into a *complete* global SfM system was blocked by two unresolved issues: recovering metric scale, and numerical robustness (outlier filtering can leave cameras/points under-constrained, producing rank-deficient normal equations that break the Levenberg–Marquardt solver). InstantSfM builds that complete system.

## Method & architecture

InstantSfM follows the global paradigm (like GLOMAP): rotation averaging, then **global positioning (GP)**, then **bundle adjustment (BA)** — all stages implemented in PyTorch on the GPU with sparse Jacobians. GP jointly estimates points $\mathbf{X}_j$, camera centres $\mathbf{t}_i$, and per-observation scales $s_{ij}$ from rotated ray directions $\mathbf{v}_{ij}$:

$$\boldsymbol{\theta}=\arg\min_{\mathbf{X},\mathbf{t},s}\sum_{i=1}^{C}\sum_{j=1}^{P}\rho\left(\|\mathbf{v}_{ij}-s_{ij}(\mathbf{X}_{j}-\mathbf{t}_{i})\|^{2}_{2}\right)$$

BA then refines poses $\boldsymbol{\zeta}_i$, intrinsics $\mathbf{K}_i$, and points by minimising reprojection error $\mathbf{r}_{ij}=\Pi(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})-\mathbf{x}_{ij}$. Both are solved with LM steps $(\mathbf{J}^{\top}\mathbf{J}+\lambda\operatorname{diag}(\mathbf{J}^{\top}\mathbf{J}))\Delta\boldsymbol{\theta}=-\mathbf{J}^{\top}\mathbf{r}$, where the BA Jacobian $\mathbf{J}\in\mathbb{R}^{2CP\times(7C+3P)}$ is stored and manipulated in block-sparse form. Two contributions make it a complete system:

- **Depth-constrained Jacobian structure.** The GP scale $s_{ij}$ is exactly the inverse depth of $\mathbf{X}_j$ seen from camera $i$; where a metric depth $\hat{d}_{ij}$ exists (RGB-D or a monocular depth model), it is pinned: $s_{ij}=1/\hat{d}_{ij}$, removing that column from the Jacobian. Since $\partial\mathbf{u}_{ij}/\partial\mathbf{t}_{i}=s_{ij}\mathbf{I}$, pinned observations impose metrically scaled gradients on shared camera centres, and $\mathbf{J}^{\top}\mathbf{J}$ couples them to the free scales — metric scale propagates through the whole scene *inside* the solver rather than by post-hoc alignment. In BA, an extra inverse-depth residual is added:

$$\mathbf{r}^{d}_{ij}=\frac{1}{\text{Depth}(\boldsymbol{\zeta}_{i},\mathbf{X}_{j},\mathbf{K}_{i})}-\frac{1}{\hat{d}_{ij}},\qquad \boldsymbol{\theta}=\arg\min\sum_{i,j}\rho\left(\mathbf{r}_{ij}+\lambda_{d}\mathbf{r}^{d}_{ij}\right)$$

  Invalid depth pixels (sky, speculars) are handled by a binary mask $m_{ij}$ that sets the reference $\tilde{d}^{-1}_{ij}=m_{ij}\cdot\hat{d}_{ij}^{-1}$, collapsing the term to reprojection-only in one uniform GPU operation — no thread-divergent per-observation branching.
- **Robust outlier removal via dynamic parameter extraction.** At every LM iteration, observations are re-checked for geometric validity ($\mathcal{O}_{\text{valid}}=\{(i_{c},i_{p})\mid z_{i_{c},i_{p}}>0.1\}$, in-frustum), and only cameras/points with at least one valid observation are compacted (via GPU `torch.unique` and index remapping) into a reduced parameter vector $\hat{\mathbf{x}}$. By construction $\hat{\mathbf{J}}$ has no all-zero columns, so the normal equations stay full-rank (up to gauge) even when many points are temporarily invalid; updates are computed by preconditioned conjugate gradient and scattered back. Points can transition between valid/invalid as geometry evolves — unlike one-shot preprocessing filters or robust kernels that only down-weight residuals.

## Results

- **Runtime**: 1.5x–40x speedup over COLMAP and up to 12x over GLOMAP across scenes of 100–5,000 images (MipNeRF360 + downsampled 1DSfM). Even against COLMAP/GLOMAP with GPU-accelerated Ceres: Alamo 597 s vs 12,855 s (COLMAP) and 1,600 s (GLOMAP); Union_Square 571 s vs 4,697/966 s.
- **MipNeRF360 (novel-view-synthesis metrics)**: best overall performance among COLMAP, GLOMAP, and VGGSfM; notably it avoids GLOMAP's catastrophic failure on `kitchen` (PSNR 27.79 vs 16.11).
- **ScanNet**: COLMAP and GLOMAP fail on most scenes (Ceres divergence in view-graph calibration; incomplete reconstructions) while InstantSfM succeeds on all and improves further with depth priors; on **ScanNet++** it reaches average Chamfer distance 2.61 vs GLOMAP's 3.80.
- Also evaluated on DTU (structured-light ground truth). Code: [github.com/cre185/InstantSfM](https://github.com/cre185/InstantSfM).

## Why it matters for SLAM

Offline SfM is the workhorse behind SLAM research: it produces pseudo-ground-truth trajectories, calibration, and the posed images used to train NeRF/3DGS and learning-based SLAM systems — speeding it up by an order of magnitude shortens every iteration loop in that ecosystem. InstantSfM continues the shift away from the slow incremental CPU pipeline that COLMAP standardised (following GLOMAP's global formulation), and its depth-prior-in-the-Jacobian trick is a clean example of fusing learned priors into classical estimation rather than replacing it. The dynamic parameter-extraction idea — restructure the problem each iteration to keep the normal equations full-rank — is broadly useful in any GPU-resident SLAM backend.

## Related

- [COLMAP](colmap.md)
- [GLOMAP](glomap.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [VGGT](vggt.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Depth Anything](../level-05-deep-learning/depth-anything.md)
