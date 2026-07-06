# MASt3R

> Leroy 2024 · [Paper](https://arxiv.org/abs/2406.09756)

**One-line summary** — Grounds image matching in 3D by adding a dense local-feature head to DUSt3R, combining foundation-model robustness to extreme viewpoint change with the pixel-accurate correspondences of classical matchers.

## Key ideas

- **Matching as a 3D problem**: image matching is usually treated as a 2D task, yet it is intrinsically tied to camera pose and scene geometry. MASt3R builds on DUSt3R's pointmap regression, whose 3D-aware representation is remarkably robust to extreme viewpoint changes but not precise enough for accurate matching.
- **Dense local feature head**: a new head on the DUSt3R decoder outputs per-pixel descriptors, trained with a contrastive (InfoNCE-style) matching loss using correspondences derived from ground-truth pointmaps — so descriptors inherit 3D grounding.
- **Fast reciprocal matching**: naive dense matching is quadratic in the number of pixels; MASt3R's iterative reciprocal nearest-neighbour scheme accelerates it by orders of magnitude, with theoretical guarantees, and even improves match quality.
- **Best of both worlds**: robustness of pointmap regression where SuperGlue/LoFTR-style matchers fail (extreme baselines, few overlapping views), plus accuracy those matchers offer where they work; it set the state of the art on map-free relocalisation by a large margin.

## Why it matters for SLAM

MASt3R turned the DUSt3R family from a reconstruction curiosity into a practical front-end: correspondences plus metric-ish pointmaps from a single forward pass, usable for relocalisation, SfM, and SLAM. It is the direct foundation of MASt3R-SLAM (real-time dense SLAM) and MASt3R-Fusion (IMU/GNSS integration), and its "3D-grounded matching" idea reframed how the community thinks about the classic feature-matching stage of the pipeline.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [SuperGlue](../level-05-deep-learning/superglue.md)
- [LoFTR](../level-05-deep-learning/loftr.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
