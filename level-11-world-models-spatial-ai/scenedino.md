# SceneDINO

> Jevtić 2025 · [Paper](https://arxiv.org/abs/2507.06230)

**One-line summary** — SceneDINO lifts self-supervised 2D DINO features into a feed-forward 3D feature field, predicting geometry and expressive 3D features from a single image and distilling them into the first fully unsupervised semantic scene completion (SSC) system — no semantic or geometric ground truth of any kind.

## Problem

Semantic scene completion asks a model to infer both the 3D geometry *and* the semantics of a scene from a single image — including occluded, never-observed regions. Prior SSC methods rely on expensive ground-truth 3D voxel labels and often extra LiDAR supervision; even "label-free" variants like GaussTR lean on heavily supervised foundation models (SAM, Metric3Dv2). SceneDINO is the first approach to SSC in a *fully unsupervised* setting: training uses only unlabeled multi-view images with self-supervision, and inference uses a single RGB image.

## Method & architecture

The pipeline extends Behind the Scenes (BTS) with a feature head, then adds a 3D distillation stage:

1. **Feed-forward feature field.** A 2D encoder-decoder $\xi$ (DINO ViT-B/8 backbone + dense prediction decoder) maps the input image $I_0$ to a per-pixel embedding $E \in \mathbb{R}^{D_E \times H \times W}$. For a 3D point $x$, projected to pixel $u = \pi_0(x)$ at camera distance $d_x$, a two-layer MLP $\phi$ predicts density and a $D{=}768$-dim DINO-like feature:
$$(\sigma_x, f_x) = \phi\big(e_u,\, \gamma(u, d_x)\big)$$
where $e_u$ is $E$ bilinearly interpolated at $u$ and $\gamma$ is a positional encoding.
2. **Volume rendering of features and depth.** Sampling $L{=}32$ points along each ray with spacing $\delta_i$, visibility follows standard volume rendering, $\alpha_i = 1 - \exp(-\sigma_{x_i}\delta_i)$ and $V_i = \prod_{j=1}^{i-1}(1-\alpha_j)$, giving rendered feature and depth
$$\tilde{f}_{u_r} = \sum_{i=1}^{L} V_i\, \alpha_i\, f_{x_i}, \qquad \tilde{d}_{u_r} = \sum_{i=1}^{L} V_i\, \alpha_i\, d_{x_i}.$$
3. **Multi-view self-supervised training.** Views are split into source/target sets; targets are reconstructed from sources. The loss combines a photometric term $\mathcal{L}_p = \min_{I_s}\big(\lambda_1 L_1 + \lambda_{\text{SSIM}} L_{\text{SSIM}}\big)$ (color sampled from other views as in BTS), edge-aware depth smoothness $\mathcal{L}_s$, a feature reconstruction term against 2D DINO features $F_t$,
$$\mathcal{L}_f = 1 - \text{cos-sim}\big(F_t,\ \psi(\hat{F}_t) + F\big),$$
where $\psi$ is a feature downsampler and $F$ a learned constant decomposition compensating ViT positional-encoding artifacts, plus feature smoothness $\mathcal{L}_{fs}$; the total is $\mathcal{L} = \lambda_p\mathcal{L}_p + \lambda_s\mathcal{L}_s + \lambda_f\mathcal{L}_f + \lambda_{fs}\mathcal{L}_{fs}$.
4. **3D feature distillation.** A point-wise head $h$ maps $f_x \in \mathbb{R}^D$ to a low-dim code $z_x \in \mathbb{R}^K$ ($K{=}19$), trained with STEGO's contrastive correlation loss on feature-similarity matrices $S_{ij}$ (input space) and $S^h_{ij}$ (distilled space):
$$\mathcal{L}_{\text{corr}}(f_X, f_Y, b) = -\sum_{i,j} (S_{ij} - b)\, \max(S^h_{ij}, 0)$$
summed over self, kNN, and random pairs. Feature batches are sampled *in 3D*: depth-stratified surface center points, neighbors within $r = 0.5\,$m, keeping only samples with density $\sigma > 0.5$.
5. **Unsupervised probing.** Mini-batch cosine k-means clusters the distilled space; $p_x = \text{softmax}(\text{cos-sim}(h(f_x), \theta))$ gives pseudo-classes, aligned to ground truth via Hungarian matching only for evaluation. Training takes ~2 days on a single V100; camera poses can come from unsupervised ORB-SLAM3.

## Results

On **SSCBench-KITTI-360** (ranges 12.8/25.6/51.2 m, Hungarian-matched mIoU in %):

| Method | 12.8 m | 25.6 m | 51.2 m |
|---|---|---|---|
| S4C + STEGO (unsup. baseline) | 10.53 | 9.26 | 6.60 |
| **SceneDINO (unsupervised)** | **10.76** | **10.01** | **8.00** |
| S4C (2D-supervised reference) | 16.94 | 13.94 | 10.19 |

Geometric IoU is 49.54/42.27/37.60 vs 54.64/45.57/39.35 for supervised S4C. In **2D unsupervised segmentation** on KITTI-360, SceneDINO reaches 77.74 Acc / 25.81 mIoU, beating STEGO with DINO features (73.32/23.57) and U2Seg (72.89/23.43). **Linear probing** the distilled features (DINOv2 targets) yields 15.85/13.70/10.57 mIoU — closing the gap to fully supervised S4C and slightly surpassing it at 51.2 m. Using ORB-SLAM3-estimated poses instead of dataset poses costs only 0.12 mIoU; switching DINO→DINOv2 targets gains +1.08 mIoU. Domain generalization to Cityscapes/BDD100K and multi-view feature consistency (vs DINO, DINOv2, FiT3D) are also state of the art.

## Why it matters for SLAM

SLAM maps are hollow where the sensor has not looked; scene completion fills that gap with learned structural priors, which directly benefits exploration, path planning, and safe navigation in partially observed environments. SceneDINO exemplifies the Spatial AI trend of this level — reuse self-supervised foundation-model features to get open-world 3D understanding without 3D annotations — and its pipeline is literally SLAM-compatible: the authors show training works with ORB-SLAM3 poses at negligible cost, keeping the whole stack unsupervised.

## Related

- [Spatial AI](spatial-ai.md)
- [Foundation models](../level-05-deep-learning/foundation-models.md)
- [OpenScene](../level-05-deep-learning/openscene.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [World Labs / Marble](world-labs-marble.md)
