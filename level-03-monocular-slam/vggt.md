# VGGT

> Wang (Meta) 2025 · [Paper](https://arxiv.org/abs/2503.11651)

**One-line summary** — A single feed-forward Transformer that directly infers camera parameters, depth maps, dense pointmaps, and 3D point tracks from one to hundreds of views in under a second — CVPR 2025 Best Paper, and a template for replacing geometric pipelines with one network.

## Problem

3D vision models have typically been constrained to and specialized for single tasks: one network for depth, another for pose, another for point tracking — and full multi-view reconstruction required multi-stage pipelines with visual-geometry optimization (bundle adjustment, triangulation) as post-processing. VGGT asks whether *one* network can directly infer all key 3D attributes of a scene from an arbitrary number of views, fast enough and accurately enough to make the optimization stage optional.

## Key ideas

- **Unified feed-forward inference**: a single ViT-based model processes $N$ input images — from a single view up to hundreds — and outputs, in one forward pass, camera intrinsics/extrinsics for all views, per-pixel depth maps, dense pointmaps, and 3D point tracks.
- **Alternating self- and cross-attention**: attention within each view (self) and across views (cross) lets the network reason about multi-view geometry directly in feature space, replacing explicit feature matching, epipolar search, and triangulation.
- **Optimization-free speed**: reconstruction takes under one second per scene, yet still outperforms alternatives that require post-processing with visual geometry optimization techniques — the network is both faster *and* more accurate.
- **Multi-task training**: trained on large-scale datasets with losses spanning all output modalities simultaneously; the shared representation across tasks appears to help rather than hurt each individual task.
- **Foundation backbone**: pretrained VGGT features significantly enhance downstream tasks such as non-rigid point tracking and feed-forward novel view synthesis, indicating the model has learned reusable 3D representations rather than a narrow input–output mapping.
- **Simplicity as a feature**: no per-scene optimization, no RANSAC loops, no incremental registration — the entire "SfM pipeline" collapses into a single deterministic forward pass, which makes behavior easy to reason about and deploy.

## Results & impact

VGGT achieves state-of-the-art results across multiple 3D tasks — camera parameter estimation, multi-view depth estimation, dense point cloud reconstruction, and 3D point tracking — while reconstructing scenes in under one second, outperforming methods that need minutes of optimization. It won the CVPR 2025 Best Paper award, and code and models are publicly available. Within months it became the front-end of a family of SLAM systems (VGGT-SLAM, VGGT-SLAM 2.0, VGGT-Geo) and a general-purpose backbone for 3D perception.

## Why it matters for SLAM

VGGT validated the feed-forward foundation-model paradigm for 3D vision: a well-trained Transformer can stand in for an entire SfM/SLAM front-end (detection, matching, pose estimation, triangulation, dense depth). It extends the DUSt3R/MASt3R pointmap lineage from image pairs to arbitrary numbers of views, and immediately spawned SLAM systems built around it — VGGT-SLAM, VGGT-Geo, and others — where the network provides instant geometry and a lightweight backend supplies consistency. If you are exploring where SLAM is heading after hand-crafted geometry, this is the paper to read.

## Related

- [DUSt3R](dust3r.md) — pairwise pointmap regression that started this paradigm
- [MASt3R](mast3r.md) — matching-aware successor to DUSt3R
- [VGGT-SLAM](vggt-slam.md) — SLAM system using VGGT as its front-end
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — real-time successor with a redesigned backend
- [VGGT-Geo](vggt-geo.md) — probabilistic fusion of VGGT priors for dense indoor SLAM
- [VoT](vot.md) — Transformer-based visual odometry in the same trend

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
