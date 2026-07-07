# Hydra

> Hughes (MIT SPARK) 2022 · [Paper](https://arxiv.org/abs/2201.13360)

**One-line summary** — First real-time system that builds and optimizes a hierarchical 3D scene graph (mesh → objects → places → rooms → buildings) directly from a robot's sensor stream.

## Problem

3D scene graphs had just emerged as a powerful high-level representation of 3D environments: a layered graph whose nodes represent spatial concepts at multiple levels of abstraction and whose edges represent relations between those concepts. But prior systems — including Kimera's 3D Dynamic Scene Graphs — constructed them offline, in batch, after exploration was finished; how to build such a rich "mental model" in real time onboard a robot was, in the authors' words, uncharted territory. A second open question was what loop closure even means for a scene graph: when the trajectory estimate is corrected, every layer sitting on top of the mesh must be corrected consistently as well.

## Key ideas

- **5-layer hierarchical scene graph**: Dense metric maps lack semantic structure; pure knowledge graphs lack geometric grounding. Hydra combines both in a layered graph — metric-semantic mesh, objects, places, rooms, buildings — with typed nodes and edges.
- **Incremental construction around the robot**: Real-time algorithms build a local Euclidean Signed Distance Function (ESDF) around the current robot location, extract a topological map of places from the ESDF, and segment the places into rooms using an approach inspired by community-detection techniques — so the layers grow as the robot explores rather than being computed in batch.
- **Objects layer**: Semantic mesh segments (from fused depth + panoptic segmentation) become 3D bounding boxes with class labels, associated over time with Hungarian-algorithm tracking.
- **Places layer**: Topological free-space places are extracted from the Generalized Voronoi Diagram (GVD) of the ESDF, with nodes at topological branch points; edges encode traversability.
- **Hierarchical loop-closure descriptors**: The scene graph itself enables loop closure detection — descriptors capture statistics *across layers*, ranging from low-level visual appearance to summary statistics about objects and places, so place recognition can exploit semantics, not just appearance.
- **Scene-graph optimization via embedded deformation graphs**: Hydra introduces the first algorithm to optimize a 3D scene graph in response to loop closures; an embedded deformation graph simultaneously corrects all layers — mesh, objects, places, and above — together with the robot poses.
- **Fast/slow architecture**: The implementation combines fast early- and mid-level perception processes (mesh, objects, places) with slower high-level perception (rooms, loop closure, global optimization), which is what makes online operation possible.

## Results & impact

Evaluated on simulated and real data, Hydra reconstructs 3D scene graphs with accuracy comparable to batch offline methods despite running online. Its 5-layer hierarchy became the de facto standard Spatial AI representation, and the open-source MIT SPARK implementation is widely used in robotics research as the reference platform for hierarchical metric-semantic mapping.

## Why it matters for SLAM

Hydra turned the 3D Dynamic Scene Graph idea introduced by Kimera from an offline construction into a real-time spatial perception system, and its 5-layer hierarchy became the de facto standard Spatial AI representation. It is the foundation of an entire MIT SPARK ecosystem — Hydra-Multi (multi-robot), Clio (task-driven open-set graphs), and Khronos (spatio-temporal dynamics) — and enables robots to reason and take language commands at multiple levels of abstraction ("go to the kitchen" vs "fetch the mug").

## Related

- [Kimera / 3D Dynamic Scene Graph](kimera-3d-dynamic-scene-graph.md) — the scene-graph concept Hydra makes real-time
- [Hydra-Multi](hydra-multi.md) — multi-robot extension
- [Clio](clio.md) — task-driven open-set scene graphs
- [Khronos](khronos.md) — spatio-temporal extension for dynamic scenes
- [ConceptGraphs](conceptgraphs.md) — open-vocabulary 3D scene graphs
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the classical machinery the deformation-graph correction extends

[Back to Level 5](../README.md#level-5-applying-deep-learning)
