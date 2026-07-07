# RoMa

> Edstedt 2024 · [Paper](https://arxiv.org/abs/2305.15404)

**One-line summary** — Robust dense feature matching that fuses frozen DINOv2 foundation-model features (robust but coarse) with specialized VGG19 fine features (precise but brittle) in a Transformer match decoder predicting anchor probabilities, trained with regression-by-classification then robust regression.

## Problem

Dense feature matching — estimating a dense warp $W^{\mathcal{A}\to\mathcal{B}}$ plus a matchability score $p(x^{\mathcal{A}})$ for every pixel between two images — must survive extreme real-world changes in scale, illumination, viewpoint, and texture. Features trained from scratch on matching data (DKM's ResNet50) are spatially precise but overfit to the training set; frozen DINOv2 features are dramatically more robust (the paper measures 27.1 px EPE / 85.6% robustness vs 60.2 / 57.5% for ResNet50 and 87.6 / 43.2% for VGG19 on a frozen-feature coarse-matching probe) but exist only at coarse stride 14. RoMa asks how to get both, and how to train each stage with a loss matched to its error regime.

## Method & architecture

**Two-stage dense pipeline (DKM skeleton).** Decoupled encoders extract coarse and fine features; a global matcher $G_\theta = D_\theta(E_\theta(\varphi^{\mathcal A}_{\text{coarse}}, \varphi^{\mathcal B}_{\text{coarse}}))$ produces a coarse warp and certainty, then refiners $R_{\theta,i}$ at strides $\{1,2,4,8\}$ recursively predict residual warp and certainty-logit offsets using stacked feature maps and a local correlation volume around the previous estimate, with gradients detached between stages.

**Robust + localizable features.** $F_{\text{coarse},\theta}=\text{DINOv2}$ (frozen throughout training — fixing the representation reduces overfitting and cuts compute), while $F_{\text{fine},\theta}=\text{VGG19}$: the ablation shows VGG19 makes poor coarse features but the best fine features, revealing "an inherent tension between fine localizability and coarse robustness."

**Transformer match decoder with anchor probabilities.** Instead of regressing coordinates, the decoder (5 ViT blocks, 8 heads, hidden size 1024, no position encodings — propagating only by feature similarity to avoid resolution overfitting and oversmoothing) outputs a discretized conditional distribution over $K = 64\times 64$ uniform anchors:

$$p_{\text{coarse},\theta}(x^{\mathcal{B}}|x^{\mathcal{A}})=\sum_{k=1}^{K}\pi_k(x^{\mathcal{A}})\,\mathcal{B}_{m_k},$$

with $\pi_k$ anchor probabilities and $m_k$ anchor coordinates — so multimodal ambiguity (repetitive structure, motion boundaries) is represented instead of averaged. The warp is decoded by argmax over anchors followed by a local softargmax over the 4-neighborhood $N_4(k^*)$.

**Loss matched to each stage.** Modeling matchability at scale $s$ as a blurred joint distribution $q(x^{\mathcal{A}},x^{\mathcal{B}};s)=\mathcal{N}(0,s^2\mathbf{I}) \ast p(x^{\mathcal{A}},x^{\mathcal{B}};0)$ shows the coarse conditional is multimodal near motion boundaries while refinement (conditioned on the previous warp) is locally unimodal. Hence $\mathcal{L}_{\text{coarse}}$ is regression-by-classification — NLL of the anchor closest to the ground truth, $k^{\dagger}(x)=\operatorname{argmin}_k \lVert m_k - x\rVert$ — and $\mathcal{L}_{\text{fine}}$ is a robust generalized Charbonnier regression ($\alpha=0.5$), whose log-density is $-(\lVert\mu_\theta - x_i^{\mathcal{B}}\rVert^2 + s)^{1/4}$: locally L2-like gradients that decay toward zero for outliers. Total loss $\mathcal{L}=\mathcal{L}_{\text{coarse}}+\mathcal{L}_{\text{fine}}$ with no cross-stage weighting needed. Trained on MegaDepth (+ScanNet model for indoor eval) at 560×560.

## Results

- **Ablation (100−PCK@5px on MegaDepth validation, lower better)**: DKM baseline 5.8 → decoupled encoders 4.5 → +DINOv2 coarse 3.2 → +regression-by-classification 2.8 → +robust refinement loss 2.7 (full RoMa); swapping the Transformer decoder back to a ConvNet degrades to 3.5.
- **WxBS (extreme wide multi-nuisance baselines)**: 80.1 mAA@10px vs DKM 58.9 and LoFTR 55.4 — a 36% gain over the prior state of the art.
- **IMC2022**: 88.0 mAA@10 vs DKM 83.1 — a 26% relative error reduction.
- **MegaDepth-1500 pose**: 62.6 / 76.7 / 86.3 AUC@5°/10°/20° (DKM 60.4/74.9/85.1); **MegaDepth-8-Scenes**: 62.2/75.9/85.3.
- **ScanNet-1500 pose**: 31.8 / 53.4 / 70.9 — the first method over 70 AUC@20°.
- **InLoc visual localization**: DUC1 60.6/79.3/89.9, DUC2 66.4/83.2/87.8 — state of the art.
- **Runtime**: only 7% slower than DKM (186.3 → 198.8 ms per pair at 560×560, batch 8, RTX 6000).

## Why it matters for SLAM

RoMa demonstrated that frozen foundation-model features dramatically improve matching robustness — establishing the "foundation features for coarse anchors + specialized features for precision" paradigm. For SLAM this matters most in relocalization and loop closure under severe appearance change (day/night, seasons), where sparse hand-crafted or even learned keypoints fail. Dense RoMa-style matchers now back several modern reconstruction and localization pipelines.

## Related

- [RoMa v2](roma-v2.md) — the harder-better-faster-denser successor
- [LoFTR](loftr.md) — earlier detector-free Transformer matching
- [DeDoDe](dedode.md) — same group; decoupled detection/description
- [Foundation models](foundation-models.md) — why frozen pre-trained features generalize
- [MASt3R](../level-03-monocular-slam/mast3r.md) — dense matching fused with 3D reconstruction
