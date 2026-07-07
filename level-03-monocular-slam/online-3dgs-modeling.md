# Online 3DGS Modeling

> Lee 2025 · [Paper](https://arxiv.org/abs/2508.14014)

**One-line summary** — Online monocular 3DGS mapping that pairs a DROID-SLAM + multi-view-stereo frontend with a Gaussian backend, and adds uncertainty-driven *novel view selection* of non-keyframes so the model trains on exactly the extra frames that fix its incomplete regions.

## Problem

Online 3DGS pipelines built on dense SLAM "are limited by their reliance solely on keyframes, which are insufficient to capture an entire scene, resulting in incomplete reconstructions". Keyframes are chosen by thresholding mean optical flow — a *tracking* criterion — so regions seen only briefly or from non-keyframe viewpoints stay under-reconstructed. Yet online budgets forbid training on every frame. Given a fixed budget, *which* extra frames are worth training on? A second issue: many systems use sparse or single-image predicted depth, which is scale-ambiguous and fails outdoors.

## Method & architecture

Built on the MVS-GS framework with independent frontend and backend running in parallel:

- **Frontend (tracking + depth)**: DROID-SLAM tracks poses over a frame-graph $G$ whose nodes are keyframes $I_k$ and edges are co-visibility links; its dense optical flow yields a coarse disparity map that *initializes* the first layer of MVSFormer, a coarse-to-fine multi-view stereo network that outputs an accurate metric-consistent depth map $\bar{D}_k$ per keyframe. Global bundle adjustment (GBA) runs online every 30 keyframes (not just at the end, as in stock DROID-SLAM), with disparities/translations normalized by the mean disparity $\bar{d}$ for numerical stability.
- **Backend (mapping)**: keyframe depths are unprojected to points, filtered by MVS geometric/photometric consistency, and turned into generalized-exponential-splatting (GES) primitives with covariance $\Sigma_i$, mean $\mu_i$, opacity $o_i$, color $c_i$, and learnable shape $\beta_i$. New Gaussians are spawned only in unexplored regions where rendered-vs-real PSNR falls below a threshold. Rendering uses front-to-back alpha blending:

$$\hat{c}(p)=\sum_{i\in N} c_i\,\alpha_i \prod_{j=1}^{i-1}(1-\alpha_j), \qquad \alpha_i = o_i\, g_i(x)$$

with depth $\hat{D}(p)$ rendered the same way using per-Gaussian depths $z_i$.
- **Map deformation after GBA**: when GBA updates a pose $T_k \to T_k'$, the map is *rigidly* deformed by $T_k^{rel}=T_k' T_k^{-1}$: means $\mu_i' = T_k^{rel}\mu_i$ and covariances $\Sigma_i' = R_k^{rel}\,\Sigma_i\,(R_k^{rel})^{\top}$ — MVS depth is accurate enough that non-rigid deformation (as in Splat-SLAM) is unnecessary.
- **Novel view selection (NVS)**: per-Gaussian uncertainty combines shape and optimization state. The largest covariance eigenvalue $\lambda_{n,i}=\max(s_{n,i}^{2})$ (from scales $s_{n,i}$) flags over-reconstruction by oversized Gaussians; the positional-gradient magnitude $A_{n,i}=\lVert d\mu_{n,i}\rVert$ flags still-converging regions:

$$U_{n,i}=\alpha_1 \lambda_{n,i}+\alpha_2 A_{n,i}, \qquad \alpha_1=0.7,\ \alpha_2=0.3$$

The information gain of non-keyframe $I_n$ sums visible-Gaussian uncertainties with inverse-square depth weighting, $U_n=\sum_i U_{n,i}/z_{n,i}^{2}$. Candidates (non-keyframes within the last 30 keyframes' span, plus 20 carried-over high-gain frames) are sorted by $U_n$, non-maximum suppression removes near-duplicate viewpoints, and the top-k join the 30 most recent keyframes as the training set. Unlike FisherRF or GS-Planner, this needs no expensive rendered-image comparison.
- **Training losses**: keyframes use $L_{\mathrm{KF}}=\lambda_{L1}L_1+\lambda_{\mathrm{SSIM}}L_{\mathrm{SSIM}}+\lambda_{\mathrm{depth}}L_{\mathrm{depth}}+\lambda_{\mathrm{smooth}}L_{\mathrm{smooth}}$ (weights 0.95/0.2/0.2/0.1) with $L_{\mathrm{depth}}$ against MVS depth; non-keyframes have no depth, so $L_{\mathrm{NKF}}=\lambda_{L1}L_1+\lambda_{\mathrm{SSIM}}L_{\mathrm{SSIM}}+\lambda_{\mathrm{smooth}}L_{\mathrm{smooth}}$.

## Results

All experiments on an RTX 4090 (~9.18 FPS average on Replica, ~17.2 GiB GPU):

- **Replica** (8 scenes, keyframe eval): average PSNR **39.28** / SSIM 0.98 / LPIPS 0.03, vs Splat-SLAM 36.45/0.97/0.06, MVS-GS 35.58/0.96/0.08, Photo-SLAM 33.29, MonoGS 25.88.
- **TUM-RGBD**: average PSNR **27.72** / SSIM 0.90 / LPIPS 0.10, edging Splat-SLAM (27.06/0.86/0.15); MonoGS 18.82.
- **ScanNet**: average PSNR **29.79** vs Splat-SLAM 29.48, GLORIE-SLAM 22.45.
- **Outdoor** (Aerial, Tanks&Temples): depth-prediction-based methods Splat-SLAM and GLORIE-SLAM *failed to generate 3DGS models*; on Tanks&Temples even Photo-SLAM and MonoGS failed, while the proposed method rendered near-photographic results.
- **Ablation** (Replica Office0): baseline MVS-GS 40.92 PSNR → +online GBA 42.37 → +disparity init 42.71 → +smoothness loss 42.73 (depth L1 0.044→0.038) → **+NVS 43.93** PSNR, depth L1 0.034, and *fewer* Gaussians (1078K vs 1377K, ~60 MB smaller map).

## Why it matters for SLAM

First work to introduce non-keyframe selection into a 3DGS-based SLAM framework: it treats reconstruction completeness as an *active selection* problem even for a passive camera stream, importing next-best-view thinking into online mapping. It also reinforces the case that multi-view-stereo depth (rather than monocular depth prediction) is what makes rendering-based SLAM survive outdoor scenes — the setting where keyframe-only pipelines degrade most.

## Related

- [DROID-SLAM](droid-slam.md)
- [MonoGS](monogs.md)
- [Photo-SLAM](photo-slam.md)
- [SplaTAM](splatam.md)
- [ActiveSplat](activesplat.md)
