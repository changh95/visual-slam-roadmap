# SuperGlue

> Sarlin 2020 · [Paper](https://arxiv.org/abs/1911.11763)

**One-line summary** — Graph Neural Network feature matcher that uses self- and cross-attention plus differentiable Sinkhorn optimal transport (with a dustbin for unmatched points) to replace brittle nearest-neighbor matching.

## Problem

Classical feature matching is a pipeline of hand-designed heuristics: nearest-neighbor search in descriptor space, ratio test, mutual check, then RANSAC to clean up. Each descriptor is compared independently — no reasoning about the other keypoints, the scene's geometry, or which points are simply *not visible* in the other image. Under strong viewpoint change, repetitive structure, or partial overlap, this collapses.

SuperGlue reframes matching itself as a learning problem: jointly find correspondences *and* reject non-matchable points, using context from all keypoints in both images.

## Key ideas

- **Matching as joint inference, not independent lookup**: SuperGlue reasons about *all* keypoints in both images simultaneously, learning priors over geometric transformations and regularities of the 3D world through end-to-end training on real image pairs.
- **Keypoint encoder**: Each keypoint's 2D position and detection score are embedded by a small MLP and added to its visual descriptor, so the network reasons jointly about appearance *and* spatial layout from the first layer.
- **Attentional GNN**: The embeddings are refined by alternating self-attention (context within an image — "which other points constrain me?") and cross-attention (candidate correspondences across images — "which points could I be?") layers, a flexible context-aggregation mechanism that lets the network reason about the underlying 3D scene.
- **Optimal transport assignment**: The refined descriptors produce a score matrix $\mathbf{S} \in \mathbb{R}^{(M+1)\times(N+1)}$; differentiable Sinkhorn iterations solve the resulting optimal transport problem, enforcing soft one-to-one (partial) assignment structure rather than greedy per-point decisions.
- **Dustbin mechanism**: The extra row/column absorbs keypoints with no valid match — occlusions and partial overlap are handled *inside* the model rather than by post-hoc score thresholds.
- **End-to-end supervision**: Trained with negative log-likelihood on ground-truth matches (and dustbin assignments) derived from pose + depth, so the network directly optimizes correspondence quality.
- **Real-time on GPU**: Matching runs in real time on a modern GPU, making it drop-in for online SfM and SLAM front-ends.

## Results & impact

- Outperformed other learned approaches and achieved state-of-the-art pose estimation in challenging real-world indoor and outdoor environments (ScanNet and MegaDepth evaluations), with large margins over NN + ratio-test matching.
- SuperPoint + SuperGlue became the dominant recipe for visual localization — the core of the hloc pipeline and long-term localization benchmarks.
- CVPR 2020 (oral); its attention-over-keypoints design directly inspired LightGlue (efficiency) and the detector-free LoFTR lineage.
- Made relocalization and loop closure workable across day/night and severe viewpoint change where descriptor-distance matching fails.

## Why it matters for SLAM

SuperGlue changed the front-end recipe for hard association problems: SuperPoint + SuperGlue became the dominant baseline for visual localization, wide-baseline loop closure, and mapping via the hloc pipeline. For SLAM specifically, it made relocalization work across day/night and strong viewpoint changes where descriptor-distance matching collapses. Its cost — full attention over all keypoints every frame — motivated LightGlue, the efficient successor now standard in real-time settings.

## Related

- [SuperPoint](superpoint.md) — the detector/descriptor it usually matches
- [LightGlue](lightglue.md) — faster adaptive successor
- [LoFTR](loftr.md) — detector-free dense alternative
- [HF-Net](hf-net.md) — the hierarchical localization pipeline built around it
- [hloc](hloc.md) — the localization toolbox where it is the standard matcher

[Back to Level 5](../README.md#level-5-applying-deep-learning)
