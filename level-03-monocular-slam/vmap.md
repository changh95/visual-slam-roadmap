# vMAP

> Kong 2023 · [Paper](https://arxiv.org/abs/2302.01838)

**One-line summary** — Object-level neural-field SLAM in which every detected object gets its own small MLP, enabling compositional scene understanding, object editing, and watertight per-object reconstruction.

## Key ideas

- **Per-object neural fields**: instead of one monolithic scene network (as in iMAP or NICE-SLAM), each object instance is represented by its own compact MLP in its local coordinate frame, plus a background field.
- **Instance segmentation front-end**: off-the-shelf instance segmentation associates pixels with object instances, driving the creation and supervision of object fields.
- **Vectorised training**: many small object MLPs are trained simultaneously in a batched (vectorised) fashion, keeping the whole system efficient enough for online mapping.
- **Object-aware rendering**: rays are rendered by compositing contributions from the relevant object fields and the background via volume rendering.
- **Object-level manipulation**: because objects are independent networks, they can be individually frozen, removed, or transformed, and training one object does not catastrophically interfere with others.

## Why it matters for SLAM

vMAP brought object-level decomposition to neural-field SLAM, bridging the object-SLAM lineage (SLAM++, Fusion++, NodeSLAM) with the implicit-mapping lineage (iMAP, NICE-SLAM). The resulting maps are not just geometry but a set of manipulable object entities — exactly the representation robotic manipulation and scene-editing applications need — and the per-object design scales naturally with scene complexity. It influenced subsequent object-centric neural SLAM and scene-understanding systems.

## Related

- [iMAP](imap.md) — the single-MLP neural-field SLAM vMAP decomposes
- [NICE-SLAM](nice-slam.md) — hierarchical-grid neural SLAM baseline
- [SLAM++](../level-04-rgbd-slam/slampp.md) — the original object-level SLAM idea
- [Fusion++](../level-04-rgbd-slam/fusionpp.md) — per-object TSDF volumes without shape priors

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
