# Fusion++

> McCormac & Clark 2018 · [Paper](https://arxiv.org/abs/1808.08378)

**One-line summary** — An object-level volumetric SLAM system that uses Mask-RCNN instance segmentation to create per-object TSDF reconstructions of arbitrary objects — no prior models required — with objects as nodes in a 6-DoF pose graph.

## Problem

SLAM++ demonstrated object-level mapping but required a pre-built database of known 3D models, limiting it to controlled environments where every mappable object had been scanned in advance. Dense whole-scene maps (surfels, global TSDFs), meanwhile, are memory-hungry and treat objects and clutter identically. What was missing was a system that could *discover* arbitrary objects on the fly, reconstruct each one compactly, and use those persistent objects as the map itself — for tracking, relocalization, and loop closure.

## Key ideas

- **Deep-learning instance segmentation as the front-end**: as an RGB-D camera browses a cluttered indoor scene, Mask-RCNN instance segmentations provide class labels and pixel masks that initialize object reconstructions — no prior CAD models needed.
- **Per-object TSDF volumes**: each detection spawns a compact Truncated Signed Distance Function volume with *object size-dependent resolution* and a novel 3D foreground mask separating the object from its surroundings. Masked depth pixels are fused into the object's local volume:
  $$F_o(\mathbf{x}) \leftarrow \frac{W_o(\mathbf{x})\,F_o(\mathbf{x}) + w\,f(\mathbf{T}_o^{-1}\mathbf{T}_c^{-1}\mathbf{x})}{W_o(\mathbf{x}) + w}$$
  where $\mathbf{T}_o$ is the object pose and $\mathbf{T}_c$ the camera pose. Objects are incrementally refined via depth fusion as more views arrive.
- **The pose graph is the map**: reconstructed objects are stored in an optimisable 6-DoF pose graph, which is the system's *only persistent map representation* — tens of object TSDFs instead of millions of surfels or a global volume.
- **Objects used for tracking, relocalization, and loop closure**: camera-to-object observations form graph edges; re-detecting a previously mapped object triggers loop closure. Loop closures adjust the *relative pose estimates* of object instances but perform no intra-object warping, so each object's reconstruction stays crisp.
- **Semantic and existence probabilities**: each object carries semantic information refined over time, plus an existence probability that accounts for spurious instance predictions — false detections fade away instead of polluting the map.
- **Data association**: instances are matched across frames using semantic class, projected geometric overlap (IoU), and appearance, enabling persistent object identities across revisits.

## Results & impact

The paper demonstrates the system on a hand-held RGB-D sequence from a cluttered office scene with many object instances, showing loop closures and effective reuse of existing objects on repeated loops. Trajectory error was evaluated quantitatively against a baseline on the RGB-D SLAM benchmark, and reconstruction quality of discovered objects was compared qualitatively on the YCB video dataset. The system is highly memory efficient and runs online at 4-8 Hz (excluding relocalization) despite not being optimized at the software level. Published at 3DV 2018, it directly influenced MoreFusion, NodeSLAM, and DSP-SLAM.

## Why it matters for SLAM

Fusion++ removed SLAM++'s biggest limitation — the pre-built CAD database — by showing that off-the-shelf instance segmentation CNNs can serve as the discovery mechanism for object-level SLAM in arbitrary indoor scenes. It sits at the junction of the dense-fusion lineage (KinectFusion-style TSDFs) and the semantic lineage (SemanticFusion), and it directly influenced MoreFusion, NodeSLAM, and DSP-SLAM, which progressively replace raw per-object TSDFs with learned pose and shape priors.

## Related

- [SLAM++](slampp.md)
- [SemanticFusion](semanticfusion.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
