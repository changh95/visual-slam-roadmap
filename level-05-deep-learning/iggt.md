# IGGT

> Li 2025 · [Paper](https://arxiv.org/abs/2510.22706)

**One-line summary** — An instance-grounded geometry transformer that unifies feed-forward 3D reconstruction with instance-level scene understanding in a single model, instead of bolting semantics onto a separately reconstructed map.

## Problem

Humans perceive geometric structure and semantic content as intertwined, but most pipelines treat them separately: large geometry models (DUSt3R/VGGT family) are trained for low-level 3D reconstruction, while high-level spatial understanding is handled in isolation — which "limits generalization and leads to poor performance in downstream 3D understanding tasks". Recent fixes align 3D models with one specific vision-language model, but that over-smooths fine geometric detail, caps perception at the aligned model's capacity (e.g. LSeg), and — because VLM features are category-level — fails to distinguish different objects of the same class, breaking instance tracking under large viewpoint change.

## Method & architecture

IGGT maps $N$ images to geometry *and* instance features in one forward pass:

$$\mathcal{F}: \{I_i\}_{i=1}^{N} \mapsto (t_i, D_i, P_i, S_i)_{i=1}^{N},$$

where $t_i$ are camera parameters, $D_i$ depth maps, $P_i$ point maps, and $S_i$ 3D-consistent instance-level feature maps.

- **Large Unified Transformer**: a 1B-parameter VGGT-style backbone — DINOv2 patch tokens plus a learnable camera token per view, followed by 24 blocks alternating intra-view self-attention and global cross-view attention, producing unified tokens $\mathbf{T}_i \in \mathbb{R}^{M \times D}$ per image.
- **Two heads**: a Geometry Head (camera, depth, and point predictors, DPT-style, inherited from VGGT) and an Instance Head, both decoding the same tokens: $\{F^{pt}_i\} = \Phi_{pt}(\{\mathbf{T}_i\})$, $\{F^{ins}_i\} = \Phi_{ins}(\{\mathbf{T}_i\})$.
- **Cross-modal fusion block**: sliding-window cross-attention injects pixel-level geometric features into the instance branch (avoiding quadratic global attention):
  $$\hat{F}_{i,(l)}^{ins} = F_{i,(l)}^{ins} + \mathcal{F}_{\text{win}}\left(Q = F_{i,(l)}^{ins},\; K = F_{i,(l)}^{pt},\; V = F_{i,(l)}^{pt}\right),$$
  sharpening object boundaries and spatial layout awareness. Refined features are projected to 8-dimensional instance embeddings $O_{ins}$.
- **3D-Consistent Contrastive Learning**: over sampled pixels $\mathcal{P}$, features of the same physical instance (instance ID $m(p)$) are pulled together across views and different instances pushed apart by margin $M$:
  $$\mathcal{L}_{mvc} = \lambda_{pull} \sum_{m(p_i) = m(p_j)} d(f_{p_i}, f_{p_j}) + \lambda_{push} \sum_{m(p_i) \neq m(p_j)} \max\left(0,\, M - d(f_{p_i}, f_{p_j})\right),$$
  with $d$ the L2 distance between normalized features. The total loss is $\mathcal{L}_{overall} = \mathcal{L}_{pose} + \mathcal{L}_{depth} + \mathcal{L}_{pmap} + \mathcal{L}_{mvc}$ (geometry terms follow VGGT's training recipe).
- **Instance-Grounded Scene Understanding**: at inference, HDBSCAN clusters the multi-view instance features into $K$ instances, yielding 3D-consistent 2D instance masks. These masks are the *bridge* to any VLM/LMM in plug-and-play fashion: mask-pooled OpenSeg/CLIP features give open-vocabulary segmentation; mask-highlighted views queried through an LMM (e.g. Qwen2.5-VL, GPT-4o) give QA scene grounding. No single language model is baked in.
- **InsScene-15K**: a 15,000-scene dataset (RGB, poses, depth, 3D-consistent instance masks) curated from synthetic (Aria, Infinigen), video (RE10K, via SAM + SAM2 propagation with keyframe re-seeding), and RGB-D (ScanNet++, projected 3D annotations refined by SAM2 proposals). IGGT is initialized from VGGT weights and fine-tuned on it for 2 days on 8 A800s.

## Results

Evaluated on ScanNet and ScanNet++ (10 scenes each, 8-10 images per scene):

- **Instance spatial tracking**: T-mIoU **69.41** / T-SR **98.66** on ScanNet and **73.02** / **98.90** on ScanNet++, versus SAM2* at 53.74/71.25 and 44.16/57.89 and SpaTracker+SAM at 26.43/38.57 and 16.15/23.68 — near-perfect success rate where baselines lose objects under large camera motion.
- **Open-vocabulary segmentation**: on ScanNet++, 2D mIoU 31.31 and mAcc 70.78 — surpassing other approaches by 8.34% mIoU and 7.88% mAcc; 3D mIoU improves by 4.31% (ScanNet, 39.68) and 4.97% (ScanNet++, 20.14) over previous approaches.
- **Reconstruction is not sacrificed**: depth Abs. Rel 1.90 vs VGGT's 1.84 on ScanNet (on par), and *better* than VGGT on ScanNet++ by 0.14 Abs. Rel (2.61 vs 2.75) and 0.25 inlier ratio (85.66 vs 85.41) — evidence that joint semantic training feeds back into geometry.
- QA grounding demos on LERF-OVS (Teatime) show instance-grounded LMM querying beating direct Gemini 2.5 Pro prompting on multi-view consistency.

## Why it matters for SLAM

The trajectory of the DUSt3R/VGGT family is toward foundation models that give SLAM systems dense geometry for free; IGGT extends that trend to *what* is in the scene, not just where surfaces are. For Spatial AI — manipulation, semantic navigation, AR — a map segmented into 3D-consistent object instances is far more actionable than raw geometry, and doing it inside one feed-forward model avoids the inconsistencies of stitching per-frame 2D segmentations (SAM masks, CLIP features) onto 3D maps. The mask-as-bridge design also means the semantic stack upgrades for free as better VLMs appear.

## Related

- [VGGT](vggt.md)
- [DUSt3R](dust3r.md)
- [VGGT-SLAM](vggt-slam.md)
- [ConceptFusion](conceptfusion.md)
- [ConceptGraphs](conceptgraphs.md)
- [SAM 2](sam-2.md) — used to curate InsScene-15K's instance masks
