# Sora / DiT

> OpenAI 2024 · [Paper](https://openai.com/index/sora/)

**One-line summary** — Sora scales the Diffusion Transformer (DiT) architecture on spacetime patches of video to generate long, temporally coherent videos from text — and its outputs exhibit emergent 3D consistency, suggesting that video generation at scale implicitly learns scene geometry.

## Key ideas

- **Diffusion Transformer (DiT)**: DiT (Peebles and Xie) replaces the U-Net backbone of diffusion models with a Transformer operating on latent patch tokens, showing that diffusion quality scales predictably with Transformer compute — the architectural foundation Sora builds on.
- **Spacetime patches**: Videos are compressed into a spatiotemporal latent space and cut into spacetime patch tokens, a unified representation that lets one model train on and generate videos of variable duration, resolution, and aspect ratio.
- **Video generation as world simulation**: OpenAI explicitly frames Sora as a step toward "world simulators" — models whose generative rollouts respect scene dynamics well enough to be useful for reasoning about the physical world.
- **Emergent 3D understanding**: Trained only on 2D video with a denoising objective, Sora produces consistent camera motion, object permanence, and 3D-plausible scene layout — geometry emerging as a byproduct of predicting video at scale.

## Why it matters for SLAM

Sora is the strongest public evidence that internet-scale video training yields implicit 3D scene understanding without any 3D supervision — the same emergent property GAIA-1 observed in driving. This matters to SLAM in two directions: DiT-style generative models are becoming the engine behind world foundation models (Cosmos and successors) that synthesize training data for embodied systems, and the question "can the 3D knowledge inside a video generator be extracted as an explicit, metrically consistent map?" is now a live research frontier at the SLAM-generative AI interface.

## Related

- [World model](world-model.md)
- [GAIA-1](gaia-1.md)
- [NVIDIA Cosmos](nvidia-cosmos.md)
- [DreamFusion](dreamfusion.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
