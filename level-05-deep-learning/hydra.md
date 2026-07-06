# Hydra

> Hughes (MIT SPARK) 2022 · [Paper](https://arxiv.org/abs/2201.13360)

**One-line summary** — First real-time system that builds and optimizes a hierarchical 3D scene graph (mesh → objects → places → rooms → buildings) directly from a robot's sensor stream.

## Key ideas

- **5-layer hierarchical scene graph**: Dense metric maps lack semantic structure; pure knowledge graphs lack geometric grounding. Hydra combines both in a layered graph — metric-semantic mesh, objects, places, rooms, buildings — with typed nodes and edges.
- **Metric-semantic mesh**: Incrementally fuses depth and panoptic segmentation into an ESDF plus a semantically labeled mesh.
- **Objects layer**: Semantic mesh segments become 3D bounding boxes with class labels, associated over time (Hungarian-algorithm tracking).
- **Places layer**: Topological free-space places are extracted from the Generalized Voronoi Diagram (GVD) of the ESDF, with nodes at topological branch points.
- **Rooms and buildings**: Spectral clustering of the places graph segments rooms; a top-level node represents each connected structure.
- **Joint optimization**: Loop closures update robot poses together with the scene graph, keeping all layers geometrically consistent — and it all runs online.

## Why it matters for SLAM

Hydra turned the 3D Dynamic Scene Graph idea introduced by Kimera from an offline construction into a real-time spatial perception system, and its 5-layer hierarchy became the de facto standard Spatial AI representation. It is the foundation of an entire MIT SPARK ecosystem — Hydra-Multi (multi-robot), Clio (task-driven open-set graphs), and Khronos (spatio-temporal dynamics) — and enables robots to reason and take language commands at multiple levels of abstraction ("go to the kitchen" vs "fetch the mug").

## Related

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — the scene-graph concept Hydra makes real-time
- [Hydra-Multi](hydra-multi.md) — multi-robot extension
- [Clio](clio.md) — task-driven open-set scene graphs
- [Khronos](khronos.md) — spatio-temporal extension for dynamic scenes
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs

[Back to Level 5](../README.md#level-5-applying-deep-learning)
