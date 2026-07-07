# World Labs / Marble

> Fei-Fei Li 2025 · [Paper](https://www.worldlabs.ai/)

**One-line summary** — Marble, from Fei-Fei Li's startup World Labs, generates persistent, navigable 3D worlds — delivered as Gaussian-splat scenes — from image, video, or text prompts, positioning "Spatial Intelligence" as the next foundation-model capability after language.

## Problem

Existing routes to a 3D scene sit at two extremes. Reconstruction methods (NeRF, 3D Gaussian Splatting) require tens of posed input images of a *real* place and only reproduce what was observed. Video generators (Sora, GAIA-1) create compelling imagery from a single prompt, but their output is a 2D pixel stream with no persistent underlying scene — look away and back, and the world may have changed. World Labs argues that world models should "reconstruct, generate, and simulate 3D worlds" and let humans and agents interact with them, and builds Marble as a generative model whose output is an explicit, persistent 3D world.

## Method & architecture

Marble is a commercial system; no paper, equations, or training details are public. What follows is the *system-level* pipeline as described in World Labs' announcement ("Marble: A Multimodal World Model", Nov 12, 2025):

- **Multimodal prompting to 3D**: Marble lifts text, a single image, multiple images, video, or a coarse 3D layout into a full 3D world. Multi-image prompts assign different views to different parts of the world (e.g., front/back), which Marble stitches into one consistent scene — including worlds built from photos or a short video of a real place.
- **Chisel — structure/style decoupling**: an experimental mode where the user lays out coarse 3D geometry (boxes, planes, imported assets) that fixes the world's *structure*, while a text prompt controls its *style*; the two can be mixed in any combination.
- **AI-native world editing**: local edits (remove/swap objects), style changes, or large re-structuring of a generated world; region-selective **expansion** grows the world and adds detail where splats had degraded; **composer mode** assembles multiple generated worlds into large spaces under explicit user-controlled layout.
- **Exports**: Gaussian splats as the highest-fidelity representation (rendered in-browser via Spark, World Labs' open-source THREE.js renderer); triangle meshes in two flavors — low-fidelity *collider meshes* for physics and high-quality visual meshes; and video renders with pixel-accurate camera control, optionally "enhanced" with added dynamics (smoke, flames, flowing water) while preserving the camera path and 3D structure.
- **Context**: preceded by a Dec 2024 "Generating Worlds" preview and the Oct 2025 RTFM real-time frame model; followed by a public World API (Jan 2026). Fei-Fei Li's accompanying manifesto frames spatial intelligence — perceiving, reasoning about, and acting in 3D space — as AI's next frontier.

Because the underlying model is undisclosed, no equations can be given here; treat this note as a product/system description.

## Results

No quantitative benchmarks are published. Publicly demonstrated results are qualitative: navigable, viewpoint-consistent Gaussian-splat worlds generated from single images, text, multi-image, and video prompts across diverse scene types and artistic styles; structure-controlled generation via Chisel; edited, expanded, and composed worlds; and mesh/video exports (nearly all videos in the announcement post were rendered directly from Marble worlds). See the World Labs blog for the demonstrations; claims cannot be independently verified.

## Why it matters for SLAM

Marble targets the same output artifact SLAM produces — a consistent, renderable 3D scene — but obtains it by generation from priors rather than by measurement, which sharpens the question of when sensor-based mapping is actually necessary. Its export formats (Gaussian splats, collider meshes) are exactly the representations modern SLAM and robotics simulation consume, suggesting concrete hybrid uses: filling unobserved regions of a SLAM map with plausible geometry, providing map priors for exploration, and supplying photorealistic 3D environments for testing SLAM and navigation stacks. As a commercial product from one of AI's most prominent researchers, it also signals that Spatial AI has moved from research vision to product race.

## Related

- [Spatial AI](spatial-ai.md)
- [DreamFusion](dreamfusion.md)
- [Sora / DiT](sora-dit.md)
- [GAIA-1](gaia-1.md)
