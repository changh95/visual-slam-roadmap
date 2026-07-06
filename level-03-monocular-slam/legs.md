# LEGS

> Yu 2024 · [Paper](https://arxiv.org/abs/2409.18108)

**One-line summary** — Language-Embedded Gaussian Splats: incrementally builds a room-scale 3DGS map with CLIP semantics *online* while a mobile robot drives around, enabling real-time open-vocabulary object queries.

## Key ideas

- **Language features on Gaussians**: each 3D Gaussian carries a semantic feature vector alongside its appearance parameters; multi-scale CLIP features from the input images are distilled into these per-Gaussian features through a splatting-based rendering loss.
- **Incremental online training**: unlike LERF, which needs offline per-scene optimisation after capture, LEGS updates appearance and semantic parameters (and spawns new Gaussians) continuously as the robot traverses the environment — 3DGS's fast training is what makes this feasible.
- **Open-vocabulary 3D queries**: a text prompt is encoded with CLIP's text encoder and compared against the rendered semantic features to produce a 3D relevancy heatmap, localising long-tail queries such as specific household objects.
- **Robot-oriented system design**: a multi-camera setup and incremental bundle adjustment improve reconstruction quality along constrained robot trajectories; the paper reports roughly 3.5x faster training than LERF with comparable query success rates and up to 66% accuracy on long-tail object queries.

## Why it matters for SLAM

LEGS is a concrete step from "SLAM as geometry" toward Spatial AI: a robot that maps a store or warehouse and can immediately be asked "where are the scissors?". It shows that language-embedded scene representations, pioneered offline by LERF, can be built incrementally under real robot constraints — the same shift from batch to online that SLAM itself once made relative to SfM.

## Related

- [LERF](lerf.md)
- [ConceptFusion](conceptfusion.md)
- [SplaTAM](splatam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
