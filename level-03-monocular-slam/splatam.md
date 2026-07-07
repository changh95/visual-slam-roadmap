# SplaTAM

> Keetha 2024 · [Paper](https://arxiv.org/abs/2312.02126)

**One-line summary** — Among the first SLAM systems to use 3D Gaussian Splatting as the map (concurrent with GS-SLAM and MonoGS): an RGB-D splat-track-map loop through a differentiable rasteriser, with a rendered silhouette guiding both pose optimisation and Gaussian densification.

## Problem

Dense SLAM methods were "often hampered by the non-volumetric or implicit way they represent a scene": handcrafted explicit maps (points, surfels, SDFs) track reliably only with rich 3D features and explain only observed surfaces, while implicit radiance-field SLAM (NICE-SLAM, Point-SLAM) needs expensive per-ray volumetric sampling, forcing losses over a sparse set of pixels. 3D Gaussian Splatting rasterises at up to 400 FPS but had always required known poses. SplaTAM (CVPR 2024, CMU/MIT) shows "for the first time that representing a scene by 3D Gaussians can enable dense SLAM using a single unposed monocular RGB-D camera".

## Method & architecture

**Simplified Gaussian map.** The scene is a set of *isotropic*, view-independent Gaussians — 8 parameters each (RGB colour $\mathbf{c}$, centre $\boldsymbol{\mu}\in\mathbb{R}^3$, radius $r$, opacity $o$) — each influencing space as $f(\mathbf{x}) = o\exp\bigl(-\tfrac{\|\mathbf{x}-\boldsymbol{\mu}\|^{2}}{2r^{2}}\bigr)$. Colour, depth, and a *silhouette* are all rendered by sorting Gaussians front-to-back and alpha-compositing their 2D splats:

$$C(\mathbf{p})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad D(\mathbf{p})=\sum_{i=1}^{n}d_{i}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr), \quad S(\mathbf{p})=\sum_{i=1}^{n}f_{i}(\mathbf{p})\prod_{j=1}^{i-1}\bigl(1-f_{j}(\mathbf{p})\bigr),$$

where $f_i(\mathbf{p})$ uses the projected centre $\boldsymbol{\mu}^{2D} = K\,E_{t}\boldsymbol{\mu}/d$ and radius $r^{2D} = fr/d$ with $d=(E_{t}\boldsymbol{\mu})_{z}$. The silhouette $S$ says how much map evidence each pixel has — the map's epistemic uncertainty.

Each frame runs three steps:

1. **Camera tracking.** The new pose is initialised by constant-velocity propagation, $E_{t+1}=E_{t}+(E_{t}-E_{t\text{-}1})$, then refined by gradient descent through the rasteriser with Gaussians frozen, using only well-mapped pixels:
$$L_{t}=\sum_{\mathbf{p}}\Bigl(S(\mathbf{p})>0.99\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)+0.5\,\mathrm{L}_{1}\bigl(C(\mathbf{p})\bigr)\Bigr).$$
2. **Gaussian densification.** A mask picks pixels the map does not yet explain — low silhouette, or true geometry in front of the rendered geometry:
$$M(\mathbf{p})=\Bigl(S(\mathbf{p})<0.5\Bigr)+\Bigl(D_{\mathrm{GT}}(\mathbf{p})<D(\mathbf{p})\Bigr)\Bigl(\mathrm{L}_{1}\bigl(D(\mathbf{p})\bigr)>50\,\mathrm{MDE}\Bigr),$$
   with MDE the median depth error. Masked pixels each spawn a Gaussian with the pixel's colour, centre at the unprojected depth, opacity 0.5, and one-pixel radius $r = D_{\mathrm{GT}}/f$.
3. **Map update.** With poses frozen, Gaussian parameters are optimised over $k$ keyframes (current frame, latest keyframe, and the $k-2$ keyframes with highest frustum overlap with the current depth point cloud), warm-started from the existing map, using the colour+depth loss without the silhouette mask plus an SSIM term; near-transparent or oversized Gaussians are culled.

## Results

- **Replica** (ATE RMSE avg, 8 scenes): 0.36 cm — more than 30% below the prior SOTA Point-SLAM (0.52) and well below ESLAM (0.63), NICE-SLAM (1.06), Vox-Fusion (3.09).
- **TUM-RGBD**: 5.48 cm avg, cutting Point-SLAM's 8.92 by almost 40% (NICE-SLAM 15.87); feature-based ORB-SLAM2 (1.98) still wins among sparse methods. On the similarly low-quality original ScanNet, 11.88 cm is comparable to Point-SLAM (12.19) and NICE-SLAM (10.70).
- **ScanNet++** (high-quality captures but huge inter-frame motion, ~30 Replica frames per step): SplaTAM tracks both sequences at 1.2 cm average error while Point-SLAM and RGB-D ORB-SLAM3 fail completely; novel-view synthesis reaches 24.41 dB PSNR (27.98 on train views) with ~2 cm novel-view depth L1.
- **Rendering**: Replica train-view PSNR 34.11 dB — about 10 dB above NICE-SLAM (24.42) and Vox-Fusion (24.41), on par with Point-SLAM (35.17, which uses GT depth to place samples); the map renders at 400 FPS at 876x584.
- **Runtime** (RTX 3080 Ti, Replica R0): 25 ms/tracking and 24 ms/mapping iteration while rendering the full ~1.2M-pixel image per iteration — versus baselines optimising over only 200-1000 sampled pixels; SplaTAM-S (fewer iterations) runs 5x faster (0.19 s + 0.33 s per frame) at 0.39 cm ATE.
- **Ablations** (Room 0): remove the silhouette mask and tracking collapses (ATE 115.8 cm); a 0.99 threshold instead of 0.5 gives 5x lower error (0.27 vs 1.30); no velocity propagation is >10x worse; depth-only loss fails entirely (86.03 cm). Stated limitations: sensitivity to motion blur, large depth noise, and aggressive rotation.

## Why it matters for SLAM

SplaTAM helped launch the 3DGS SLAM research line, showing an explicit, differentiable, volumetric map can beat NeRF-style SLAM on tracking, mapping, and view synthesis at interactive rates — and that dense per-pixel losses become affordable when rendering is rasterisation instead of ray marching. Its silhouette mask became a standard densification and uncertainty-gating tool, and its alternating track-then-map loop through a differentiable rasteriser is the template that Photo-SLAM, RTG-SLAM, GS-ICP SLAM, and many follow-ups build on.

## Related

- [MonoGS](monogs.md)
- [NICE-SLAM](nice-slam.md)
- [Point-SLAM](point-slam.md)
- [Photo-SLAM](photo-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
