# Depth Anything V2

> Yang 2024 · [Paper](https://arxiv.org/abs/2406.09414)

**One-line summary** — Depth Anything V2 produces much finer and more robust monocular depth than V1 through three practices: train the teacher only on synthetic images, scale up the teacher, and teach students through large-scale pseudo-labeled real images.

## Key ideas

- V1's teacher was trained on labeled *real* images whose depth labels are noisy and coarse — especially at object boundaries, thin structures, and transparent/reflective surfaces. V2's key move: **replace all labeled real images with synthetic images**, whose rendered depth is pixel-perfect.
- Synthetic-only training creates a domain gap; it is closed by (1) **scaling up the teacher model's capacity** and (2) using the big teacher to pseudo-label large-scale real images, which then train the student models — synthetic precision transferred through a real-image bridge.
- The resulting models are significantly more efficient (reported >10x faster) than contemporaneous Stable-Diffusion-based estimators (e.g., Marigold) while being more accurate, with model sizes from 25M to 1.3B parameters.
- Metric-depth variants are obtained by fine-tuning with metric labels; the authors also built a new evaluation benchmark with precise annotations and diverse scenes, citing noise and limited diversity in existing test sets.

## Why it matters for SLAM

Sharp, edge-preserving depth matters directly for SLAM: crisp object boundaries mean cleaner TSDF/Gaussian maps and fewer depth bleeding artifacts, and the small variants run in real time on modest hardware. Depth Anything V2 became a default plug-in depth prior for 2024-2025 dense SLAM and reconstruction pipelines, and its synthetic-data-first recipe reshaped how the community sources supervision for geometric tasks.

## Related

- [Depth Anything](depth-anything.md)
- [Marigold](marigold.md)
- [Metric3D](metric3d.md)
- [MiDaS](midas.md)
- [Align3R](align3r.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
