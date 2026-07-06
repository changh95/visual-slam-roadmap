# Online 3DGS Modeling

> Lee 2025 · [Paper](https://arxiv.org/abs/2508.14014)

**One-line summary** — Combines ORB-SLAM3's robust tracking with hierarchical Gaussian management and adaptive novel view selection over non-keyframes, improving scene completeness for online monocular 3D Gaussian Splatting.

## Key ideas

- **Classical tracking frontend**: ORB-SLAM3 provides camera poses with relocalization and loop closure; its maturity makes it more reliable than rendering-based tracking for monocular input.
- **Keyframe-only training is the bottleneck**: online 3DGS systems that train only on keyframes leave regions seen briefly or from non-keyframe viewpoints poorly reconstructed.
- **Adaptive view selection**: the system evaluates reconstruction quality online (rendering metrics such as PSNR and coverage) and selects the non-keyframes that would most improve the model — filling holes and adding detail — for additional Gaussian training.
- **Hierarchical Gaussian management**: Gaussians are organised by scale and region, with coarse Gaussians for overall structure and fine Gaussians for detail, enabling level-of-detail rendering and memory management.
- **Monocular depth for initialisation**: a monocular depth network provides initial depth for Gaussian placement from RGB-only input, refined through multi-view training.

## Why it matters for SLAM

This work is representative of the "classical SLAM frontend + 3DGS backend" design that pairs proven feature-based tracking with modern photorealistic mapping. Its main contribution — treating view selection as an active decision rather than passively training on keyframes — addresses the completeness gap that affects most online reconstruction systems, especially in complex outdoor scenes.

## Related

- [ORB-SLAM3](orb-slam3.md)
- [MonoGS](monogs.md)
- [Photo-SLAM](photo-slam.md)
- [SplaTAM](splatam.md)
- [ActiveSplat](activesplat.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
