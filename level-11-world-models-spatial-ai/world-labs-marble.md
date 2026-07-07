# World Labs / Marble

> Fei-Fei Li 2025 · [Paper](https://www.worldlabs.ai/)

**One-line summary** — Marble, from Fei-Fei Li's startup World Labs, generates persistent, navigable 3D worlds — delivered as Gaussian-splat scenes — from image, video, or text prompts, positioning "Spatial Intelligence" as the next foundation-model capability after language.

## Problem

Existing routes to a 3D scene sit at two extremes. Reconstruction methods (NeRF, 3D Gaussian Splatting) require tens of posed input images of a *real* place and only reproduce what was observed. Video generators (Sora, GAIA-1) create compelling imagery from a single prompt, but their output is a 2D pixel stream with no persistent underlying scene — look away and back, and the world may have changed. Humans, by contrast, can look at one photograph and mentally reconstruct a stable, navigable 3D world. World Labs targets exactly this gap.

## Key ideas

- **The Spatial Intelligence thesis**: World Labs argues that understanding, reasoning about, and generating 3D space is a fundamental AI capability analogous to linguistic intelligence — and that, like language, it can be learned at scale from predominantly 2D internet data (images, video) plus 3D assets.
- **Explicit, persistent 3D output**: Marble produces an explicit 3D representation — Gaussian-splat scenes — that persists and can be rendered from arbitrary viewpoints. The generated world does not change when you look away, which distinguishes it from frame-by-frame video generation.
- **Prompt-to-world**: a single image, a video clip, or a text description conditions the generation; learned spatial priors (rooms have walls, floors are flat, furniture obeys layout regularities) extrapolate plausible structure for regions never observed in the prompt.
- **Between reconstruction and generation**: multi-view reconstruction needs many posed images but is faithful; generative video needs none but lacks 3D structure. Marble sits between them — generative, yet committing to explicit geometry that downstream renderers, game engines, and robotics simulators can consume.
- **Product, not paper**: Marble is a commercial system described through company releases and demos rather than a peer-reviewed publication, so architectural and training details are only partially public. This note therefore stays at the level of what World Labs has publicly demonstrated and claimed.

## Results & impact

World Labs publicly demonstrated navigable, viewpoint-consistent 3D scenes generated from single images and text prompts, and shipped Marble as a product delivering persistent Gaussian-splat worlds. Because there is no peer-reviewed paper, quantitative claims cannot be verified here; the documented impact is strategic — one of AI's most prominent researchers building a company on the thesis that generative 3D world models are the next foundation-model frontier, pulling the reconstruction and generative-AI communities onto the same problem.

## Why it matters for SLAM

Marble targets the same output artifact SLAM produces — a consistent, renderable 3D scene — but obtains it by generation from priors rather than by measurement, which sharpens the question of when sensor-based mapping is actually necessary. For SLAM research, generative world models like this suggest concrete hybrid uses: filling unobserved regions of a SLAM map with plausible geometry, providing map priors for exploration, and supplying photorealistic 3D environments for testing SLAM and navigation stacks. As a commercial product from one of AI's most prominent researchers, it also signals that Spatial AI has moved from research vision to product race.

## Related

- [Spatial AI](spatial-ai.md)
- [DreamFusion](dreamfusion.md)
- [Sora / DiT](sora-dit.md)
- [GAIA-1](gaia-1.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
