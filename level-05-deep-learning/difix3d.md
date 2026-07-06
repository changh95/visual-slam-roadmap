# DIFIX3D+

> Wu 2025 · [Paper](https://arxiv.org/abs/2503.01774)

**One-line summary** — Uses a single-step image diffusion model to remove the floaters, blur, and ghosting artifacts that plague neural 3D reconstructions (NeRF / 3D Gaussian Splatting), both during reconstruction and as a fast post-processing step on rendered views.

## Key ideas

- **Artifact removal as image-to-image translation**: renders from an imperfect 3D reconstruction contain characteristic artifacts (floaters, spurious geometry, blurry underconstrained regions); a diffusion model is adapted to map artifact-laden renders to clean images.
- **Single-step diffusion**: instead of running a full multi-step denoising chain, the model is distilled to a single step, making it fast enough to use inside a reconstruction loop and at render time — the key practical difference from earlier diffusion-based enhancement.
- **Diffusion priors compensate for weak view coverage**: the 2D generative prior fills in plausible detail exactly where the 3D reconstruction is underconstrained (extrapolated viewpoints, sparsely observed regions).
- **Post-processing role**: because it operates on rendered images, it is representation-agnostic — the same fixer applies to NeRF-style and Gaussian-splatting-style reconstructions without changing the underlying SLAM/reconstruction pipeline.

## Why it matters for SLAM

Dense SLAM systems built on radiance fields or 3D Gaussians (SplaTAM, MonoGS, and successors) produce maps whose rendered novel views degrade quickly away from the camera trajectory — a real problem for AR preview, telepresence, and map inspection. DIFIX3D+ shows that a cheap 2D generative prior can clean up these renders without redesigning the mapping back-end, pointing toward a general pattern: geometric SLAM builds the map, and a feed-forward generative model polishes its outputs.

## Related

- [NeRF](nerf.md) — the neural rendering representation whose artifacts this line of work targets
- [Marigold](marigold.md) — another example of repurposing diffusion priors for 3D perception
- [MonoGS](../level-03-monocular-slam/monogs.md) — Gaussian-splatting SLAM producing renderable maps
- [NeRF-SLAM](../level-03-monocular-slam/nerf-slam.md) — radiance-field map built from real-time SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
