# Depth Anything

> Yang 2024 · [Paper](https://arxiv.org/abs/2401.10891)

**One-line summary** — Depth Anything (CVPR 2024) is a foundation model for monocular depth estimation, built by scaling training to ~62M automatically annotated unlabeled images and achieving strong zero-shot generalization to any scene.

## Problem

Supervised monocular depth models plateau because labeled depth data is scarce — roughly a million-plus images across public datasets, versus the effectively unlimited pool of unlabeled internet imagery. Depth Anything's stated aim is deliberately unglamorous: "without pursuing novel technical modules", build "a simple yet powerful foundation model dealing with any images under any circumstances" by making large-scale unlabeled data actually useful for depth.

## Method & architecture

**Base model.** A DINOv2-initialized ViT encoder with a DPT decoder, trained in the MiDaS tradition: depth is converted to disparity $d = 1/t$ and normalized to $0 \sim 1$ per map, and multi-dataset training uses the affine-invariant loss

$$\mathcal{L}_l = \frac{1}{HW}\sum_{i=1}^{HW} \rho(d_i^*, d_i), \qquad \rho(d_i^*, d_i) = |\hat{d}_i^* - \hat{d}_i|$$

with per-image alignment $\hat{d}_i = \frac{d_i - t(d)}{s(d)}$, $t(d) = \mathrm{median}(d)$, $s(d) = \frac{1}{HW}\sum_i |d_i - t(d)|$. A teacher $T$ is trained this way on 1.5M labeled images from 6 datasets (BlendedMVS, DIML, HRWSI, IRS, MegaDepth, TartanAir); sky regions are segmented and set to zero disparity.

**Data engine.** The teacher pseudo-labels 62M unlabeled images from 8 public sources (SA-1B, ImageNet-21K, LSUN, BDD100K, Google Landmarks, Objects365, Open Images V7, Places365): $\hat{\mathcal{D}}^u = \{(u_i, T(u_i)) \mid u_i \in \mathcal{D}^u\}$. A student $S$ is re-initialized (not fine-tuned from $T$) and trained on labeled + pseudo-labeled data at a 1:2 ratio per batch.

**Challenging the student.** Naive self-training added nothing — teacher and student share architecture and make similar errors. Two strategies unlock the unlabeled data. (1) *Strong perturbations on the student's unlabeled inputs only*: heavy color jittering and Gaussian blur, plus spatial CutMix, $u_{ab} = u_a \odot M + u_b \odot (1-M)$ with rectangular mask $M$ (50% probability); the unlabeled loss $\mathcal{L}_u$ is the area-weighted sum of affine-invariant losses against $T(u_a)$ and $T(u_b)$ inside $M$ and $1-M$ respectively, while the teacher always sees clean images. This compels the model "to actively seek extra visual knowledge and acquire robust representations". (2) *Semantic priors via feature alignment* rather than an auxiliary segmentation task (which failed — discrete masks lose too much):

$$\mathcal{L}_{feat} = 1 - \frac{1}{HW}\sum_{i=1}^{HW} \cos(f_i, f_i')$$

aligning student features $f$ with a frozen DINOv2 encoder $f'$, but skipping pixels whose similarity already exceeds a tolerance margin $\alpha = 0.85$ — objects share semantics but not depth, so exact feature copying would hurt. The total loss averages $\mathcal{L}_l$, $\mathcal{L}_u$ and $\mathcal{L}_{feat}$.

**Model family.** ViT-S (24.8M), ViT-B (97.5M), ViT-L (335.3M) encoders trade accuracy against speed; metric variants fine-tune the encoder in the ZoeDepth framework on NYUv2 or KITTI.

## Results

Zero-shot relative depth on six unseen datasets, versus the best MiDaS v3.1 model (ViT-L class): Depth Anything ViT-L wins everywhere — KITTI AbsRel 0.076 vs 0.127 ($\delta_1$ 0.947 vs 0.850), NYUv2 0.043 vs 0.048, Sintel 0.458 vs 0.587, DDAD 0.230 vs 0.251, ETH3D 0.127 vs 0.139, DIODE 0.066 vs 0.075 — and MiDaS wasn't even fully zero-shot on KITTI/NYUv2 (it trains on their images; Depth Anything does not). The ViT-B model already beats MiDaS's larger ViT-L, and even ViT-S (<1/10 the size) wins on Sintel, DDAD and ETH3D. Fine-tuned for in-domain metric depth (ZoeDepth framework), it lifts NYUv2 $\delta_1$ from 0.964 to 0.984 and AbsRel from 0.069 to 0.056 over the previous best (VPD), and KITTI $\delta_1$ from 0.978 to 0.982; the paper also reports stronger zero-shot metric transfer, strong semantic segmentation from the same encoder, and a better depth-conditioned ControlNet.

## Why it matters for SLAM

Monocular SLAM has long wanted a depth prior that works everywhere — for scale, map density, initialization, and robustness in low-parallax motion. Depth Anything made "just call a depth foundation model" a realistic design choice: a single network that yields plausible dense depth on arbitrary indoor/outdoor imagery, with variants fast enough for real-time front-ends. It cemented the data-scaling paradigm for geometric perception — diverse unlabeled data beats more supervised labels — and (with V2) became the default depth backbone plugged into dense and neural SLAM pipelines.

## Related

- [MiDaS](midas.md) — the affine-invariant multi-dataset training recipe it inherits
- [DPT](dpt.md) — the dense-prediction decoder architecture
- [Depth Anything V2](depth-anything-v2.md) — successor trained on synthetic labels
- [Metric3D](metric3d.md) — camera-aware route to metric depth
- [Marigold](marigold.md) — diffusion-based alternative for zero-shot depth
- [ZoeDepth](zoedepth.md) — the metric fine-tuning framework used for its metric variants
