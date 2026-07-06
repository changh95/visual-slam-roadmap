# Marigold

> Ke 2024 · [Paper](https://arxiv.org/abs/2312.02145)

**One-line summary** — Repurposes Stable Diffusion as a monocular depth estimator by fine-tuning it to denoise depth maps conditioned on the input image, recovering exceptionally fine detail and providing per-pixel uncertainty by sampling multiple predictions.

## Key ideas

- **Depth as a latent image**: The normalized depth map is encoded into Stable Diffusion's latent space, so depth estimation becomes conditional image generation.
- **Generative priors for geometry**: Stable Diffusion's visual priors, learned from internet-scale image data, transfer to depth — the fine-tuned model generalizes zero-shot to domains it never saw depth labels for.
- **Synthetic-only fine-tuning**: Trained purely on synthetic data (e.g., Hypersim, Virtual KITTI) with perfect ground truth, yet transfers well to real images.
- **Uncertainty via ensembling**: Running the denoising process $N$ times with different seeds yields multiple depth samples; their variance is a per-pixel uncertainty estimate.
- **Detail quality**: Recovers thin structures and fine geometry noticeably better than discriminative depth models, at the price of much slower, iterative inference.

## Why it matters for SLAM

Marigold demonstrated that internet-scale generative priors transfer to geometric tasks, opening a new family of diffusion-based depth models. For SLAM specifically, its sampled uncertainty is the standout feature: fusing monocular depth priors into a SLAM back-end requires a noise model, and Marigold provides one per pixel. Its slowness keeps it out of real-time front-ends, but it is valuable for offline mapping, dense prior generation, and as a quality reference that faster models (e.g., Depth Anything V2) are compared against.

## Related

- [MiDaS](midas.md) — the multi-dataset relative-depth baseline
- [DPT](dpt.md) — discriminative transformer architecture for depth
- [Depth Anything V2](depth-anything-v2.md) — faster discriminative rival trained with synthetic data
- [Metric3D](metric3d.md) — metric-scale alternative for camera-aware depth

[Back to Level 5](../README.md#level-5-applying-deep-learning)
