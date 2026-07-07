# Clio

> Maggio (MIT SPARK) 2024 · [Paper](https://arxiv.org/abs/2404.13696)

**One-line summary** — Clio builds real-time, task-driven open-set 3D scene graphs: the robot is given tasks in natural language, and the map's object granularity is chosen to be just sufficient for those tasks.

## Problem

Class-agnostic segmentation (SAM) plus open-set embeddings (CLIP) mean robot maps are no longer restricted to tens or hundreds of classes — they can contain "a plethora of objects and countless semantic variations". That raises a fundamental question the paper poses directly: what is the right granularity for the objects, and more generally the semantic concepts, that the robot has to include in its map? Prior work implicitly picks a granularity by tuning detection thresholds; Clio argues that choice is intrinsically task-dependent and should be made by the mapping system itself.

## Key ideas

- **Task-driven 3D scene understanding.** The robot is given a list of tasks in natural language and must select the granularity — and the subset of objects and scene structure to retain in the map — that is *sufficient* to complete those tasks. "Fetch the red apple" needs fine-grained objects; "go to the kitchen" needs coarse regions.
- **Information Bottleneck formulation.** The problem is naturally formalized with the classical Information Bottleneck (IB): compress the set of observed 3D primitives into clusters (objects/regions) while preserving the information relevant to the task list — conceptually, minimize $I(\text{primitives};\text{clusters})$ subject to keeping $I(\text{clusters};\text{tasks})$ high.
- **Agglomerative, incremental clustering.** An Agglomerative IB algorithm clusters 3D primitives into task-relevant objects and regions, and executes incrementally, so the map refines as the robot explores rather than in an offline pass.
- **Real-time hierarchical scene graph.** The clustering is integrated into a real-time pipeline that constructs a hierarchical 3D scene graph online using only onboard compute; each node carries CLIP embeddings, so the map remains open-set and queryable by language.
- **SPARK lineage.** Clio continues the MIT SPARK scene-graph line: Kimera / 3D Dynamic Scene Graphs (representation) → Hydra (real-time construction) → Clio (task-driven, open-set semantics), with Khronos as the dynamic/temporal sibling.

## Results & impact

- The abstract reports an extensive experimental campaign showing Clio "not only allows real-time construction of compact open-set 3D scene graphs, but also improves the accuracy of task execution by limiting the map to relevant semantic concepts".
- Demonstrated running online, onboard robots — evidence that foundation-model semantics (SAM, CLIP) can live inside a real-time metric-semantic mapping stack, not just an offline pipeline.
- Together with ConceptGraphs, it defined the 2024-era answer to what an "open-vocabulary semantic map" should be — but adds the distinctive task-conditioning principle.

## Why it matters for SLAM

Clio marks the shift from "map everything at fixed semantic granularity" to "map what the task needs" — a key idea as SLAM merges with embodied AI. For robots driven by natural-language instructions, a task-conditioned scene graph keeps maps compact while remaining useful for planning, and its IB formulation gives the granularity question a principled, information-theoretic footing rather than a threshold-tuning one.

## Related

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md)
- [Hydra](hydra.md)
- [ConceptGraphs](conceptgraphs.md)
- [Khronos](khronos.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SAM](sam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
