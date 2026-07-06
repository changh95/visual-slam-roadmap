# RoMa v2

> Edstedt 2025 · [Paper](https://arxiv.org/abs/2511.15706)

**One-line summary** — Successor to RoMa that pushes dense feature matching to be "harder, better, faster, denser": more robust matches, higher accuracy, and lower runtime cost than the original.

## Key ideas

- **Same core paradigm as RoMa**: Foundation-model features provide semantically robust coarse correspondence, refined coarse-to-fine to dense sub-pixel matches with per-match certainty.
- **Harder**: Improved robustness on difficult wide-baseline and appearance-change pairs — the regime where dense matchers are used instead of sparse keypoints.
- **Better / denser**: Higher-quality and denser correspondence fields, benefiting downstream two-view geometry and reconstruction.
- **Faster**: Efficiency improvements make dense matching more practical to run inside real pipelines rather than only offline evaluation.
- Dense matchers of this family output a warp + certainty per pixel, which downstream RANSAC/pose solvers consume after certainty filtering.

## Why it matters for SLAM

Dense, certainty-aware matching is becoming the front-end of choice for relocalization, loop closure, and offline mapping under extreme appearance change, and the RoMa line is its reference implementation. Speed was the main obstacle to using RoMa-class matchers online in SLAM; RoMa v2's efficiency focus narrows that gap. It is also the natural feature backbone for MASt3R-style two-view reconstruction pipelines that fuse matching with geometry.

## Related

- [RoMa](roma.md) — the predecessor and core architecture
- [LoFTR](loftr.md) — earlier detector-free matching lineage
- [Foundation models](foundation-models.md) — the source of robust coarse features
- [MASt3R](../level-03-monocular-slam/mast3r.md) — dense matching fused with 3D reconstruction

[Back to Level 5](../README.md#level-5-applying-deep-learning)
