# Patch NetVLAD

> Hausler 2021 · [Paper](https://arxiv.org/abs/2103.01486)

**One-line summary** — Extracts multi-scale patch-level VLAD descriptors from NetVLAD residuals and re-ranks retrieval candidates with spatial verification, making visual place recognition far more robust to viewpoint change and perceptual aliasing.

## Key ideas

- **Patch-level VLAD extraction**: Instead of aggregating the whole feature map into one global VLAD vector, VLAD descriptors are computed over spatial patches of the feature map, so each descriptor keeps information about *where* scene content appears.
- **Multi-scale fusion**: Patch descriptors are computed at multiple patch sizes, using integral images for efficiency, capturing both fine landmark detail and coarse scene layout.
- **Two-stage retrieval**: A fast global NetVLAD search first retrieves candidates; the top candidates are then re-ranked by mutual nearest-neighbor patch matching with spatial consistency checks.
- **Bridges global and local**: Sits between global descriptors (fast but layout-blind) and full local feature matching (accurate but slow), getting most of the robustness at retrieval-friendly cost.
- Won the 2021 RSS Visual Place Recognition Challenge and outperformed NetVLAD on benchmarks with strong seasonal, lighting, and viewpoint change.

## Why it matters for SLAM

Loop closure and relocalization in SLAM are exactly a place-recognition problem: a wrong match corrupts the pose graph, so robustness to perceptual aliasing matters more than raw retrieval speed. Patch NetVLAD's global-retrieval-then-spatial-re-ranking recipe is a practical drop-in for SLAM loop-closure front-ends, and it influenced the hierarchical retrieval designs used in long-term localization systems.

## Related

- [NetVLAD](netvlad.md) — the global descriptor this method builds on
- [HF-Net](hf-net.md) — hierarchical (coarse-to-fine) localization pipeline
- [SuperGlue](superglue.md) — full local feature matching used when accuracy trumps speed
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the task this paper targets

[Back to Level 5](../README.md#level-5-applying-deep-learning)
