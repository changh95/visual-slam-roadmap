# LEGS

> Yu 2024 · [Paper](https://arxiv.org/abs/2409.18108)

**One-line summary** — Language-Embedded Gaussian Splats: incrementally builds a room-scale 3DGS map with CLIP semantics *online* while a mobile robot drives around, enabling real-time open-vocabulary object queries.

## Problem

Semantic 3D maps are valuable for "searching for objects of interest in offices, warehouses, stores, and homes" (abstract), but LERF — the method that established language-embedded 3D representations — requires offline per-scene NeRF optimisation after capture is finished. A robot needs the opposite workflow: the semantic map should be built *while* it traverses the environment, from constrained trajectories (a camera near-parallel to walls, no orbiting an object), and be queryable immediately. LEGS adapts language embedding to 3D Gaussian Splatting, whose fast training makes online construction feasible.

## Key ideas

- **Language features on Gaussians**: each 3D Gaussian carries a semantic feature vector alongside its appearance parameters, so one "detailed 3D scene representation... encodes both appearance and semantics in a unified representation" (abstract). Multi-scale CLIP features from the input images are distilled into the per-Gaussian features through a splatting-based rendering loss.
- **Incremental online training**: LEGS "is trained online as a robot traverses its environment" — appearance and semantic parameters are updated, and new Gaussians spawned, continuously during the traversal, rather than in an offline optimisation pass after capture.
- **Open-vocabulary 3D queries**: a text prompt is encoded with CLIP's text encoder and compared against the rendered semantic features to produce a 3D relevancy heatmap, localising open-vocabulary and long-tail queries (specific household objects, not a fixed label set).
- **Robot-oriented system design**: results "suggest that a multi-camera setup and incremental bundle adjustment can boost visual reconstruction quality in constrained robot trajectories" (abstract) — a mobile base cannot orbit objects the way a handheld capture does, so the system compensates with wider coverage and continual pose refinement.
- **3DGS as the enabler**: the whole design rests on Gaussian splatting training being fast enough to keep up with a moving robot — the same property that made 3DGS attractive for SLAM in general.

## Results & impact

- Evaluated on 4 room-scale scenes with object queries: LEGS and LERF have "comparable object query success rates", while "LEGS trains over 3.5x faster than LERF" (abstract).
- Localises "open-vocabulary and long-tail object queries with up to 66% accuracy" (abstract).
- One of the earliest demonstrations that language-embedded scene representations can be built incrementally on a real mobile robot, moving the LERF idea from a capture-then-optimise tool to an online mapping capability.

## Why it matters for SLAM

LEGS is a concrete step from "SLAM as geometry" toward Spatial AI: a robot that maps a store or warehouse and can immediately be asked "where are the scissors?". It shows that language-embedded scene representations, pioneered offline by LERF, can be built incrementally under real robot constraints — the same shift from batch to online that SLAM itself once made relative to SfM.

## Related

- [LERF](lerf.md)
- [ConceptFusion](conceptfusion.md)
- [SplaTAM](splatam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [OpenScene](openscene.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
