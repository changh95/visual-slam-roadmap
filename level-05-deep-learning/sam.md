# SAM

> Kirillov 2023 · [Paper](https://arxiv.org/abs/2304.02643)

**One-line summary** — Segment Anything: a promptable segmentation foundation model trained on 1B masks from 11M images that segments arbitrary objects zero-shot from point, box, or mask prompts.

## Key ideas

- **Promptable segmentation as a foundation task**: Instead of separate models for semantic/instance/panoptic segmentation, one model answers "segment the thing indicated by this prompt" — generalizing across tasks without fine-tuning.
- **Decoupled architecture**: A heavy ViT-H image encoder runs once per image; a lightweight prompt encoder + mask decoder then produce masks in milliseconds per prompt, enabling interactive use.
- **Ambiguity handling**: The decoder outputs 3 candidate masks with IoU confidence scores (e.g., part vs. whole object) instead of forcing a single answer.
- **SA-1B data engine**: 1 billion masks collected via a human-in-the-loop loop where SAM assisted its own annotation — the data flywheel that makes it a foundation model.
- Zero-shot performance competitive with supervised specialists across dozens of segmentation benchmarks.

## Why it matters for SLAM

SAM gave SLAM systems class-agnostic object masks on demand — the missing ingredient for open-vocabulary semantic mapping. Paired with a text-prompted detector (Grounded SAM = Grounding DINO + SAM), it powers 3D scene-graph and open-vocabulary mapping systems like ConceptGraphs and Clio, and provides clean masks for dynamic-object removal. Its video successor SAM 2 adds the temporal consistency SLAM actually needs across frames.

## Related

- [SAM 2](sam-2.md) — video extension with streaming memory
- [Grounding DINO](grounding-dino.md) — text-prompted boxes that feed SAM
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs built on SAM masks
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md) — open-set multimodal 3D mapping

[Back to Level 5](../README.md#level-5-applying-deep-learning)
