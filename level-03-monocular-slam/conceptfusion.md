# ConceptFusion

> Jatavallabhula (MIT) 2023 · [Paper](https://arxiv.org/abs/2302.07241)

**One-line summary** — Fused pixel-aligned features from foundation models (CLIP, AudioCLIP) into 3D maps built by SLAM, enabling zero-shot open-vocabulary and multimodal queries over the map without any task-specific training.

## Problem

Building 3D maps is central to robot navigation, planning, and interaction, but most approaches that attach semantics to maps are confined to the closed-set setting: they can only reason about a finite set of concepts fixed at training time, and the map can only be queried with class labels (or, at best, text prompts). Foundation models trained on internet-scale data understand open-vocabulary concepts across modalities — but they operate on 2D images. ConceptFusion asks how to lift those open-set, multimodal capabilities into a 3D map.

## Key ideas

- **Open-set instead of closed-set semantics**: the map representation is "(1) fundamentally open-set, enabling reasoning beyond a closed set of concepts and (2) inherently multimodal", supporting queries "from language, to images, to audio, to 3D geometry, all working in concert."
- **SLAM provides the geometry**: a standard dense SLAM/reconstruction pipeline supplies camera poses and a 3D point cloud; the paper's contribution is what gets attached to that geometry — "pixel-aligned open-set features can be fused into 3D maps via traditional SLAM and multi-view fusion approaches."
- **Pixel-aligned feature extraction**: per-image features are computed from foundation models (CLIP for vision-language, AudioCLIP for audio), combining a global image embedding with region-level embeddings from class-agnostic segmentation so that every pixel carries an open-set feature vector.
- **Multi-view feature fusion**: each 3D point aggregates the pixel-aligned features from all views that observe it, producing multi-view-consistent per-point embeddings — the same fusion logic used for colour or TSDF values, applied to semantic features.
- **Zero-shot querying**: a text, image, or audio query is encoded by the matching foundation-model encoder and compared to point features via cosine similarity, producing a 3D relevancy heatmap over the map — "not needing any additional training or finetuning."

## Results & impact

From the abstract: ConceptFusion "retains long-tailed concepts better than supervised approaches, outperforming them by more than 40% margin on 3D IoU," and was evaluated on real-world datasets, simulated home environments, a real-world tabletop manipulation task, and an autonomous driving platform. Its practical significance is the demonstration that no 3D training is needed at all — 2D foundation-model features plus classical multi-view fusion suffice — which made open-vocabulary mapping immediately accessible and spawned a large family of follow-ups (LERF in radiance fields, OpenScene for point clouds, ConceptGraphs for scene graphs).

## Why it matters for SLAM

ConceptFusion pioneered open-set multimodal 3D mapping and established the now-widespread paradigm of fusing 2D foundation-model features into 3D maps by multi-view aggregation. It is a key bridge between classical SLAM and Spatial AI: robots can localise *and* answer "where is something I can use to open this bottle?" from the same map. Follow-ups such as LERF, OpenScene, and ConceptGraphs build directly on this idea.

## Related

- [LERF](lerf.md)
- [OpenScene](openscene.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
