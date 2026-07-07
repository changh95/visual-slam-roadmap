# Photo-SLAM

> Huang 2024 · [Paper](https://arxiv.org/abs/2311.16728)

**One-line summary** — Introduces "hyper primitives" that combine explicit Gaussian geometry with an implicit MLP appearance model, achieving real-time photorealistic 3DGS mapping even on embedded platforms.

## Problem

Neural rendering + SLAM systems had shown promising joint localisation and photorealistic reconstruction, but "existing methods, fully relying on implicit representations, are so resource-hungry that they cannot run on portable devices, which deviates from the original intention of SLAM" (abstract). A SLAM system that needs a desktop GPU is of limited use on the robot itself. Photo-SLAM's answer is a division of labour: explicit geometric features for localisation, learned photometric features for appearance.

## Key ideas

- **Hyper primitives map**: each primitive couples explicit geometric attributes (position, covariance, opacity) with a learned compact feature vector instead of full spherical-harmonics coefficients; a shared MLP decodes feature + viewing direction into view-dependent colour, cutting per-primitive memory relative to vanilla 3DGS.
- **Explicit geometry for localisation, implicit appearance for texture**: the abstract's core design — "we simultaneously exploit explicit geometric features for localization and learn implicit photometric features to represent the texture information" — camera poses come from classical ORB-SLAM3-style feature tracking, so tracking robustness never depends on rendering convergence.
- **Geometry-based active densification**: hyper primitives are actively densified from the tracked geometric features, seeding the map where the frontend already has reliable 3D structure rather than searching blindly in rendering-loss space.
- **Gaussian-Pyramid-based training**: multi-level features are learned progressively from coarse to fine, analogous to image pyramids; the abstract credits this progressive scheme with enhanced photorealistic mapping performance, and it stabilises online (single-pass) optimisation.
- **Multi-sensor breadth**: one framework handles monocular, stereo, and RGB-D input — inherited from the classical frontend, and unusual among early Gaussian SLAM systems that were RGB-D-only.

## Results & impact

Per the abstract, Photo-SLAM "significantly outperforms current state-of-the-art SLAM systems for online photorealistic mapping, e.g., PSNR is 30% higher and rendering speed is hundreds of times faster in the Replica dataset", and it runs at real-time speed on an embedded Jetson AGX Orin, "showing the potential of robotics applications". Tracking accuracy follows from the classical ORB-based frontend. The classical-frontend + Gaussian-backend split it demonstrated became one of the standard templates for practical Gaussian SLAM.

## Why it matters for SLAM

Photo-SLAM demonstrated that photorealistic 3DGS SLAM can run in real time on embedded robotic platforms such as Jetson boards, not just desktop GPUs. Its split of duties — classical feature-based tracking for robustness, Gaussian splatting for appearance — became a common template for practical Gaussian SLAM systems, and its MLP-based appearance encoding offered a memory-efficient alternative to spherical harmonics.

## Related

- [SplaTAM](splatam.md)
- [ORB-SLAM3](orb-slam3.md)
- [RTG-SLAM](rtg-slam.md)
- [MonoGS](monogs.md)
- [GS-ICP SLAM](gs-icp-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
