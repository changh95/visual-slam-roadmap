# Sora / DiT

> OpenAI 2024 · [Paper](https://openai.com/index/sora/)

**One-line summary** — Sora scales the Diffusion Transformer (DiT) architecture on spacetime patches of video to generate long, temporally coherent videos from text — and its outputs exhibit emergent 3D consistency, suggesting that video generation at scale implicitly learns scene geometry.

## Problem

Two problems meet here. First, image diffusion models were built on convolutional U-Net backbones whose scaling behavior was poorly understood; DiT (Peebles and Xie, "Scalable Diffusion Models with Transformers", [arXiv:2212.09748](https://arxiv.org/abs/2212.09748)) asked whether a plain Transformer over latent patches could serve as the denoiser and scale the way Transformers do elsewhere. Second, video generators were restricted to short clips at fixed resolution and duration. Sora, OpenAI's text-to-video system, combines a DiT-style backbone with a unified video representation trained at internet scale — explicitly framed by OpenAI as a step toward "world simulators".

## Method & architecture

The DiT paper works in the Latent Diffusion Model (LDM) framework: a frozen VAE encoder $E$ maps a $256\times 256\times 3$ image to a latent $z = E(x)$ of shape $32\times 32\times 4$, and the diffusion model is trained in that latent space. The pipeline is:

- **Patchify**: the noised latent of shape $I\times I\times C$ is cut into patches of size $p\times p$ and linearly embedded into a sequence of $T=(I/p)^2$ tokens of width $d$, with ViT sine-cosine positional embeddings. Halving $p$ quadruples the token count (and Gflops) while leaving parameter count essentially unchanged.
- **DiT blocks**: a stack of $N$ standard Transformer blocks in four configs (DiT-S/B/L/XL, spanning 0.3 to 118.6 Gflops). Conditioning on diffusion timestep $t$ and class $c$ is compared across four designs — in-context tokens, cross-attention (about 15% Gflops overhead), adaptive layer norm (adaLN), and **adaLN-Zero**: the scale/shift parameters $\gamma, \beta$ and per-block residual gates $\alpha$ are regressed from the embeddings of $t$ and $c$, with $\alpha$ initialized to zero so every block starts as the identity function.
- **Training objective**: standard DDPM noise prediction. With forward process $x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1-\bar{\alpha}_t}\, \epsilon_t$, $\epsilon_t \sim \mathcal{N}(0,\mathbf{I})$, the denoiser minimizes

$$\mathcal{L}_{simple}(\theta) = \lVert \epsilon_\theta(x_t) - \epsilon_t \rVert_2^2$$

  while the reverse-process covariance $\Sigma_\theta$ is trained with the full KL term; a linear decoder maps each token back to a $p\times p\times 2C$ noise-and-covariance prediction.
- **Classifier-free guidance**: $\hat{\epsilon}_\theta(x_t, c) = \epsilon_\theta(x_t, \emptyset) + s\cdot\big(\epsilon_\theta(x_t, c) - \epsilon_\theta(x_t, \emptyset)\big)$ with guidance scale $s > 1$.
- **Sora** (per OpenAI's technical report; no paper with equations exists): videos are compressed by a visual encoder into a spatiotemporal latent and cut into *spacetime patch tokens* — the video analogue of DiT's patchify — giving one uniform token format so a single model trains on and generates video of variable duration, resolution, and aspect ratio.

## Results

DiT's central finding is a strong negative correlation between model Gflops and FID-50K: across 12 models (configs S/B/L/XL, patch sizes 8/4/2 on class-conditional ImageNet), increasing depth/width or token count consistently improves FID, and models with similar total Gflops (e.g., DiT-S/2 and DiT-B/4) reach similar FID — compute, not parameter count, is what matters. adaLN-Zero beats cross-attention and in-context conditioning at all training stages; at 400K iterations its FID is nearly half the in-context variant's. Trained for 7M steps, DiT-XL/2 (118.6 Gflops) achieves **FID 2.27** on class-conditional ImageNet 256×256 with classifier-free guidance, beating the previous best diffusion FID of 3.60 (LDM) and the prior state of the art StyleGAN-XL, while being far cheaper per forward pass than pixel-space U-Nets (ADM: 1120 Gflops); it is also state of the art at 512×512, and already reaches FID 2.55 at 2.35M steps. Sora itself shipped as a technical report and product with qualitative results only — long, high-fidelity, temporally coherent video with emergent 3D consistency and object permanence; see OpenAI's report for its full demonstrations.

## Why it matters for SLAM

Sora is the strongest public evidence that internet-scale video training yields implicit 3D scene understanding without any 3D supervision — the same emergent property GAIA-1 observed in driving. This matters to SLAM in two directions: DiT-style generative models are becoming the engine behind world foundation models (Cosmos and successors) that synthesize training data for embodied systems, and the question "can the 3D knowledge inside a video generator be extracted as an explicit, metrically consistent map?" is now a live research frontier at the SLAM-generative AI interface. NVIDIA Cosmos even adopts DiT's adaLN layers (with LoRA) in its diffusion world models.

## Related

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [DreamFusion](dreamfusion.md)
