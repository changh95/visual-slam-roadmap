# Photo-SLAM

> Huang 2024 · [Paper](https://arxiv.org/abs/2311.16728)

**One-line summary** — Introduces "hyper primitives" that combine explicit Gaussian geometry with an implicit MLP appearance model, achieving real-time photorealistic 3DGS mapping even on embedded platforms.

## Key ideas

- **Hyper primitives (explicit geometry + implicit appearance)**: each Gaussian stores geometric parameters (position, covariance, opacity) plus a compact feature vector instead of full spherical-harmonics coefficients; a shared MLP decodes the feature and viewing direction into view-dependent colour, cutting per-Gaussian memory.
- **Gaussian-Pyramid training**: appearance features are learned progressively from coarse to fine, analogous to image pyramids, which improves convergence and avoids local minima during online learning.
- **Feature-based tracking frontend**: camera poses come from ORB-SLAM3's robust tracking, decoupling localisation from the photorealistic mapping backend.
- **Efficient Gaussian management**: gradient-based densification and opacity-based pruning keep the Gaussian count manageable for resource-constrained hardware.

## Why it matters for SLAM

Photo-SLAM demonstrated that photorealistic 3DGS SLAM can run in real time on embedded robotic platforms such as Jetson boards, not just desktop GPUs. Its split of duties — classical feature-based tracking for robustness, Gaussian splatting for appearance — became a common template for practical Gaussian SLAM systems, and its MLP-based appearance encoding offered a memory-efficient alternative to spherical harmonics.

## Related

- [SplaTAM](splatam.md)
- [ORB-SLAM3](orb-slam3.md)
- [RTG-SLAM](rtg-slam.md)
- [MonoGS](monogs.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
