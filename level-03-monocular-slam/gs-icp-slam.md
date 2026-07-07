# GS-ICP SLAM

> Ha 2024 · [Paper](https://arxiv.org/abs/2403.12550)

**One-line summary** — Unified tracking and mapping in a single 3D Gaussian map by using Generalized ICP on the Gaussians themselves for pose estimation, reaching around 107 FPS for the full RGB-D SLAM system.

## Problem

Early 3DGS SLAM systems (SplaTAM, MonoGS) track the camera by rendering the Gaussian map and minimising a photometric loss — dozens of rasterisation passes per frame — while mapping optimises the same Gaussians with a separate loss. Tracking and mapping thus maintain overlapping computations over one representation, and photometric tracking is slow and sensitive to exposure changes. GS-ICP SLAM asks: since a 3D Gaussian already *is* a probability distribution (mean + covariance), why not track against it with classical distribution-to-distribution registration and let tracking and mapping share the work?

## Key ideas

- **One Gaussian map for everything**: the same set of 3D Gaussians serves both as the rendering representation (for mapping via differentiable splatting) and as the registration target (for tracking), which the authors describe as producing "mutual benefits" — and it eliminates the redundant computation of systems that track by rendering.
- **Gaussian-to-Gaussian ICP tracking**: camera pose is estimated with Generalized ICP (G-ICP), registering the incoming depth cloud (locally modelled as small Gaussians) against the Gaussian map. Since both sides carry a mean and covariance, the natural residual is the Mahalanobis distance
  $$E_{\text{track}} = \sum_i (\mathbf{p}_i - \boldsymbol{\mu}_i)^\top \left(\boldsymbol{\Sigma}_{\text{input}} + \boldsymbol{\Sigma}_{\text{map}}\right)^{-1} (\mathbf{p}_i - \boldsymbol{\mu}_i),$$
  i.e., plane-to-plane style registration where each pair is weighted by the combined uncertainty of both distributions.
- **Covariance exchange with scale alignment**: covariances computed during G-ICP tracking are handed to the mapping process to initialise new Gaussians, and map covariances feed back into tracking — with scale-alignment techniques reconciling the registration-oriented and rendering-oriented shapes — so neither side recomputes what the other already knows.
- **Geometric rather than photometric tracking**: tracking never renders an image, so it does not depend on rendering losses; this makes it fast and inherently robust to exposure and illumination changes that plague photometric tracking.
- **Keyframe selection for both objectives**: keyframes are chosen to serve tracking accuracy and mapping quality simultaneously, since one map must satisfy both consumers.

## Results & impact

- The abstract reports "an incredibly fast speed up to 107 FPS (for the entire system) and superior quality of the reconstructed map" — roughly an order of magnitude faster than rendering-based trackers of the same generation.
- It stood as the fastest 3DGS SLAM system of its time, with reconstruction quality comparable to contemporaries such as SplaTAM at a fraction of the runtime.
- Its central observation — Gaussians are simultaneously a registration model and a radiance representation — was picked up by later geometry-first Gaussian SLAM systems (e.g., RTG-SLAM's line of work).

## Why it matters for SLAM

GS-ICP SLAM shows that classical geometric registration (ICP) and modern differentiable rendering (splatting) can share a single data structure. Conceptually it reconnects the 3DGS wave with decades of ICP-based RGB-D SLAM (KinectFusion lineage): tracking by geometry, mapping by appearance, one probabilistic map serving both. For practitioners it is the go-to example that dense photorealistic SLAM does not have to be slow.

## Related

- [SplaTAM](splatam.md)
- [MonoGS](monogs.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [RTG-SLAM](rtg-slam.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
