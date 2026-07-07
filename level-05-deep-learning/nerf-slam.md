# NeRF-SLAM

> Rosinol 2023 · [Paper](https://arxiv.org/abs/2210.13641)

**One-line summary** — Coupled a dense monocular SLAM frontend (DROID-SLAM) with an Instant-NGP radiance-field backend, weighting the NeRF depth loss by the SLAM depth marginal covariances — real-time, geometrically and photometrically accurate dense monocular reconstruction.

## Problem

The first neural-implicit SLAM systems (iMAP, NICE-SLAM) required RGB-D input, and radiance fields trained on photometric loss alone are prone to "floaters" — ghost geometry from bad initialisation or bad local minima; adding depth supervision removes it and speeds convergence. Dense monocular SLAM can supply that depth in real time, but its depth maps "are extremely noisy due to their density, since even textureless regions are given a depth value". NeRF-SLAM's insight: dense monocular SLAM provides exactly the right information to fit a NeRF in real time — accurate poses plus dense depth maps *with associated uncertainty*, so the map can trust each depth only as much as the estimator does.

## Method & architecture

Two threads run in parallel on one GPU (RTX 2080 Ti, 11 GB, PyTorch + CUDA):

**Tracking: dense SLAM with covariances.** DROID-SLAM computes dense optical flow $\mathbf{p}_{ij}$ between frame pairs with a RAFT-style ConvGRU that also outputs per-measurement weights $\mathbf{\Sigma}_{\mathbf{p}_{ij}}$, then solves a dense bundle adjustment with geometry parametrised as per-keyframe inverse depth maps. Linearising gives the block-sparse system

$$H\mathbf{x}=\mathbf{b}, \quad \begin{bmatrix} C & E \\ E^{T} & P \end{bmatrix} \begin{bmatrix} \Delta\boldsymbol{\xi} \\ \Delta\mathbf{d} \end{bmatrix} = \begin{bmatrix} \mathbf{v} \\ \mathbf{w} \end{bmatrix},$$

with $C$ the camera block, $P$ the (diagonal) inverse-depth block, $E$ the camera/depth coupling, $\Delta\boldsymbol{\xi}$ the $SE(3)$ pose updates and $\Delta\mathbf{d}$ the per-pixel inverse-depth updates. The Schur complement gives the reduced camera matrix $H_T$, solved by Cholesky factorisation $H_T = LL^{T}$. Following Rosinol et al.'s probabilistic volumetric fusion (WACV 2022), the marginal covariances of depths and poses come from the same factorisation:

$$\mathbf{\Sigma}_{\mathbf{d}} = P^{-1} + P^{-T}E^{T}\mathbf{\Sigma}_{\mathbf{T}}EP^{-1}, \qquad \mathbf{\Sigma}_{\mathbf{T}} = (LL^{T})^{-1}.$$

**Mapping: probabilistic volumetric NeRF.** An Instant-NGP hash-grid radiance field is trained on all keyframes (no sliding window) with the mapping loss, minimised over both poses $\mathbf{T}$ and network parameters $\Theta$:

$$\mathcal{L}_{M}(\mathbf{T},\Theta) = \mathcal{L}_{\text{rgb}}(\mathbf{T},\Theta) + \lambda_{D}\,\mathcal{L}_{\text{D}}(\mathbf{T},\Theta), \qquad \lambda_D = 1.0,$$

where the depth loss is Mahalanobis-weighted by the tracking covariance,

$$\mathcal{L}_{\text{D}}(\mathbf{T},\Theta) = \|D - D^{\star}(\mathbf{T},\Theta)\|^{2}_{\Sigma_{D}},$$

and $\mathcal{L}_{\text{rgb}} = \|I - I^{\star}(\mathbf{T},\Theta)\|^{2}$. Rendered depth is the expected ray-termination distance under standard volume rendering,

$$d^{\star} = \sum_{i}\mathcal{T}_{i}\bigl(1-\exp(-\sigma_{i}\delta_{i})\bigr)d_{i}, \qquad \mathcal{T}_{i} = \exp\Bigl(-\sum_{j<i}\sigma_{j}\delta_{j}\Bigr),$$

with $\sigma_i$ the density at sample $i$, $d_i$ its depth, and $\delta_i = d_{i+1} - d_i$; colour composites $\mathbf{c}_i$ the same way.

**Thread interface.** The tracking thread keeps an active window of at most 8 keyframes and spawns a keyframe whenever mean optical flow exceeds 2.5 pixels; on each new keyframe it ships poses, images, depth maps, and depth covariances to the mapper — the only inter-thread communication.

## Results

On Replica (8 scenes, evaluated by depth L1 and PSNR):

- **Ours (monocular, own depth): avg 4.49 cm depth L1, 41.40 dB PSNR** — vs NICE-SLAM *with ground-truth depth* (4.08 cm, 24.61 dB), NICE-SLAM without depth (14.18 cm, 17.76 dB), iMAP with GT depth (7.64 cm, 6.95 dB), TSDF-Fusion on the same estimated depths (21.88 cm, 7.07 dB) and $\sigma$-Fusion (20.10 cm, 7.08 dB).
- Up to **179% better PSNR** (office-1) and **86% better depth L1** (room-2) than NICE-SLAM; office-1 shows the best combined gain (179% PSNR, 80% L1).
- Ablations (Cube-Diorama): unweighted raw depth supervision is 4 dB PSNR / 7 cm L1 worse after 120 s than covariance-weighted; poses-only gives 7.8 cm L1 after 500 s, raw depth 4.1 cm but 3 dB worse PSNR — weighting achieves the best of both.
- Runtime: pipeline at 12 fps on 640x480 (tracking ~15 fps, mapping ~10 fps), ~11 GB GPU memory.

## Why it matters for SLAM

NeRF-SLAM (from Rosinol, of Kimera fame, with Leonard and Carlone at MIT) crystallised the hybrid recipe — estimation-theoretic SLAM for poses, geometry, and uncertainty; neural fields for the map — showing the two are complementary rather than competing. It is the counterpoint to iMAP's purist "the network is the whole system" stance, and arguably the more influential blueprint: most practical neural and Gaussian SLAM systems today pair a robust tracker with a differentiable map exactly this way, and its uncertainty-weighted depth supervision became a recurring technique for fusing noisy estimated geometry into neural representations.

## Related

- [DROID-SLAM](droid-slam.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [GO-SLAM](go-slam.md)
- [NeRF](nerf.md)
