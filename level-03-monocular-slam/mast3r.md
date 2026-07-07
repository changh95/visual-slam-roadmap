# MASt3R

> Leroy 2024 · [Paper](https://arxiv.org/abs/2406.09756)

**One-line summary** — Grounds image matching in 3D by adding a dense local-feature head to DUSt3R, combining foundation-model robustness to extreme viewpoint change with the pixel-accurate correspondences of classical matchers.

## Problem

Image matching is a core component of all best-performing 3D vision pipelines, yet "despite matching being fundamentally a 3D problem, intrinsically linked to camera pose and scene geometry, it is typically treated as a 2D problem". Classical and learned 2D matchers collapse under extreme viewpoint change — LoFTR scores only 34% VCRE precision on Map-free; DUSt3R's pointmap regression is remarkably robust to exactly those conditions and tops the Map-free leaderboard, yet its matches are imprecise since regression is inherently noisy and DUSt3R was never trained for matching. MASt3R ("Matching And Stereo 3D Reconstruction") keeps the robustness and fixes the accuracy.

## Method & architecture

**Base (DUSt3R framework)**: Siamese ViT encoder $H^1 = \text{Encoder}(I^1)$, $H^2 = \text{Encoder}(I^2)$, two intertwined decoders exchanging information via cross-attention, $H'^1, H'^2 = \text{Decoder}(H^1, H^2)$, and 3D heads that regress pointmaps + confidences from concatenated encoder/decoder features: $X^{1,1}, C^1 = \text{Head}^1_{3D}([H^1, H'^1])$, both pointmaps expressed in camera 1's frame.

**Metric predictions**: DUSt3R's regression loss $\ell_{\text{regr}}(v,i) = \| X_i^{v,1}/z - \hat{X}_i^{v,1}/\hat{z} \|$ normalizes both prediction and ground truth by scale factors; MASt3R sets $z := \hat{z}$ whenever the ground truth is metric, so the network learns *metric-scale* geometry — a prerequisite for map-free localization. The confidence-weighted loss $\mathcal{L}_{\text{conf}} = \sum_{v} \sum_{i} C_i^v \ell_{\text{regr}}(v,i) - \alpha \log C_i^v$ is kept.

**Matching head**: a new head (2-layer MLP with GELU, outputs normalized to unit norm) attached to each decoder regresses dense $d$-dim feature maps $D^1, D^2 \in \mathbb{R}^{H \times W \times d}$. It is trained with an InfoNCE loss over ground-truth correspondences $\hat{\mathcal{M}} = \{(i,j) \mid \hat{X}_i^{1,1} = \hat{X}_j^{2,1}\}$:

$$\mathcal{L}_{\text{match}} = -\sum_{(i,j) \in \hat{\mathcal{M}}} \log \frac{s_\tau(i,j)}{\sum_{k \in \mathcal{P}^1} s_\tau(k,j)} + \log \frac{s_\tau(i,j)}{\sum_{k \in \mathcal{P}^2} s_\tau(i,k)}, \qquad s_\tau(i,j) = \exp\left[-\tau D_i^{1\top} D_j^2\right].$$

This is essentially cross-entropy classification: contrary to regression, the network is only rewarded for getting the *exact* pixel right, which forces high-precision descriptors. Total objective: $\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{conf}} + \beta \mathcal{L}_{\text{match}}$.

**Fast reciprocal matching (FRM)**: extracting mutual nearest neighbours $\mathcal{M} = \{(i,j) \mid j = \text{NN}_2(D_i^1) \text{ and } i = \text{NN}_1(D_j^2)\}$ naively costs $O(W^2H^2)$ — slower than the network inference itself. FRM instead starts from $k$ pixels on a regular grid and iterates NN round-trips $U^t \to V^t \to U^{t+1}$, collecting pixels that return to their start (cycles = reciprocal matches) and filtering converged ones. Complexity drops to $O(kWH)$, almost two orders of magnitude faster, with convergence guarantees — and its implicit outlier filtering *improves* pose accuracy over exhaustive matching.

**Coarse-to-fine matching**: attention is quadratic in image area, so MASt3R handles at most 512 px on the largest side. High-resolution images are matched coarsely first; the coarse correspondences then guide matching of enumerated local crops, and fine matches are mapped back to full resolution.

## Results

- **Map-free relocalization (test set)**: 93.3% VCRE AUC using its own metric depth — a 30-point absolute improvement over the second-best published method, LoFTR+KBR at 63.4% (DUSt3R: 69.7%) — and median translation error reduced to 0.36 m versus roughly 2 m for prior state of the art.
- **Relative pose** (CO3Dv2 / RealEstate10K, 10 frames per sequence, no GT focals): RRA@15 94.6, RTA@15 91.9, mAA(30) 81.8 on CO3Dv2 and mAA(30) 76.4 on RealEstate10K — versus DUSt3R's 77.2 and 61.2, with RealEstate10K entirely unseen in training.
- **Zero-shot MVS on DTU**: overall Chamfer 0.374 mm (accuracy 0.403, completeness 0.344) by simply triangulating matches — versus DUSt3R's 1.741, and close to domain-trained methods like GeoMVSNet (0.295) without ever training on DTU or using calibration for matching.
- **Visual localization**: significantly outperforms the state of the art on InLoc and is competitive on Aachen Day-Night; it still localizes well from a single retrieved image (top1), showcasing the robustness of 3D-grounded matching.
- Ablation: training with the matching loss alone degrades pose accuracy (median rotation 10.8° vs 3.0° with both losses) — grounding matching in 3D reconstruction is what makes it work.

## Why it matters for SLAM

MASt3R turned the DUSt3R family from a reconstruction curiosity into a practical front-end: correspondences plus metric pointmaps from a single forward pass, usable for relocalisation, SfM, and SLAM. For the SLAM pipeline it collapses several classical stages — feature detection, description, matching, and two-view geometry — into one learned component whose failure modes are those of a foundation model rather than corner scarcity or viewpoint change. It is the direct foundation of MASt3R-SLAM, MASt3R-SfM, and MASt3R-Fusion.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [SuperGlue](../level-05-deep-learning/superglue.md)
- [LoFTR](../level-05-deep-learning/loftr.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
