# ConceptGraphs

> Gu 2023 · [Paper](https://arxiv.org/abs/2309.16650)

**One-line summary** — ConceptGraphs builds open-vocabulary 3D scene graphs by fusing 2D foundation-model outputs (SAM segments, CLIP embeddings) into 3D object nodes and using an LLM to infer inter-object relations, yielding language-queryable maps for planning.

## Problem

Robots need a 3D world representation that is semantically rich yet compact and efficient for task-driven perception and planning. Recent attempts to inject vision-language features into 3D maps produce per-point feature vectors, which "do not scale well in larger environments, nor do they contain semantic spatial relationships between entities" — while traditional closed-set scene graphs are locked to predefined label sets. ConceptGraphs targets an open-vocabulary representation that is object-centric, graph-structured, and buildable without any 3D training data.

## Key ideas

- **Lift 2D foundation models to 3D.** SAM provides class-agnostic segments per frame; CLIP embeds each segment into vision-language space; multi-view association — combining geometric overlap with embedding similarity — fuses segments across views into 3D object nodes. No 3D datasets are collected and no models are fine-tuned.
- **Objects, not points.** Storing one node per object (with fused geometry and a CLIP embedding) instead of a feature per 3D point keeps the map compact and scalable, and makes objects first-class entities that planners can reason over.
- **LLM-inferred relations.** A large language model infers spatial/semantic relations between object nodes (e.g., "the mug is on the table"), creating the graph's edges — turning a bag of labeled objects into a genuine scene graph usable for downstream reasoning.
- **Open-vocabulary querying.** Any text query is embedded with CLIP and scored against node embeddings by cosine similarity,

  $$\text{sim}(q, o_i) = \frac{\mathbf{e}(q) \cdot \mathbf{e}(o_i)}{\|\mathbf{e}(q)\|\,\|\mathbf{e}(o_i)\|},$$

  so the map "generalizes to novel semantic classes" and answers descriptions never seen during mapping.
- **Perception for planning.** The representation is explicitly designed so that planning tasks specified through abstract language prompts — requiring complex reasoning over spatial and semantic concepts — can be grounded in the graph.

## Results & impact

- The paper demonstrates the representation's utility on a number of downstream planning tasks specified via abstract language prompts, including deployments on real robot platforms (abstract); the work was published at ICRA 2024.
- Established the now-standard SAM + CLIP + LLM recipe for open-vocabulary robot mapping — widely adopted across embodied-AI systems in 2024–2025.
- Together with per-point/field approaches (ConceptFusion, LERF, OpenScene) it framed the design space of open-vocabulary 3D maps: dense features vs object-centric graphs; task-driven successors like Clio build directly on this framing.

## Why it matters for SLAM

ConceptGraphs showed that 2D foundation models can be lifted into 3D by ordinary multi-view association — no new 3D networks required — turning a SLAM system's posed RGB-D stream into a language-queryable object map. As SLAM's output increasingly feeds language-driven planners, graph-structured open-set maps like this define what a "semantic map" means in modern Spatial AI.

## Related

- [SAM](sam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)
- [Hydra](hydra.md)
- [Clio](clio.md)
- [OpenScene](../level-03-monocular-slam/openscene.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
