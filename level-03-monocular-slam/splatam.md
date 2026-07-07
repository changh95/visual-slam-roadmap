# SplaTAM

> Keetha 2024 · [Paper](https://arxiv.org/abs/2312.02126)

**One-line summary** — Among the first SLAM systems to use 3D Gaussian Splatting as the map representation (concurrent with GS-SLAM and MonoGS), performing RGB-D tracking and mapping through differentiable rendering with silhouette-guided densification.

## Problem

Dense SLAM methods were "often hampered by the non-volumetric or implicit way they represent a scene" (abstract): NeRF-style implicit maps are slow to render and update because every query passes through an MLP and full volume rendering, while classical non-volumetric maps (surfels, TSDF blocks) are not differentiable end-to-end. 3D Gaussian Splatting had just shown that an explicit set of Gaussians can be rendered differentiably at very high speed. SplaTAM (CVPR 2024, CMU) adapts it for online SLAM from a single unposed RGB-D camera.

## Key ideas

- **3DGS as the SLAM map**: the scene is a set of 3D Gaussians rendered by differentiable rasterisation into colour and depth via alpha compositing, $\hat{C}(\mathbf{u}) = \sum_k \mathbf{c}_k \alpha_k \prod_{j<k}(1-\alpha_j)$ — explicit, volumetric, and far faster than NeRF-style ray marching.
- **Tracking by rendering**: camera pose is optimised by minimising a colour + depth rendering loss against the current Gaussian map with Gaussian parameters frozen — gradients flow through the rasteriser to the pose.
- **Mapping by rendering**: with poses fixed, Gaussian parameters (position, covariance, colour, opacity) are optimised over keyframes with the same loss, $\mathcal{L} = \lambda_c \|C - \hat{C}\|_1 + \lambda_d \|D - \hat{D}\|_1$.
- **Silhouette-guided densification**: a silhouette mask rendered from Gaussian opacities "elegantly capture[s] the presence of scene density" (abstract) — it reveals which pixels the map does not yet explain, so new Gaussians are added exactly there and pose optimisation is trusted only inside well-mapped regions.
- **Structured map expansion**: quickly determining whether an area has been mapped, plus adding Gaussians only where needed, gives fast dense optimisation and controlled map growth — benefits the abstract credits to the explicit volumetric representation.
- **RGB-D input**: depth supervises Gaussian placement directly, which is why the earliest 3DGS SLAM systems targeted RGB-D cameras; the monocular case followed with MonoGS.

## Results & impact

The abstract reports "up to 2x superior performance in camera pose estimation, map construction, and novel-view synthesis over existing methods" — at the time, the NeRF-style neural SLAM systems (NICE-SLAM, Point-SLAM generation). SplaTAM helped launch 3DGS SLAM as a research line: its silhouette mask became a standard densification tool, and its alternating track-then-map loop through a differentiable rasteriser is the template that Photo-SLAM, RTG-SLAM, GS-ICP SLAM, and many follow-ups build on.

## Why it matters for SLAM

SplaTAM helped launch the 3DGS SLAM research line, demonstrating clearly better tracking, mapping, and novel-view synthesis than NeRF-based SLAM (NICE-SLAM, Point-SLAM) at interactive rates. Its silhouette-guided densification became a standard technique, and its tracking/mapping alternation through a differentiable rasteriser is the template that Photo-SLAM, RTG-SLAM, GS-ICP SLAM, and many follow-ups build on.

## Related

- [MonoGS](monogs.md)
- [NICE-SLAM](nice-slam.md)
- [Point-SLAM](point-slam.md)
- [Photo-SLAM](photo-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
