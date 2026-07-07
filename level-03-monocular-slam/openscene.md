# OpenScene

> Peng (ETH) 2023 · [Paper](https://arxiv.org/abs/2211.15654)

**One-line summary** — Predicts dense per-point CLIP-space features for 3D point clouds by back-projecting 2D vision-language features, enabling zero-shot, task-agnostic open-vocabulary 3D scene understanding without labelled 3D data.

## Problem

Traditional 3D scene understanding "rel[ies] on labeled 3D datasets to train a model for a single task with supervision" (abstract): every task needs its own expensive 3D annotations, and every model is locked to a predefined category list. Meanwhile, 2D vision-language models trained on internet-scale data already embed images and text in a shared space. OpenScene asks: can 3D points be embedded in that same CLIP feature space, so that a single unsupervised representation serves *any* query and *any* task?

## Key ideas

- **Co-embedding 3D points with text and pixels**: the model "predicts dense features for 3D scene points that are co-embedded with text and image pixels in CLIP feature space" (abstract) — the 3D map speaks the same language as CLIP text embeddings.
- **2D-to-3D feature lifting**: dense pixel-aligned features from pre-trained 2D vision-language segmentation models (OpenSeg, LSeg) are back-projected onto the 3D point cloud from every observing view.
- **Multi-view feature fusion**: each 3D point aggregates features from all images that see it via view-weighted averaging, turning many noisy 2D observations into one robust per-point feature.
- **3D feature distillation**: a 3D sparse convolutional network is trained to predict the fused features directly from geometry, so novel point clouds can be queried without any images at inference time — and geometry-based and image-based predictions can be ensembled.
- **Open-vocabulary queries by cosine similarity**: any text — objects ("chair"), materials ("wood"), affordances ("sit-able"), activities, room types ("kitchen") — is encoded by CLIP's text encoder and scored against point features, producing relevancy heat maps over the scene.
- **Zero-shot, task-agnostic training**: everything is trained "without any labeled 3D data" (abstract); classification into arbitrary label sets happens only at query time.

## Results & impact

The abstract reports state-of-the-art zero-shot 3D semantic segmentation — the first time open-vocabulary querying of complex 3D scenes for objects, materials, affordances, activities, and room types was demonstrated "all using a single model trained without any labeled 3D data", with evaluation on standard indoor benchmarks including ScanNet and Matterport3D. OpenScene became one of the founding works of open-vocabulary 3D scene understanding, directly shaping ConceptFusion, LERF, ConceptGraphs, and the language-queryable maps now expected of robot mapping stacks.

## Why it matters for SLAM

OpenScene demonstrated that internet-scale 2D vision-language knowledge can be transferred to 3D maps, a core building block of language-grounded spatial AI. For SLAM, this points to maps that can be queried with free-form language rather than fixed label sets — a capability picked up by ConceptFusion, ConceptGraphs, and LERF, and increasingly expected of robot mapping stacks.

## Related

- [ConceptFusion](conceptfusion.md)
- [LERF](lerf.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SpatialLM](spatiallm.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
