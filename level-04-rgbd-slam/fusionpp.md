# Fusion++

> McCormac & Clark 2018 · [Paper](https://arxiv.org/abs/1808.08378)

**One-line summary** — An object-level volumetric SLAM system that uses Mask-RCNN instance segmentation to create per-object TSDF reconstructions of arbitrary objects — no prior models required — with objects as nodes in a 6-DoF pose graph.

## Key ideas

- **Deep-learning instance segmentation as the front-end**: Mask-RCNN detects and segments object instances in incoming RGB frames, providing class labels and pixel masks.
- **No prior models**: unlike SLAM++, objects are discovered and reconstructed on the fly — each detection spawns its own small TSDF volume sized to the object, into which masked depth pixels are fused.
- **Object-level TSDF reconstruction**: per-object volumes keep resolution proportional to object size, yielding compact maps (tens of object TSDFs instead of millions of surfels).
- **Object-level pose graph**: objects and camera keyframes form a factor graph; camera-to-object observations are edges, and re-detecting a previously mapped object triggers loop closure.
- **Data association**: instances are matched across frames using semantic class, projected geometric overlap (IoU), and appearance, enabling persistent object identities.

## Why it matters for SLAM

Fusion++ removed SLAM++'s biggest limitation — the pre-built CAD database — by showing that off-the-shelf instance segmentation CNNs can serve as the discovery mechanism for object-level SLAM in arbitrary indoor scenes. It sits at the junction of the dense-fusion lineage (KinectFusion-style TSDFs) and the semantic lineage (SemanticFusion), and it directly influenced MoreFusion, NodeSLAM, and DSP-SLAM, which progressively replace raw per-object TSDFs with learned pose and shape priors.

## Related

- [SLAM++](slampp.md)
- [SemanticFusion](semanticfusion.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
