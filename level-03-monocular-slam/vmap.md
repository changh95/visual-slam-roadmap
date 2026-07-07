# vMAP

> Kong 2023 · [Paper](https://arxiv.org/abs/2302.01838)

**One-line summary** — Object-level neural-field SLAM in which every detected object gets its own small MLP, enabling compositional scene understanding, object editing, and watertight per-object reconstruction.

## Problem

Neural-field SLAM systems like iMAP and NICE-SLAM represent the whole scene as a single monolithic field, with no object-level structure: you cannot remove a chair, move a cup, or reason about one instance independently — capabilities that robotic manipulation, scene editing, and embodied AI all require. Object-level SLAM, meanwhile, had relied on shape priors or CAD models. vMAP asks how to get efficient, watertight, *model-free* object reconstruction inside a live SLAM system.

## Key ideas

- **Per-object neural fields**: each object is represented by its own small MLP in its local coordinate frame (plus a background field), enabling efficient, watertight object modelling without any 3D shape priors.
- **On-the-fly object discovery**: as an RGB-D camera browses a scene with no prior information, instance segmentation detects objects, and each new instance's MLP is initialised and dynamically added to the map during operation.
- **Vectorised training**: the key systems trick — all object MLPs are trained simultaneously as one batched (vectorised) computation rather than in a Python loop, letting vMAP optimise as many as 50 individual objects in a single scene with a training speed of 5 Hz map updates.
- **Object-aware rendering**: each ray is rendered by querying the relevant object fields and the background and compositing their contributions via volume rendering, so supervision from ordinary RGB-D frames flows to the right object networks through the instance masks.
- **Isolation pays**: because objects are independent networks trained independently, there is no catastrophic interference between objects — and any object can be individually frozen, removed, or rigidly transformed, turning the map into an editable scene graph of shapes.

## Results & impact

vMAP demonstrates significantly improved scene-level *and* object-level reconstruction quality compared to prior neural-field SLAM systems, while optimising up to 50 objects per scene at 5 Hz map-update speed. On top of competitive scene-level reconstruction, it provides the object-level decomposition that monolithic neural-field systems lack. It became the reference design for object-centric neural-field mapping and influenced subsequent object-aware dense SLAM work.

## Why it matters for SLAM

vMAP brought object-level decomposition to neural-field SLAM, bridging the object-SLAM lineage (SLAM++, Fusion++, NodeSLAM) with the implicit-mapping lineage (iMAP, NICE-SLAM). The resulting maps are not just geometry but a set of manipulable object entities — exactly the representation robotic manipulation and scene-editing applications need — and the per-object design scales naturally with scene complexity. It influenced subsequent object-centric neural SLAM and scene-understanding systems.

## Related

- [iMAP](imap.md) — the single-MLP neural-field SLAM vMAP decomposes
- [NICE-SLAM](nice-slam.md) — hierarchical-grid neural SLAM baseline
- [SLAM++](../level-04-rgbd-slam/slampp.md) — the original object-level SLAM idea
- [Fusion++](../level-04-rgbd-slam/fusionpp.md) — per-object TSDF volumes without shape priors
- [DSP-SLAM](../level-04-rgbd-slam/dsp-slam.md) — object SLAM with learned shape priors, the step before per-object fields

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
