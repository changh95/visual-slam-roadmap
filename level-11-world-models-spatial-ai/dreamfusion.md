# DreamFusion

> Poole 2023 · [Paper](https://arxiv.org/abs/2209.14988)

**One-line summary** — DreamFusion uses a pretrained 2D text-to-image diffusion model as a prior to optimize a NeRF from a text prompt alone, via the Score Distillation Sampling (SDS) loss, enabling text-to-3D generation without any 3D training data.

## Key ideas

- **The 3D data problem**: Text-to-image diffusion models are trained on billions of image-text pairs, but no comparably large dataset of labeled 3D assets exists. DreamFusion sidesteps this by distilling the 2D model's knowledge into a 3D representation.
- **Score Distillation Sampling (SDS)**: A rendered view of the NeRF is noised, and the frozen diffusion model's predicted noise residual provides a gradient that pushes the render toward images the diffusion model considers likely for the text prompt:
  $$\nabla_\theta \mathcal{L}_{\text{SDS}} = \mathbb{E}_{t,\epsilon,c}\Big[w(t)\big(\epsilon_\phi(\mathbf{z}_t; y, t) - \epsilon\big)\tfrac{\partial \hat{I}}{\partial \theta}\Big]$$
  The diffusion model acts as a teacher; no backpropagation through the diffusion sampling chain is needed.
- **NeRF as the differentiable 3D canvas**: A randomly initialized NeRF is rendered from randomly sampled camera viewpoints each step; optimizing the SDS loss across many views forces the emerging geometry to be consistent from all directions.
- **Shading for true geometry**: Rendering with a Lambertian shading model under random lighting discourages the NeRF from baking appearance into view-dependent effects, encouraging genuine 3D shape.
- **Zero 3D supervision**: The entire pipeline requires only the pretrained 2D diffusion model — all 3D knowledge is implicit in the 2D prior.

## Why it matters for SLAM

DreamFusion connected two previously separate threads — neural rendering (NeRF) and generative diffusion models — and its SDS loss was immediately reused in a large family of follow-up text-to-3D works (Magic3D, ProlificDreamer, and others). For SLAM, it established the idea that a generative 2D prior can hallucinate plausible 3D structure: the same mechanism can, in principle, complete texture and geometry in the unobserved regions of a SLAM map, a recurring theme in generative map completion and Spatial AI research.

## Related

- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
- [Sora / DiT](sora-dit.md)
- [Spatial AI](spatial-ai.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
