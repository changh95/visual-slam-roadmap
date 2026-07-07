# OpenGS-SLAM

> Yang 2025 · [Paper](https://arxiv.org/abs/2503.01646)

**One-line summary** — Open-set dense semantic RGB-D SLAM on 3D Gaussians: instead of embedding feature vectors, each Gaussian carries a single explicit label, and Gaussian Voting Splatting plus confidence-based multi-view label consensus turn noisy 2D foundation-model segmentations into a consistent, object-level 3D map.

## Problem

Prior semantic SLAM systems "are generally constrained by limited-category pre-trained classifiers and implicit semantic representation, which hinder their performance in open-set scenarios and restrict 3D object-level scene understanding". Feature-embedded 3DGS methods (SemGauss-SLAM, NEDS-SLAM) store an N-channel embedding per Gaussian, so the label of an individual Gaussian cannot be read off directly — blocking object-level interaction — and rendering/storage costs balloon. Three obstacles stand in the way of explicit labels: (1) a label is non-differentiable, so it cannot ride on the standard 3DGS rasterizer; (2) SAM-style segmenters are inconsistent across views (same object gets different labels, or splits into parts); (3) weakly-constrained Gaussians grow oversized and smear segment boundaries.

## Method & architecture

Built on GS-ICP SLAM (G-ICP handles tracking); input is an RGB-D stream, with no predefined semantic categories:

- **Ensemble semantic information generator**: RAM tags the image with open-set classes, which prompt YOLO-World to produce semantic boxes with detection scores; SAM (or MobileSAMv2) produces a label map with confidences but random label IDs. Masks and boxes are matched by IoU (> 0.5) into an input Label-Class table $\mathcal{M}_{LC}^{I}$; a global table $\mathcal{M}_{LC}^{G}$ grows dynamically from an empty set during SLAM.
- **Semantic Gaussian representation**: each Gaussian holds center $x$, covariance $\Sigma$, opacity $o$, color $f$, and a one-dimensional non-differentiable **GS Label** $\ell$ — replacing N-channel feature embeddings.
- **Gaussian Voting Splatting**: Gaussians project to the image via $\Sigma' = JT^{-1}\Sigma T^{-T}J^{T}$ and are alpha-composited front-to-back for color and depth, $C(p)=\sum_{i\in N} f_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j)$. For labels, each contributing Gaussian votes with its blending weight

$$w_j^i=\alpha_i\prod_{k=1}^{i-1}(1-\alpha_k), \qquad W_j=\sum_{g_i\in G_p^j} w_j^i$$

and the pixel takes the label $\ell_j$ with the highest cumulative weight $W_j$. The top $K=50$ contributors per pixel are recorded in $G_{topK}$, so when a pixel's label flips from $\ell_s$ to $\ell_t$, the responsible Gaussians are found and relabeled explicitly — fast label rendering *and* scene updating without gradients.
- **Confidence-based 2D Label Consensus**: input labels $\mathcal{L}_s$ are matched against labels $\mathcal{L}_r$ rendered from the current map under four cases — Full Match (adopt map label, keep max confidence), Partial Match (parts vote via area-weighted confidence $\bar{\mathcal{C}}_s=\sum_i \mathcal{C}_s^i\,\lvert\ell_s^i\rvert / \sum_i \lvert\ell_s^i\rvert$; whichever side is more confident wins), Whole Match (symmetric case), or New label (thresholds $\tau_1{=}0.85,\tau_2{=}0.9,\tau_3{=}0.1$). Two refinements: **Input Confidence Update** downweights labels of partially visible objects (visible-to-total Gaussian ratio per object), and **Part Label Decay** subtracts $\delta=0.06$ from a label's confidence each time it is seen as a part, so SAM's chronic over-segmentation heals over repeated observations.
- **Segmentation Counter Pruning**: for fully matched label pairs, Gaussians in the symmetric difference of the two masks ("counter Gaussians") whose scale exceeds $\theta$ (0.10 Replica / 0.25 TUM) are pruned, restoring room for new, better-fitting Gaussians at object contours.

## Results

- **Closed-set semantic segmentation** (Replica, GT semantic priors as input): best mIoU on all 8 scenes, e.g. R0 93.24 / Of4 93.77, vs SGS-SLAM 92.95 (R0) and SNI-SLAM 88.42.
- **Zero-shot open-set novel-view segmentation** (Replica average): Ours(SAM1.0) mIoU **61.91** / Acc 73.11 at **165.47 FPS** with 301.71 MB learnable parameters, vs GS-Grouping 59.15 / 69.94 at 16.14 FPS (717.12 MB) and Feature 3DGS 48.89 / 57.51 at 11.03 FPS (894.91 MB) — the claimed ~10x faster semantic rendering and ~2x lower storage.
- **Tracking/mapping** (Replica avg): ATE 0.16 cm — up to 51% relative improvement over other dense semantic SLAM (SemGauss-SLAM 0.33, SGS-SLAM 0.41) — with best-in-table PSNR 39.49 and LPIPS 0.034. On TUM: average ATE 2.15 cm (fr1-desk 2.40, fr2-xyz 1.57, fr3-office 2.48), ahead of SplaTAM (3.25) and GICP-SLAM (2.28).
- **Ablations** (Replica, SAM1.0 baseline 63.17 mIoU / 74.51 Acc): removing Part Label Decay costs 5.96 mIoU / 10.2 Acc; removing Input Confidence Update costs 3.39 / 5.4; removing Counter Pruning costs 0.26 / 1.49 (it mainly sharpens boundaries — and the paper credits it for the tracking gains, since cleaner contours improve G-ICP alignment).
- Stated limitation: not applicable to dynamic scenes.

## Why it matters for SLAM

OpenGS-SLAM sits at the intersection of 3DGS-based dense SLAM and open-vocabulary mapping driven by 2D foundation models. Its discrete-label voting scheme shows that object-level, open-set scene understanding does not require embedding heavy language features into every map primitive — the main cost problem of ConceptFusion/LERF-style maps — and that explicit per-Gaussian labels are exactly what interaction tasks (removing, moving, selecting objects) need. It also demonstrates that semantic bookkeeping can *help* geometry: pruning mislabeled oversized Gaussians measurably improved G-ICP tracking.

## Related

- [GS-ICP SLAM](gs-icp-slam.md)
- [SplaTAM](splatam.md)
- [LERF](lerf.md)
- [ConceptFusion](conceptfusion.md)
- [LEGS](legs.md)
- [SAM](../level-05-deep-learning/sam.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
