# SplaTAM

> Keetha 2024 · [Paper](https://arxiv.org/abs/2312.02126)

**One-line summary** — Among the first SLAM systems to use 3D Gaussian Splatting as the map representation (concurrent with GS-SLAM and MonoGS), performing RGB-D tracking and mapping through differentiable rendering with silhouette-guided densification.

## Key ideas

- **3DGS as the SLAM map**: the scene is a set of 3D Gaussians rendered differentiably into colour and depth images — explicit and far faster to render than NeRF-style volume rendering.
- **Tracking by rendering**: camera pose is optimised by minimising a colour + depth rendering loss against the current Gaussian map with Gaussian parameters frozen.
- **Mapping by rendering**: with poses fixed, Gaussian parameters (position, covariance, colour, opacity) are optimised over keyframes with the same loss, $\mathcal{L} = \lambda_c \|C - \hat{C}\|_1 + \lambda_d \|D - \hat{D}\|_1$.
- **Silhouette-guided densification**: a silhouette mask rendered from Gaussian opacities reveals regions the map does not yet cover; new Gaussians are added exactly there, and low-opacity Gaussians are pruned.
- **RGB-D input**: depth supervises Gaussian placement directly, which is why the earliest 3DGS SLAM systems targeted RGB-D cameras.

## Why it matters for SLAM

SplaTAM helped launch the 3DGS SLAM research line, demonstrating clearly better tracking, mapping, and novel-view synthesis than NeRF-based SLAM (NICE-SLAM, Point-SLAM) at interactive rates. Its silhouette-guided densification became a standard technique, and its tracking/mapping alternation through a differentiable rasteriser is the template that Photo-SLAM, RTG-SLAM, GS-ICP SLAM, and many follow-ups build on.

## Related

- [MonoGS](monogs.md)
- [NICE-SLAM](nice-slam.md)
- [Point-SLAM](point-slam.md)
- [Photo-SLAM](photo-slam.md)
- [RTG-SLAM](rtg-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
