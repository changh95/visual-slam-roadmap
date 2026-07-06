# VGGT

> Wang (Meta) 2025 · [Paper](https://arxiv.org/abs/2503.11651)

**One-line summary** — A single feed-forward Transformer that directly infers camera parameters, depth maps, dense pointmaps, and 3D point tracks from one to hundreds of views in under a second — CVPR 2025 Best Paper, and a template for replacing geometric pipelines with one network.

## Key ideas

- **Unified feed-forward inference**: one ViT-based model processes N input images and outputs, in a single forward pass, camera intrinsics/extrinsics for all views, per-pixel depth, dense pointmaps, and 3D point tracks — tasks that previously each needed a specialized model or a multi-stage pipeline.
- **Alternating self- and cross-attention**: attention within each view and across views lets the network reason about multi-view geometry directly in feature space, without explicit feature matching or triangulation.
- **Optimization-free speed**: reconstruction takes under one second per scene, yet outperforms alternatives that require minutes of visual-geometry optimization as post-processing.
- **Multi-task training**: trained on large-scale datasets with losses spanning all output modalities, achieving state-of-the-art results in camera estimation, multi-view depth, dense reconstruction, and point tracking simultaneously.
- **Foundation backbone**: pretrained VGGT features transfer well to downstream tasks such as non-rigid point tracking and feed-forward novel view synthesis.

## Why it matters for SLAM

VGGT validated the feed-forward foundation-model paradigm for 3D vision: a well-trained Transformer can stand in for an entire SfM/SLAM front-end (detection, matching, pose estimation, triangulation, dense depth). It extends the DUSt3R/MASt3R pointmap lineage from image pairs to arbitrary numbers of views, and immediately spawned SLAM systems built around it — VGGT-SLAM, VGGT-Geo, and others — where the network provides instant geometry and a lightweight backend supplies consistency. If you are exploring where SLAM is heading after hand-crafted geometry, this is the paper to read.

## Related

- [DUSt3R](dust3r.md) — pairwise pointmap regression that started this paradigm
- [MASt3R](mast3r.md) — matching-aware successor to DUSt3R
- [VGGT-SLAM](vggt-slam.md) — SLAM system using VGGT as its front-end
- [VGGT-Geo](vggt-geo.md) — probabilistic fusion of VGGT priors for dense indoor SLAM
- [VoT](vot.md) — Transformer-based visual odometry in the same trend

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
