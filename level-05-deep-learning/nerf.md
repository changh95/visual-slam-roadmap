# NeRF

> Mildenhall 2020 · [Paper](https://arxiv.org/abs/2003.08934)

**One-line summary** — Represents a scene as a continuous function in an MLP — 3D position plus viewing direction mapping to color and density — rendered with differentiable volume rendering, producing photorealistic novel views from posed images.

## Key ideas

- **Neural radiance field**: A single MLP $F_\Theta: (\mathbf{x}, \mathbf{d}) \to (\mathbf{c}, \sigma)$ encodes the whole scene; geometry (density $\sigma$) and appearance (view-dependent color $\mathbf{c}$) live in the network weights.
- **Differentiable volume rendering**: Pixel colors are integrals along camera rays, $\hat{C}(\mathbf{r}) = \int T(t)\,\sigma(\mathbf{r}(t))\,\mathbf{c}(\mathbf{r}(t),\mathbf{d})\,dt$ with transmittance $T(t)$ — fully differentiable, so the field is trained by simply minimizing photometric error against the input images.
- **Positional encoding**: Mapping inputs through $\gamma(p) = (\sin(2^k\pi p), \cos(2^k\pi p))$ lets the MLP represent high-frequency detail it would otherwise smooth away.
- **Hierarchical sampling**: A coarse network guides a fine network to concentrate samples near surfaces, making the ray integral tractable.

## Why it matters for SLAM

NeRF is the foundational work behind the entire neural-implicit SLAM wave: iMAP, NICE-SLAM, Co-SLAM, and NeRF-SLAM all use radiance-field-style map representations optimized online, and the differentiable rendering loss doubles as a tracking objective (invert the renderer to get the camera pose). Even after 3D Gaussian Splatting displaced NeRF for real-time rendering, the core ideas — scene as an optimizable field, photometric supervision through a differentiable renderer — remain the conceptual basis of modern dense neural mapping.

## Related

- [iMAP](../level-03-monocular-slam/imap.md) — first NeRF-style SLAM system
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — hierarchical feature-grid successor
- [NeRF-SLAM](../level-03-monocular-slam/nerf-slam.md) — radiance fields fused with DROID-SLAM tracking
- [BARF](../level-03-monocular-slam/barf.md) — joint pose and NeRF optimization

[Back to Level 5](../README.md#level-5-applying-deep-learning)
