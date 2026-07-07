# MonoGS

> Matsuki 2024 · [Paper](https://arxiv.org/abs/2312.06741)

**One-line summary** — "Gaussian Splatting SLAM" (CVPR 2024 highlight): the first application of 3D Gaussian Splatting in monocular SLAM, using Gaussians as the sole map representation and tracking the camera directly against the rasterised map.

## Problem

3D Gaussian Splatting produces photorealistic maps with fast differentiable rendering, but "the original 3DGS algorithm... requires accurate poses from an offline Structure from Motion (SfM) system" (abstract) — it is a batch method with poses given. Using it *inside* SLAM means solving the opposite problem: estimate poses from the Gaussians while incrementally building them, from a live camera, in "the most fundamental but the hardest setup for Visual SLAM" — a single uncalibrated-depth monocular RGB stream, where geometry is ambiguous until multiple views constrain it.

## Key ideas

- **3DGS as the unified SLAM representation**: the method "utilises Gaussians as the only 3D representation, unifying the required representation for accurate, efficient tracking, mapping, and high-quality rendering" (abstract) — no auxiliary sparse map, TSDF, or external tracker.
- **Direct rasterisation-based tracking**: camera pose is estimated "using direct optimisation against the 3D Gaussians" (abstract) — minimising the photometric error between the live image and the map rendered through the differentiable rasteriser. The paper shows this gives "fast and robust tracking with a wide basin of convergence"; it is the direct-method idea (DTAM lineage) applied to a splatting map.
- **Analytic camera Jacobians**: derivatives of the rasterisation with respect to the camera pose on the Lie group are derived analytically rather than left to autodiff through the renderer, making pose optimisation fast and stable — a detail that made live tracking practical.
- **Geometric verification and regularisation**: "by utilising the explicit nature of the Gaussians", the system introduces geometric verification and regularisation "to handle the ambiguities occurring in incremental 3D dense reconstruction" (abstract) — including isotropic regularisation that discourages degenerate, needle-like Gaussians in the under-constrained monocular case.
- **Monocular first, RGB-D as a bonus**: designed for the hard monocular setting, and "seamlessly extendable to RGB-D SLAM when an external depth sensor is available" (abstract); keyframing with Gaussian insertion and pruning keeps the map well-conditioned as the camera explores.

## Results & impact

- Runs live at 3 FPS in the monocular setting (abstract) — modest as odometry, but unprecedented for a system whose map is a photorealistic radiance representation built on the fly.
- "Achieves state-of-the-art results in novel view synthesis and trajectory estimation" and demonstrates "reconstruction of tiny and even transparent objects" (abstract) — cases where depth sensors and classical dense fusion fail outright.
- A CVPR 2024 highlight and, alongside SplaTAM, the launch point of the 3DGS-SLAM wave; most subsequent Gaussian SLAM systems build on or benchmark against it.

## Why it matters for SLAM

MonoGS is the canonical *monocular* entry point to Gaussian-splatting SLAM: it showed that a rendering-quality map and camera tracking can share one differentiable representation at interactive rates. Its analytic-Jacobian, direct-alignment formulation connects modern splatting SLAM back to the direct methods (DTAM, LSD-SLAM, DSO) — the same photometric principle, applied to a far richer map. It also comes from the same Imperial College lab as MonoSLAM and iMAP, each of which similarly redefined the map representation of its era.

## Related

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [Photo-SLAM](photo-slam.md)
- [DTAM](dtam.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
