# GS-ICP SLAM

> Ha 2024 · [Paper](https://arxiv.org/abs/2403.12550)

**One-line summary** — Unified tracking and mapping in a single 3D Gaussian map by using Generalized ICP on the Gaussians themselves for pose estimation, reaching around 107 FPS for the full RGB-D SLAM system.

## Key ideas

- **One Gaussian map for everything**: the same set of 3D Gaussians serves both as the rendering representation (for mapping via differentiable splatting) and as the registration target (for tracking), avoiding the redundant computation of systems that track by rendering.
- **Gaussian-to-Gaussian ICP tracking**: camera pose is estimated with Generalized ICP, registering incoming depth points against the Gaussian map. Since Gaussians already carry a mean and covariance, the Mahalanobis distance $(\mathbf{p}_i - \boldsymbol{\mu}_i)^\top (\boldsymbol{\Sigma}_{\text{input}} + \boldsymbol{\Sigma}_{\text{map}})^{-1} (\mathbf{p}_i - \boldsymbol{\mu}_i)$ is a natural point-to-distribution registration metric.
- **Covariance exchange**: covariances computed for G-ICP tracking are shared with the mapping process (and vice versa) with scale alignment, so neither side recomputes them.
- **Geometric rather than photometric tracking**: unlike MonoGS or SplaTAM, tracking does not depend on rendering losses, which makes it fast and robust to exposure changes.
- **Keyframe selection** tuned for both tracking accuracy and mapping quality.

## Why it matters for SLAM

GS-ICP SLAM is one of the fastest 3DGS SLAM systems, showing that classical geometric registration (ICP) and neural rendering (splatting) can share a single data structure. Its insight — that a Gaussian map is simultaneously a probabilistic model for registration and a radiance representation for rendering — connects decades of ICP-based RGB-D SLAM with the modern Gaussian-splatting line of work.

## Related

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [RTG-SLAM](rtg-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
