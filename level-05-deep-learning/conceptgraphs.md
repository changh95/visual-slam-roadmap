# ConceptGraphs

> Gu 2023 · [Paper](https://arxiv.org/abs/2309.16650)

**One-line summary** — ConceptGraphs builds open-vocabulary 3D scene graphs by fusing 2D foundation-model outputs (SAM segments, CLIP embeddings) into 3D object nodes and using an LLM to infer inter-object relations, yielding language-queryable maps for planning.

## Key ideas

- Per-point feature maps (fusing CLIP features into every 3D point) do not scale to large environments and carry no relational structure; closed-set scene graphs are limited to predefined labels. ConceptGraphs targets a representation that is semantically rich, compact, and structured.
- **SAM** provides class-agnostic segments per frame; **CLIP** embeds each segment into vision-language space; multi-view association (geometric + embedding similarity) fuses segments into 3D object nodes — no 3D training data or fine-tuning needed.
- An **LLM** infers spatial/semantic relations between objects to create graph edges (e.g., "the mug is on the table"), producing a full scene graph rather than a bag of objects.
- The graph generalizes to novel semantic classes and supports abstract, open-ended language queries for downstream planning tasks, demonstrated on real robots.
- Note in this roadmap: also relevant to the Level 3 semantic-mapping track (ConceptFusion, LERF, OpenScene are the per-point/field-based counterparts).

## Why it matters for SLAM

ConceptGraphs established the now-standard SAM + CLIP + LLM recipe for open-vocabulary robot mapping, showing that 2D foundation models can be lifted into 3D by ordinary multi-view association — no new 3D networks required. As SLAM's output increasingly feeds language-driven planners, graph-structured open-set maps like this (and their task-driven successors like Clio) define what a "semantic map" means in modern Spatial AI.

## Related

- [SAM](sam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
- [Hydra](hydra.md)
- [Clio](clio.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
