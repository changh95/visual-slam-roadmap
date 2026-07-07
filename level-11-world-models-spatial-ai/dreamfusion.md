# DreamFusion

> Poole 2023 · [Paper](https://arxiv.org/abs/2209.14988)

**One-line summary** — DreamFusion uses a pretrained 2D text-to-image diffusion model (Imagen) as a frozen prior to optimize a NeRF from a text prompt alone, via the Score Distillation Sampling (SDS) loss, enabling text-to-3D generation without any 3D training data.

## Problem

Text-to-image synthesis was transformed by diffusion models trained on billions of image-text pairs, but adapting the recipe to 3D would require two things that did not exist: large-scale labeled 3D data and efficient architectures for denoising 3D data directly. NeRF had shown a 3D scene can be a network optimized purely through image-space losses on its renderings. DreamFusion asks whether a frozen 2D diffusion model can *be* that image-space loss — sampling in NeRF parameter space rather than pixel space, so all 3D knowledge is distilled out of a purely 2D prior.

## Method & architecture

**Diffusion prior.** A text-conditioned diffusion model is trained with the weighted denoising objective
$$\mathcal{L}_{\text{Diff}}(\phi, \mathbf{x}) = \mathbb{E}_{t \sim \mathcal{U}(0,1),\, \epsilon \sim \mathcal{N}(\mathbf{0},\mathbf{I})}\big[ w(t)\, \| \epsilon_\phi(\alpha_t \mathbf{x} + \sigma_t \epsilon; t) - \epsilon \|_2^2 \big],$$
and DreamFusion uses its classifier-free-guided noise prediction $\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) = (1+\omega)\,\epsilon_\phi(\mathbf{z}_t; y, t) - \omega\,\epsilon_\phi(\mathbf{z}_t; t)$ with an unusually large guidance weight $\omega = 100$.

**Score Distillation Sampling.** A differentiable image parameterization $\mathbf{x} = g(\theta)$ (here: a NeRF renderer) is optimized so its renders look like samples. Differentiating $\mathcal{L}_{\text{Diff}}$ through the U-Net is expensive and poorly conditioned; omitting the U-Net Jacobian gives the SDS gradient
$$\nabla_\theta \mathcal{L}_{\text{SDS}}(\phi, \mathbf{x} = g(\theta)) \triangleq \mathbb{E}_{t,\epsilon}\Big[ w(t)\big(\hat{\epsilon}_\phi(\mathbf{z}_t; y, t) - \epsilon\big) \tfrac{\partial \mathbf{x}}{\partial \theta} \Big],$$
which the paper proves is the gradient of a weighted probability-density-distillation loss, $\nabla_\theta\, \mathbb{E}_t\big[ (\sigma_t / \alpha_t)\, w(t)\, \text{KL}\big(q(\mathbf{z}_t \mid g(\theta); y, t)\ \|\ p_\phi(\mathbf{z}_t; y, t)\big)\big]$. No backpropagation through the diffusion model is needed — it acts as a frozen critic whose noise residual points toward higher-density images for prompt $y$.

**NeRF with shading.** The 3D canvas is a mip-NeRF 360 variant whose MLP outputs density and *albedo*, $(\tau, \boldsymbol{\rho}) = \text{MLP}(\boldsymbol{\mu}; \theta)$, composited with standard volume-rendering weights $w_i = \alpha_i \prod_{j<i}(1-\alpha_j)$, $\alpha_i = 1 - \exp(-\tau_i\|\boldsymbol{\mu}_i - \boldsymbol{\mu}_{i+1}\|)$. Surface normals come from the density gradient, $\mathbf{n} = -\nabla_{\boldsymbol{\mu}}\tau / \|\nabla_{\boldsymbol{\mu}}\tau\|$, and each point is Lambertian-shaded by a randomly placed point light $\boldsymbol{\ell}$:
$$\mathbf{c} = \boldsymbol{\rho} \circ \big(\boldsymbol{\ell}_\rho \circ \max(0,\ \mathbf{n} \cdot (\boldsymbol{\ell} - \boldsymbol{\mu}) / \|\boldsymbol{\ell} - \boldsymbol{\mu}\|) + \boldsymbol{\ell}_a\big).$$
Randomly swapping the albedo for white gives "textureless" renders, preventing degenerate flat-billboard solutions where scene content is painted onto flat geometry.

**Per-prompt optimization loop.** Each iteration: (1) sample a random camera (elevation $-10°$ to $90°$, full azimuth, distance 1–1.5) and light; (2) render the shaded NeRF at 64×64, choosing among illuminated, albedo-only, and textureless renders; (3) append view-dependent text ("front/side/back/overhead view") to the prompt and compute the SDS gradient with the frozen 64×64 Imagen base model ($w(t)=\sigma_t^2$, $t \sim \mathcal{U}(0.02, 0.98)$); (4) update NeRF weights with Distributed Shampoo. 15,000 iterations take ~1.5 hours on a 4-chip TPUv4; opacity and orientation regularizers keep the density field clean.

## Results

Evaluated with **CLIP R-Precision** (can CLIP retrieve the correct caption from a rendering?) on the 153 object-centric COCO prompts of Dream Fields, over both color and *textureless geometry* ("Geo") renders:

| Method | B/32 Color | B/32 Geo | B/16 Color | B/16 Geo | L/14 Color | L/14 Geo |
|---|---|---|---|---|---|---|
| GT MS-COCO images | 77.1 | – | 79.1 | – | – | – |
| Dream Fields | 68.3 | – | 74.2 | – | – | – |
| CLIP-Mesh | 67.8 | – | 75.8 | – | 74.5 | – |
| **DreamFusion** | **75.1** | **42.5** | **77.5** | **46.6** | **79.7** | **58.5** |

DreamFusion approaches ground-truth-image consistency on color renders while being the only method with strong geometry scores (CLIP-trained baselines collapse to ~1 Geo, revealing texture painted on flat shapes). Ablations show viewpoint augmentation, view-dependent prompts, lighting, and textureless renders each improve geometry, with full renders improving by +12.5%. The optimized models can be viewed from any angle, relit, and composited into 3D environments. Known limitations from the paper: SDS is mode-seeking, yielding oversaturated/oversmoothed results and little diversity across seeds.

## Why it matters for SLAM

DreamFusion connected two previously separate threads — neural rendering (NeRF) and generative diffusion models — and its SDS loss was immediately reused in a large family of follow-up text-to-3D works (Magic3D, ProlificDreamer, and others). For SLAM, it established the idea that a generative 2D prior can hallucinate plausible 3D structure: the same mechanism can, in principle, complete texture and geometry in the unobserved regions of a SLAM map, a recurring theme in generative map completion and Spatial AI research.

## Related

- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
- [Sora / DiT](sora-dit.md)
- [Spatial AI](spatial-ai.md)
- [World model](world-model.md)
