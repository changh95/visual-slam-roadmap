# NeRF-SLAM

> Rosinol 2023 · [Paper](https://arxiv.org/abs/2210.13641)

**One-line summary** — Coupled a dense monocular SLAM frontend (DROID-SLAM) with an Instant-NGP radiance-field backend, using depth uncertainty to weight NeRF training — real-time, geometrically accurate dense monocular reconstruction.

## Problem

The first neural-implicit SLAM systems (iMAP, NICE-SLAM) required RGB-D input, and radiance fields trained on photometric loss alone achieve good image quality but poor geometry. Meanwhile monocular depth from SLAM is available in real time but noisy and of varying reliability across the image. NeRF-SLAM's insight is that these pieces fit: "dense monocular SLAM provides the right information to fit a neural radiance field of the scene in real-time, by providing accurate pose estimates and depth-maps with associated uncertainty" (abstract).

## Key ideas

- **SLAM feeds NeRF**: the pipeline is explicitly hybrid — a geometric SLAM module estimates poses and dense geometry; a volumetric neural field consumes them as supervision. Neither replaces the other.
- **DROID-SLAM frontend**: provides camera poses and dense depth with per-pixel confidence from monocular input alone — depth is trustworthy on textured, well-observed surfaces and uncertain in textureless or occluded areas, and the frontend knows which is which (its marginal covariances say so).
- **Uncertainty-weighted depth loss**: NeRF depth supervision is weighted by the SLAM depth marginal covariance,
  $$\mathcal{L}_d = \sum_{\mathbf{r}} \sigma_d(\mathbf{r})^{-2} \, \| D_{\text{NeRF}}(\mathbf{r}) - D_{\text{SLAM}}(\mathbf{r}) \|^2,$$
  so noisy depth cannot corrupt the map while confident depth pins down geometry. The abstract credits this "uncertainty-based depth loss" for achieving "not only good photometric accuracy, but also great geometric accuracy".
- **Instant-NGP backend**: the multi-resolution hash-grid radiance field converges fast enough for online mapping on a single GPU — the "real-time hierarchical volumetric neural radiance fields" half of the recipe.
- **Monocular and real-time**: no depth sensor is required, unlike iMAP/NICE-SLAM, and the whole geometric-plus-photometric pipeline runs in real time.

## Results & impact

- "Achieves better geometric and photometric accuracy than competing approaches (up to 179% better PSNR and 86% better L1 depth), while working in real-time and using only monocular images" (abstract).
- The uncertainty-weighted supervision became a recurring technique for fusing noisy estimated geometry into neural representations, well beyond this system.
- The DROID-SLAM-frontend + neural-map-backend pattern reappears in GO-SLAM and later globally consistent neural SLAM systems.

## Why it matters for SLAM

NeRF-SLAM (from Rosinol, of Kimera fame, with Leonard and Carlone at MIT) crystallised the hybrid recipe — estimation-theoretic SLAM for poses, geometry, and uncertainty; neural fields for the map — showing the two are complementary rather than competing. It is the counterpoint to iMAP's purist "the network is the whole system" stance, and arguably the more influential blueprint: most practical neural and Gaussian SLAM systems today pair a robust tracker with a differentiable map exactly this way.

## Related

- [DROID-SLAM](droid-slam.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [GO-SLAM](go-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
