# OpenScene

> Peng (ETH) 2023 · [Paper](https://arxiv.org/abs/2211.15654)

**One-line summary** — Predicts dense per-point CLIP-space features for 3D point clouds by back-projecting 2D vision-language features and distilling them into a 3D network, enabling zero-shot, task-agnostic open-vocabulary 3D scene understanding without any labelled 3D data.

## Problem

Traditional 3D scene understanding relies on labelled 3D datasets to train one model per task with supervision: every task needs its own expensive 3D annotations, and every model is locked to a predefined category list. Meanwhile, 2D vision-language models trained on internet-scale data already embed images and text in a shared space. OpenScene asks: can 3D points be embedded in that same CLIP feature space, so a single unsupervised representation serves *any* query — objects, materials, affordances, activities, room types — at query time?

## Method & architecture

Given a point cloud $\mathbf{P} \in \mathbb{R}^{M \times 3}$ and posed RGB images, three stages produce per-point CLIP-space features:

1. **Image feature fusion (2D → 3D).** A frozen 2D vision-language segmentation model $\mathcal{E}^{\text{2D}}$ (OpenSeg or LSeg) yields per-pixel embeddings $\mathbf{I}_i \in \mathbb{R}^{H \times W \times C}$. Each surface point $\mathbf{p}$ projects into frame $i$ via the pinhole model $\tilde{\mathbf{u}} = I_i \cdot E_i \cdot \tilde{\mathbf{p}}$ (with depth-based occlusion tests), and its $K$ visible views are average-pooled into one fused feature $\mathbf{f}^{\text{2D}} = \phi(\mathbf{f}_1, \cdots, \mathbf{f}_K)$, giving a feature cloud $\mathbf{F}^{\text{2D}} \in \mathbb{R}^{M \times C}$.
2. **3D distillation.** A sparse-conv MinkowskiNet18A $\mathcal{E}^{\text{3D}}$ learns to predict those features from geometry alone,

$$\mathbf{F}^{\text{3D}} = \mathcal{E}^{\text{3D}}(\mathbf{P}), \qquad \mathcal{E}^{\text{3D}} : \mathbb{R}^{M \times 3} \mapsto \mathbb{R}^{M \times C},$$

   trained with a cosine distillation loss

$$\mathcal{L} = 1 - \cos\big(\mathbf{F}^{\text{2D}}, \mathbf{F}^{\text{3D}}\big),$$

   so novel point clouds can be embedded with no images at all.
3. **2D–3D ensemble.** Fused 2D features excel on small or geometrically ambiguous objects (a mug, a painting); distilled 3D features win on distinctive shapes (walls, floors). Per point, both are scored against the CLIP text embeddings $\mathbf{t}_n$ of the query set, $\mathbf{s}^{\text{2D}}_n = \cos(\mathbf{f}^{\text{2D}}, \mathbf{t}_n)$ and $\mathbf{s}^{\text{3D}}_n = \cos(\mathbf{f}^{\text{3D}}, \mathbf{t}_n)$, and the feature with the higher $\max_n$ score becomes $\mathbf{f}^{\text{2D3D}}$.

**Inference** is pure cosine similarity: zero-shot segmentation labels each point by $\arg\max_n \cos(\mathbf{f}^{\text{2D3D}}, \mathbf{t}_n)$; arbitrary open-vocabulary text produces relevancy heat maps the same way. No 2D or 3D ground-truth labels are used anywhere in training.

## Results

- **Zero-shot 3D semantic segmentation** (ScanNet, 4 unseen classes, protocol of 3DGenZ): OpenScene-LSeg reaches **62.8 mIoU** vs 7.7 for 3DGenZ — even though 3DGenZ trains with ground truth on the other 16 classes — and OpenScene-OpenSeg reaches 83.7 mAcc.
- **Full benchmarks** (all classes, mIoU/mAcc): Ours-OpenSeg gets 47.5/70.7 on ScanNet val, 42.6/59.2 on Matterport3D test, 42.1/61.8 on nuScenes val — beating the zero-shot MSeg-Voting baseline (45.6/54.4, 33.4/39.0, 31.0/36.9) everywhere, and "comparable to supervised approaches from a few years ago"; on Matterport3D the gap to the fully supervised SOTA is only -11.6 mIoU / -8.0 mAcc.
- **Long-tail scaling** (Matterport3D mAcc with K most frequent classes): fully supervised MinkowskiNet drops 64.5 → 18.4 as K goes 21 → 160, while the single fixed OpenScene model goes 59.2 → 23.1, overtaking supervision at K ≥ 40 (50.9 vs 50.8 at K=40).
- **Ablations**: the 2D–3D ensemble beats either branch alone on all datasets/metrics (e.g. OpenSeg ScanNet 47.5/70.7 vs 41.4/63.6 fused-2D and 46.0/66.3 distilled-3D); ~70% of points select the 3D feature, with the 2D share growing as the label set gets longer-tailed.
- First demonstration of open-vocabulary queries of 3D scenes for materials, affordances, activities, and room types with one model and no labelled 3D data.

## Why it matters for SLAM

OpenScene demonstrated that internet-scale 2D vision-language knowledge can be transferred to 3D maps — a core building block of language-grounded spatial AI. For SLAM, this points to maps queried with free-form language rather than fixed label sets: the fuse-then-distill recipe (project pixel features onto geometry, then train a 3D network to predict them) was picked up by ConceptFusion, ConceptGraphs, and LERF, and is increasingly expected of robot mapping stacks.

## Related

- [ConceptFusion](conceptfusion.md)
- [LERF](lerf.md)
- [ConceptGraphs](../level-05-deep-learning/conceptgraphs.md)
- [CLIP](../level-11-world-models-spatial-ai/clip.md)
- [SpatialLM](spatiallm.md)
