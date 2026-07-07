# GAIA-1

> Wayve 2023 · [Paper](https://arxiv.org/abs/2309.17080)

**One-line summary** — GAIA-1 ("Generative AI for Autonomy") is a generative world model that takes video, text, and ego-vehicle actions as input and generates realistic future driving scenarios with fine-grained control over ego-vehicle behavior, learning the implicit rules of road behavior from raw driving data.

## Problem

Building autonomous driving systems that can safely navigate the unstructured complexity of real-world scenarios remains hard, and a critical sub-problem is *prediction*: anticipating the various potential outcomes that may emerge in response to the vehicle's actions as the world evolves. Prior world models relied on labeled data or low-dimensional simulated representations that cannot generate realistic samples of complex real scenes, while video generators produce convincing pixels but weak representations of evolving world dynamics. GAIA-1 aims to keep the best of both: the scalability and realism of generative video models, and a world model's meaningful representation of the future.

## Method & architecture

GAIA-1 has three trainable components: an image tokenizer, an autoregressive world model, and a video diffusion decoder.

- **Image tokenizer (0.3B)**: a fully convolutional 2D U-Net discrete autoencoder downsamples each $288\times 512$ frame by $D=16$, giving $n = 18\times 32 = 576$ tokens with vocabulary $K=8192$ (about $470\times$ bit compression). It is trained with image reconstruction ($L_1$, $L_2$, perceptual, GAN), quantization losses, and an *inductive bias loss* — a cosine-similarity distillation of pre-trained DINO features that makes tokens semantic rather than high-frequency.
- **Unified token sequence**: per time step, tokens are interleaved text–image–action: text via frozen T5-large ($m=32$ tokens), actions as $l=2$ scalars (speed, curvature) linearly embedded, all in a shared $d=4096$ space with factorized spatio-temporal positional embeddings. Videos are subsampled to 6.25 Hz; $T=26$ frames (4 s) give a total sequence length of $T(m+n+l) = 15{,}860$.
- **World model (6.5B)**: an autoregressive transformer with causal masking trained to predict the next image token given all past tokens:

$$L_{\text{world model}} = -\sum_{t=1}^{T}\sum_{i=1}^{n} \log p\big(z_{t,i} \mid \mathbf{z}_{<t},\; z_{t,j<i},\; \mathbf{c}_{\leq t},\; \mathbf{a}_{<t}\big)$$

  where $z_{t,i}$ are image tokens, $\mathbf{c}$ text tokens, and $\mathbf{a}$ action tokens. Conditioning dropout (20%/40%/40% unconditioned/action/text) lets one model do unconditional, action-conditioned, and text-conditioned generation.
- **Video decoder (2.6B)**: a 3D U-Net video diffusion model with factorized spatial/temporal attention, trained multi-task (image generation, video generation, forward/backward autoregressive decoding, interpolation) on the denoising objective with $\mathbf{v}$-parameterization:

$$L_{\text{video}} = \mathbb{E}_{\epsilon, t'}\Big[\big\lVert \epsilon_\theta(\mathbf{x}^{t'}, t', \mathbf{z}, \mathbf{m}) - \epsilon \big\rVert_2^2\Big]$$

  where $\mathbf{x}^{t'} = \alpha_{t'}\mathbf{x} + \sigma_{t'}\epsilon$ is the noised video, $\mathbf{z}$ the conditioning image tokens, and $\mathbf{m}$ task-specific masks. It renders tokens to pixels and temporally upsamples 6.25 Hz to 12.5 Hz to 25 Hz (DDIM, 50 steps), decoding backwards from the last frames for stability.
- **Inference**: argmax sampling gets stuck in repetitive loops and full sampling hits the unreliable distribution tail, so top-k sampling is used; long rollouts use a sliding window. Text adherence uses classifier-free guidance, $l_{\text{final}} = (1+t)\, l_{\text{conditioned}} - t\, l_{\text{unconditioned}}$, with guidance scheduled over tokens and frames, and negative prompting by substituting the unconditioned logits.

## Results

Trained on 4,700 hours of proprietary London urban driving at 25 Hz (2019–2023, roughly 420M images) with feature-balanced sampling; validation is 400 held-out hours with strict geofences. The world model trained for 100k steps over 15 days on 64 A100 80GB GPUs; the decoder 300k steps on 32 A100s. GAIA-1 follows LLM-like scaling laws: fitting a power law $f(x) = c + (x/a)^{b}$ to models from 0.65M to 650M parameters (compute per token $C=6N$) accurately predicted the final 6.5B model's validation cross-entropy from runs using less than $20\times$ the compute, and extrapolation indicates substantial headroom from more data and compute. Demonstrated capabilities are qualitative (no standard benchmark numbers are reported): stable minutes-long fully imagined drives; multiple plausible futures from one video prompt (give-way interactions, roundabout choices, varying traffic); text control of weather and illumination; and action control that extrapolates out-of-distribution — forcing the ego-vehicle to steer off-lane, never seen in the expert data, yields geometrically accurate scenes and reactive agents (an oncoming car maneuvers to avoid collision).

## Why it matters for SLAM

GAIA-1 established the template for "world model as simulator" in autonomous driving: instead of hand-crafted physics and behavior rules (CARLA-style simulators), dynamics are learned from raw data and queried generatively to produce diverse synthetic training scenarios. Its emergent grasp of 3D geometry (pitch/roll over speed bumps, consistent road layout) came purely from next-token prediction. It directly inspired subsequent world foundation models such as NVIDIA Cosmos. For SLAM researchers, it poses the central Spatial AI question of how explicit metric maps should connect with implicit learned dynamics — e.g., using SLAM for localization while a world model imagines short-horizon futures for planning.

## Related

- [World model](world-model.md)
- [Sora / DiT](sora-dit.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [WorldVLA](worldvla.md)
- [Spatial AI](spatial-ai.md)
