# OpenScene

> Peng (ETH) 2023 · [Paper](https://arxiv.org/abs/2211.15654)

**One-line summary** — Predicts dense per-point CLIP-space features for 3D point clouds by back-projecting 2D vision-language features, enabling zero-shot, task-agnostic open-vocabulary 3D scene understanding without labelled 3D data.

## Key ideas

- **2D-to-3D feature lifting**: dense pixel-aligned features from pre-trained 2D vision-language models (OpenSeg, LSeg, CLIP-based) are back-projected onto the 3D point cloud from every observing view.
- **Multi-view feature fusion**: each 3D point aggregates features from all images that see it, using view-weighted averaging to handle varying observation quality.
- **3D feature distillation**: a 3D sparse convolutional network can be trained to predict per-point features directly from geometry, so novel point clouds can be queried without multi-view images at inference time.
- **Open-vocabulary queries**: text encoded by CLIP's text encoder is compared to point features by cosine similarity, scoring any concept — objects ("chair"), materials ("wood"), affordances ("sit-able"), or room types ("kitchen").
- **No 3D supervision**: the whole pipeline requires no labelled 3D training data, sidestepping the annotation cost that limits closed-set 3D segmentation.

## Why it matters for SLAM

OpenScene demonstrated that internet-scale 2D vision-language knowledge can be transferred to 3D maps, a core building block of language-grounded spatial AI. For SLAM, this points to maps that can be queried with free-form language rather than fixed label sets — a capability picked up by ConceptFusion, ConceptGraphs, and LERF, and increasingly expected of robot mapping stacks.

## Related

- [ConceptFusion](conceptfusion.md)
- [LERF](lerf.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
