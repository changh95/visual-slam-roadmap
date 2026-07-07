# Patch NetVLAD

> Hausler 2021 · [Paper](https://arxiv.org/abs/2103.01486)

**One-line summary** — Extracts multi-scale patch-level VLAD descriptors from NetVLAD residuals and re-ranks retrieval candidates with spatial verification, making visual place recognition far more robust to viewpoint change and perceptual aliasing.

## Problem

Visual place recognition must survive the twin problems of *appearance change* (season, structure, illumination) and *viewpoint change* in an always-changing world. Global descriptors such as NetVLAD compress the whole image into a single vector, discarding spatial layout — which makes them fast to search but vulnerable to viewpoint shifts, partial occlusion, and perceptual aliasing (different places with similar global statistics).

Full local-feature matching (e.g., SuperPoint + SuperGlue) preserves layout and is accurate, but is far too slow to run against a large database. Patch-NetVLAD asks how to combine the advantages of both local and global descriptor methods in one configurable pipeline.

## Key ideas

- **Patch-level VLAD from NetVLAD residuals**: Instead of aggregating the entire feature map into one global VLAD vector, VLAD descriptors are computed over spatial patches of the feature map. Each patch descriptor is "locally-global" — globally aggregated statistics, but tied to a spatial location, so scene layout survives.
- **Feature-space grid, not keypoints**: Unlike the fixed spatial neighborhoods of classical keypoint features, the patches are defined over the CNN feature-space grid, enabling aggregation and matching of deep-learned local features without a detection step.
- **Multi-scale fusion via an integral feature space**: Patch descriptors are computed at multiple complementary patch sizes and fused; an integral-image trick over the feature space makes extracting many patch sizes cheap. Fine patches capture landmark detail, coarse patches capture scene layout, and the fusion is highly invariant to both condition (season, structure, illumination) and viewpoint (translation, rotation) change.
- **Two-stage retrieval**: A fast global NetVLAD search first retrieves top candidates; these are then re-ranked by mutual nearest-neighbor patch matching with spatial consistency scoring — spatial verification at a fraction of the cost of full local matching.
- **Retrieval-friendly cost**: Spatial verification runs only on the shortlist, never against the whole database, so the robustness of local matching is bought at close to global-retrieval prices.
- **Configurable speed/accuracy**: The same framework spans a performance-optimized configuration and a speed-optimized version that runs over an order of magnitude faster than the previous state of the art, so the operating point can be matched to the robot's compute budget.

## Results & impact

- Outperformed both global- and local-descriptor-based methods with comparable compute, achieving state-of-the-art place recognition on a range of challenging real-world datasets.
- Won the Facebook Mapillary Visual Place Recognition Challenge at ECCV 2020.
- On classic VPR benchmarks (Pittsburgh30k, Tokyo 24/7, Nordland with extreme seasonal change), it improves Recall@1 by roughly 5–15% over NetVLAD, with the largest gains under viewpoint shift and partial occlusion.
- The "global retrieval + patch-level spatial re-ranking" recipe influenced subsequent hierarchical retrieval methods that combine global and local descriptors.

## Why it matters for SLAM

Loop closure and relocalization in SLAM are exactly a place-recognition problem: a wrong match corrupts the pose graph, so robustness to perceptual aliasing matters more than raw retrieval speed. Patch NetVLAD's global-retrieval-then-spatial-re-ranking recipe is a practical drop-in for SLAM loop-closure front-ends, and it influenced the hierarchical retrieval designs used in long-term localization systems.

## Related

- [NetVLAD](netvlad.md) — the global descriptor this method builds on
- [HF-Net](hf-net.md) — hierarchical (coarse-to-fine) localization pipeline
- [hloc](hloc.md) — the retrieval-then-match localization toolbox this recipe plugs into
- [SuperGlue](superglue.md) — full local feature matching used when accuracy trumps speed
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the task this paper targets

[Back to Level 5](../README.md#level-5-applying-deep-learning)
