# Marigold

> Ke 2024 · [Paper](https://arxiv.org/abs/2312.02145)

**One-line summary** — Repurposes Stable Diffusion as a monocular depth estimator by fine-tuning it to denoise depth maps conditioned on the input image, recovering exceptionally fine detail and providing per-pixel uncertainty by sampling multiple predictions.

## Problem

Recovering 3D depth from a single image is geometrically ill-posed — it requires *scene understanding*, not just geometry. Discriminative depth estimators, from modest CNNs up to large Transformers, remain limited by the visual world they saw during training and struggle zero-shot on images with unfamiliar content and layout. Meanwhile, generative diffusion models like Stable Diffusion have absorbed priors from internet-scale image collections. Marigold asks whether those priors can be *repurposed* for better, more generalizable depth estimation.

## Key ideas

- **Depth as a latent image**: The normalized (affine-invariant) depth map is encoded into Stable Diffusion's latent space, so depth estimation becomes conditional image generation — the U-Net is fine-tuned to denoise depth latents given the RGB image as condition.
- **Keep the prior, change the task**: The method is deliberately derived from Stable Diffusion in a way that *retains* its rich visual prior knowledge; only a light fine-tuning adapts it to depth.
- **Cheap, synthetic-only fine-tuning**: The estimator is fine-tuned in a couple of days on a single GPU using only synthetic training data (e.g., Hypersim, Virtual KITTI) with perfect ground truth — yet transfers zero-shot to real images.
- **Uncertainty via ensembling**: Because the model is generative, running the denoising process $N$ times with different noise seeds yields multiple depth samples; their per-pixel variance is a usable uncertainty estimate — something discriminative one-shot regressors do not naturally provide.
- **Detail quality**: Recovers thin structures and fine geometry noticeably better than contemporaneous discriminative models, at the price of much slower, iterative inference.

## Results & impact

Marigold delivered state-of-the-art affine-invariant depth across a wide range of datasets, including performance gains of over 20% in specific cases, despite never training on real depth labels. Its detail recovery on thin structures, hair, and transparent surfaces was exceptional for its time, while inference remained slower than discriminative models. It opened the diffusion-based depth family and became the quality reference against which faster models (e.g., Depth Anything V2) are compared.

## Why it matters for SLAM

Marigold demonstrated that internet-scale generative priors transfer to geometric tasks, opening a new family of diffusion-based depth models. For SLAM specifically, its sampled uncertainty is the standout feature: fusing monocular depth priors into a SLAM back-end requires a noise model, and Marigold provides one per pixel. Its slowness keeps it out of real-time front-ends, but it is valuable for offline mapping, dense prior generation, and as a quality reference that faster models (e.g., Depth Anything V2) are compared against.

## Related

- [MiDaS](midas.md) — the multi-dataset relative-depth baseline
- [DPT](dpt.md) — discriminative transformer architecture for depth
- [Depth Anything V2](depth-anything-v2.md) — faster discriminative rival trained with synthetic data
- [Metric3D](metric3d.md) — metric-scale alternative for camera-aware depth
- [Align3R](align3r.md) — makes per-frame depth like Marigold's temporally consistent for video/SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
