# Online 3DGS Modeling

> Lee 2025 · [Paper](https://arxiv.org/abs/2508.14014)

**One-line summary** — Combines ORB-SLAM3's robust tracking with hierarchical Gaussian management and adaptive novel view selection over non-keyframes, improving scene completeness for online monocular 3D Gaussian Splatting.

## Problem

Online 3DGS pipelines built on dense SLAM "are limited by their reliance solely on keyframes, which are insufficient to capture an entire scene, resulting in incomplete reconstructions" (abstract). Building a generalisable model needs frames from diverse viewpoints for broader coverage — but online processing budgets forbid simply training on every frame or running many iterations. The question this paper answers: given a fixed online budget, *which* extra frames are worth training on?

## Key ideas

- **Classical tracking frontend**: ORB-SLAM3 provides camera poses with relocalization and loop closure; its maturity makes it more reliable than rendering-based tracking for monocular input, and it leaves the compute budget free for mapping.
- **Keyframe-only training is the bottleneck**: keyframes are selected for *tracking* quality (baseline, feature coverage), not for *reconstruction* coverage — so regions seen only briefly or only from non-keyframe viewpoints stay incomplete.
- **Adaptive novel view selection**: the method "analyz[es] reconstruction quality online" and "selects optimal non-keyframes for additional training" (abstract); by integrating keyframes and selected non-keyframes it "refines incomplete regions from diverse viewpoints, significantly enhancing completeness".
- **Online multi-view stereo for consistency**: the framework "incorporates an online multi-view stereo approach, ensuring consistency in 3D information throughout the 3DGS modeling process" (abstract) — depth for Gaussian placement comes from multi-view geometry rather than single-view guesses.
- **Hierarchical Gaussian management**: Gaussians are organised by scale and region — coarse for overall structure, fine for detail — enabling level-of-detail rendering and bounded memory.

## Results & impact

The abstract reports that the method "outperforms state-of-the-art methods, delivering exceptional performance in complex outdoor scenes" — notable because outdoor monocular sequences are exactly where keyframe-only online 3DGS reconstruction degrades most. The broader lesson is transferable: reconstruction completeness is an *active selection* problem even for a passive camera stream, since deciding what to train on is a choice the mapper can optimise.

## Why it matters for SLAM

This work is representative of the "classical SLAM frontend + 3DGS backend" design that pairs proven feature-based tracking with modern photorealistic mapping. Its main contribution — treating view selection as an active decision rather than passively training on keyframes — addresses the completeness gap that affects most online reconstruction systems, especially in complex outdoor scenes.

## Related

- [ORB-SLAM3](orb-slam3.md)
- [MonoGS](monogs.md)
- [Photo-SLAM](photo-slam.md)
- [SplaTAM](splatam.md)
- [ActiveSplat](activesplat.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
