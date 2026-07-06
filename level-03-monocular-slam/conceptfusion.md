# ConceptFusion

> Jatavallabhula (MIT) 2023 · [Paper](https://arxiv.org/abs/2302.07241)

**One-line summary** — Fused pixel-aligned features from foundation models (CLIP, AudioCLIP) into 3D maps built by SLAM, enabling zero-shot open-vocabulary and multimodal queries over the map without any task-specific training.

## Key ideas

- **Open-set instead of closed-set semantics**: traditional semantic SLAM recognises only predefined categories; ConceptFusion lifts internet-scale foundation-model features into 3D so the map can answer arbitrary language (or image/audio) queries.
- **SLAM provides the geometry**: a standard dense SLAM/reconstruction pipeline supplies camera poses and a 3D point cloud; the contribution is what gets attached to that geometry.
- **Pixel-aligned feature extraction**: per-image features are computed from foundation models (CLIP for vision-language, AudioCLIP for audio, with segmentation used to build region-level features), giving each pixel an open-set embedding.
- **Multi-view feature fusion**: each 3D point aggregates features from all views that observe it, producing multi-view-consistent per-point embeddings.
- **Zero-shot querying**: a text, image, or audio query is encoded by the matching encoder and compared to point features via cosine similarity, producing a 3D relevancy heatmap over the map.

## Why it matters for SLAM

ConceptFusion pioneered open-set multimodal 3D mapping and established the now-widespread paradigm of fusing 2D foundation-model features into 3D maps by multi-view aggregation. It is a key bridge between classical SLAM and Spatial AI: robots can localise *and* answer "where is something I can use to open this bottle?" from the same map. Follow-ups such as LERF, OpenScene, and ConceptGraphs build directly on this idea.

## Related

- [LERF](lerf.md)
- [OpenScene](openscene.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
