# World Labs / Marble

> Fei-Fei Li 2025 · [Paper](https://www.worldlabs.ai/)

**One-line summary** — Marble, from Fei-Fei Li's startup World Labs, generates persistent, navigable 3D worlds — delivered as Gaussian-splat scenes — from image, video, or text prompts, positioning "Spatial Intelligence" as the next foundation-model capability after language.

## Key ideas

- **Spatial Intelligence thesis**: World Labs argues that understanding, reasoning about, and generating 3D space is a fundamental AI capability analogous to linguistic intelligence — and that it can be learned at scale from predominantly 2D internet data (images, video) plus 3D assets.
- **Explicit, persistent 3D output**: Unlike video generators (Sora, GAIA-1) whose outputs are 2D pixel sequences without a stable underlying scene, Marble produces an explicit 3D representation (Gaussian-splat scenes) that persists and can be rendered from arbitrary viewpoints — the world does not change when you look away.
- **Prompt-to-world**: A single image, a video clip, or a text description conditions the generation; learned spatial priors (walls are vertical, chairs sit near tables) extrapolate plausible structure for regions never observed in the prompt.
- **Reconstruction vs generation convergence**: Multi-view reconstruction methods (NeRF, 3DGS) need many posed images; generative world models need none but lack 3D structure. Marble sits between them — generative, but committing to explicit geometry.

## Why it matters for SLAM

Marble targets the same output artifact SLAM produces — a consistent, renderable 3D scene — but obtains it by generation from priors rather than by measurement, which sharpens the question of when sensor-based mapping is actually necessary. For SLAM research, generative world models like this suggest concrete hybrid uses: filling unobserved regions of a SLAM map with plausible geometry, providing map priors for exploration, and supplying photorealistic 3D environments for testing SLAM and navigation stacks. As a commercial product from one of AI's most prominent researchers, it also signals that Spatial AI has moved from research vision to product race.

## Related

- [Spatial AI](spatial-ai.md)
- [DreamFusion](dreamfusion.md)
- [Sora / DiT](sora-dit.md)
- [GAIA-1](gaia-1.md)

[Back to Level 11](../README.md#level-11-world-models--spatial-ai)
