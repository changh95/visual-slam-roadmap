# Clio

> Maggio (MIT SPARK) 2024 · [Paper](https://arxiv.org/abs/2404.13696)

**One-line summary** — Clio builds real-time, task-driven open-set 3D scene graphs: the robot is given tasks in natural language, and the map's object granularity is chosen to be just sufficient for those tasks.

## Key ideas

- Class-agnostic segmentation (SAM) plus open-set embeddings (CLIP) let robots map "countless" semantic variations — which raises a fundamental question: what is the right granularity of objects and concepts to keep in the map?
- Clio's answer: granularity is intrinsically **task-dependent**. "Fetch the red apple" needs fine-grained objects; "go to the kitchen" needs coarse regions. Prior work implicitly fixed granularity via detection thresholds.
- The problem is formulated with the classical Information Bottleneck principle: cluster measurement segments into objects that retain only the information relevant to the given list of natural-language tasks.
- Each scene graph node carries CLIP embeddings, so the map is open-set and queryable by language; the pipeline runs in real time and is demonstrated onboard robots.
- Sits in the MIT SPARK scene-graph lineage: Kimera / 3D Dynamic Scene Graphs → Hydra (real-time construction) → Clio (task-driven, open-set semantics).

## Why it matters for SLAM

Clio marks the shift from "map everything at fixed semantic granularity" to "map what the task needs" — a key idea as SLAM merges with embodied AI. For robots driven by natural-language instructions, a task-conditioned scene graph keeps maps compact while remaining useful for planning, and it shows how foundation models (SAM, CLIP) integrate into a real-time metric-semantic SLAM stack rather than an offline pipeline.

## Related

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md)
- [Hydra](hydra.md)
- [ConceptGraphs](conceptgraphs.md)
- [Khronos](khronos.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
