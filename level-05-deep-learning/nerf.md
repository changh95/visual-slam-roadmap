# NeRF

> Mildenhall 2020 · [Paper](https://arxiv.org/abs/2003.08934)

**One-line summary** — Represents a scene as a continuous function in an MLP — 3D position plus viewing direction mapping to color and density — rendered with differentiable volume rendering, producing photorealistic novel views from posed images.

## Problem

Novel view synthesis — rendering a complex scene from viewpoints never photographed — had long been attacked with explicit representations (meshes, voxel grids, multi-plane images), which either discretize the scene, cap the achievable resolution, or fail on complicated geometry and view-dependent appearance. NeRF asks whether a scene can instead be stored as a *continuous* volumetric function, optimized directly from a sparse set of input views, with nothing more than photometric supervision through a differentiable renderer.

## Key ideas

- **Neural radiance field**: A single fully-connected (non-convolutional) MLP $F_\Theta: (\mathbf{x}, \mathbf{d}) \to (\mathbf{c}, \sigma)$ maps a continuous 5D coordinate — spatial location $(x, y, z)$ plus viewing direction $(\theta, \phi)$ — to volume density $\sigma$ and view-dependent emitted radiance $\mathbf{c}$. Geometry and appearance live entirely in the network weights.
- **Differentiable volume rendering**: A pixel's color is the classic volume-rendering integral along its camera ray,
  $$\hat{C}(\mathbf{r}) = \int_{t_n}^{t_f} T(t)\,\sigma(\mathbf{r}(t))\,\mathbf{c}(\mathbf{r}(t),\mathbf{d})\,dt, \qquad T(t) = \exp\!\Big(-\!\int_{t_n}^{t} \sigma\, ds\Big).$$
  Because volume rendering is naturally differentiable, the *only* input required to optimize the representation is a set of images with known camera poses — training is simply minimizing photometric error.
- **Positional encoding**: Mapping inputs through $\gamma(p) = (\sin(2^k\pi p), \cos(2^k\pi p))$ for $k = 0, \dots, L-1$ lets the MLP represent high-frequency detail it would otherwise smooth away — a small trick that proved essential.
- **Hierarchical sampling**: A coarse network's density estimates guide a fine network to concentrate its samples near surfaces, making the ray integral tractable at high quality.

## Results & impact

NeRF achieved state-of-the-art results for synthesizing novel views of complex scenes, outperforming prior work on neural rendering and view synthesis with qualitatively striking photorealism (the paper — an ECCV 2020 Best Paper Honorable Mention — urges readers to watch the video comparisons). It set off one of the largest research waves in modern vision: neural fields as a general representation, and in robotics, the entire neural-implicit SLAM line.

## Why it matters for SLAM

NeRF is the foundational work behind the entire neural-implicit SLAM wave: iMAP, NICE-SLAM, Co-SLAM, and NeRF-SLAM all use radiance-field-style map representations optimized online, and the differentiable rendering loss doubles as a tracking objective (invert the renderer to get the camera pose). Even after 3D Gaussian Splatting displaced NeRF for real-time rendering, the core ideas — scene as an optimizable field, photometric supervision through a differentiable renderer — remain the conceptual basis of modern dense neural mapping.

## Related

- [iMAP](../level-03-monocular-slam/imap.md) — first NeRF-style SLAM system
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — hierarchical feature-grid successor
- [NeRF-SLAM](../level-03-monocular-slam/nerf-slam.md) — radiance fields fused with DROID-SLAM tracking
- [BARF](../level-03-monocular-slam/barf.md) — joint pose and NeRF optimization
- [Co-SLAM](../level-03-monocular-slam/co-slam.md) — joint coordinate/parametric encoding for real-time neural SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
