# DUSt3R

> Wang 2024 · [Paper](https://arxiv.org/abs/2312.14132)

**One-line summary** — Recast pairwise 3D reconstruction as direct regression of dense pointmaps from an image pair by a feed-forward Transformer, requiring no camera calibration, feature matching, or explicit geometric models.

## Key ideas

- **Pointmap representation**: for a pair $(I_1, I_2)$ the network outputs $\mathbf{X}_1^1, \mathbf{X}_2^1 \in \mathbb{R}^{H \times W \times 3}$ — per-pixel 3D coordinates expressed in the first camera's frame — bypassing intrinsics and camera models entirely.
- **Cross-attention Transformer**: a ViT encoder per image plus decoder blocks with cross-attention between views; regression heads output pointmaps with per-pixel confidence maps.
- **Confidence-weighted regression loss**: trained on large mixed 3D datasets with $\mathcal{L} = \sum_v \sum_{\mathbf{p}} C_v(\mathbf{p}) \cdot \|\hat{\mathbf{X}}_v^1(\mathbf{p}) - \mathbf{X}_v^{1,gt}(\mathbf{p})\|$, learning robustness to diverse cameras and scenes.
- **Global alignment for many views**: for $N > 2$ images, pairwise pointmaps are optimised into one consistent reference frame; poses, depth maps, intrinsics, and correspondences all fall out of the aligned pointmaps as by-products.

## Why it matters for SLAM

DUSt3R started the "3D foundation model" era of geometric vision: a single pre-trained network replacing the classical detect-match-triangulate pipeline, working even on uncalibrated images and as few as two views. It directly spawned MASt3R and MASt3R-SLAM, influenced feed-forward multi-view models like VGGT, and now anchors an entire branch of SLAM research where a learned pointmap regressor is the frontend and classical optimisation is the backend. Knowing its assumptions (offline pairing, global alignment cost) explains what the follow-up systems fix.

## Related

- [MASt3R](mast3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [VGGT](vggt.md)
- [COLMAP](colmap.md)
- [MonST3R](monst3r.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
