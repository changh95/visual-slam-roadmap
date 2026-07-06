# MonoGS

> Matsuki 2024 · [Paper](https://arxiv.org/abs/2312.06741)

**One-line summary** — "Gaussian Splatting SLAM" (CVPR 2024 highlight): the first system to use 3D Gaussians as the sole map representation for live monocular SLAM, tracking the camera directly against the rasterised map.

## Key ideas

- **3DGS as the unified SLAM representation**: one set of anisotropic Gaussians serves for tracking, mapping, and photorealistic rendering — no separate sparse map or TSDF.
- **Direct rasterisation-based tracking**: camera pose is optimised by minimising the photometric error between the live image and the map rendered through the differentiable rasteriser; this is the direct-method idea (DTAM lineage) applied to a splatting map.
- **Analytic camera Jacobians**: the paper derives analytic derivatives of the rasterisation with respect to the camera pose on the Lie group, making pose optimisation fast and accurate rather than relying on autodiff through the renderer.
- **Monocular operation**: works from a single RGB camera (with stereo and RGB-D variants), handling the harder monocular case where geometry must emerge from multi-view optimisation.
- **Regularisation and map maintenance**: isotropic regularisation discourages degenerate, needle-like Gaussians, and keyframing with Gaussian insertion/pruning keeps the map well-conditioned as the camera explores.

## Why it matters for SLAM

Alongside SplaTAM, MonoGS launched the 3DGS-SLAM wave, and it is the canonical *monocular* entry point: it showed that a rendering-quality map and camera tracking can share one differentiable representation at interactive rates. Its analytic-Jacobian, direct-alignment formulation connects modern splatting SLAM back to the direct methods (DTAM, LSD-SLAM, DSO) — same principle, far richer map. Most subsequent Gaussian SLAM systems build on or benchmark against it.

## Related

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [Photo-SLAM](photo-slam.md)
- [DTAM](dtam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
