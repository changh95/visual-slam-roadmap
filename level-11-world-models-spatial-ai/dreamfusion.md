# DreamFusion

> Poole 2023 · [Paper](https://arxiv.org/abs/2209.14988)

**One-line summary** — DreamFusion uses a pretrained 2D text-to-image diffusion model as a prior to optimize a NeRF from a text prompt alone, via the Score Distillation Sampling (SDS) loss, enabling text-to-3D generation without any 3D training data.

## Problem

Text-to-image synthesis was transformed by diffusion models trained on billions of image-text pairs, but adapting the recipe to 3D would require two things that did not exist: large-scale datasets of labeled 3D data and efficient architectures for denoising 3D data directly. At the same time, NeRF had shown that a 3D scene can be represented as a network optimized purely through image-space losses on its renderings. DreamFusion asks whether a frozen 2D diffusion model can *be* that image-space loss — so that all of the 3D knowledge is distilled out of a purely 2D prior.

## Key ideas

- **Circumvent the 3D data problem entirely**: instead of training a 3D generative model, use a pretrained 2D text-to-image diffusion model as a fixed prior for optimizing a parametric image generator — no 3D training data and no modification of the diffusion model are required.
- **Score Distillation Sampling (SDS)**: a loss based on probability density distillation. A rendered view $\hat{I} = g(\theta)$ of the NeRF is noised to $\mathbf{z}_t = \alpha_t \hat{I} + \sigma_t \boldsymbol{\epsilon}$, and the frozen diffusion model's noise-prediction residual supplies the gradient:
  $$\nabla_\theta \mathcal{L}_{\text{SDS}} = \mathbb{E}_{t,\epsilon,c}\Big[w(t)\big(\epsilon_\phi(\mathbf{z}_t;\, y, t) - \epsilon\big)\tfrac{\partial \hat{I}}{\partial \theta}\Big]$$
  The residual $\epsilon_\phi - \epsilon$ points toward images the model considers more probable for prompt $y$; crucially, no backpropagation through the diffusion model's sampling chain is needed — it acts as a frozen teacher.
- **NeRF as the differentiable 3D canvas**: a randomly initialized NeRF $f_\theta(\mathbf{x}, \mathbf{d}) = (\mathbf{c}, \sigma)$ is optimized by gradient descent in a DeepDream-like procedure, so that its 2D renderings *from random angles* all achieve low SDS loss. Enforcing the prior across many sampled viewpoints is what forces a single coherent 3D object to emerge.
- **Shading for true geometry**: renders use a Lambertian shading model with randomized lighting directions, which discourages the NeRF from baking appearance into view-dependent effects and pushes it toward genuine surface geometry rather than a flat "billboard" that only looks right from one direction.
- **Amortization-free generation**: each text prompt is a separate optimization run over NeRF weights — expensive per object, but conceptually clean: the only learned component is the reused 2D prior.

## Results & impact

The resulting 3D model of a given text prompt can be viewed from any angle, relit by arbitrary illumination, and composited into any 3D environment — demonstrating that pretrained image diffusion models are effective priors for 3D synthesis. DreamFusion produced recognizable 3D objects for a wide range of prompts and was evaluated qualitatively and via user studies (published at ICLR 2023). Its SDS loss was immediately reused across a large family of follow-up text-to-3D systems (Magic3D, ProlificDreamer, Fantasia3D and many others), making "diffusion prior + differentiable 3D representation" a standard pattern.

## Why it matters for SLAM

DreamFusion connected two previously separate threads — neural rendering (NeRF) and generative diffusion models — and its SDS loss was immediately reused in a large family of follow-up text-to-3D works (Magic3D, ProlificDreamer, and others). For SLAM, it established the idea that a generative 2D prior can hallucinate plausible 3D structure: the same mechanism can, in principle, complete texture and geometry in the unobserved regions of a SLAM map, a recurring theme in generative map completion and Spatial AI research.

## Related

- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
- [Sora / DiT](sora-dit.md)
- [Spatial AI](spatial-ai.md)
- [World model](world-model.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
