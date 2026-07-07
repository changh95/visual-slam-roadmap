# VoT

> Yugay 2025 · [Paper](https://arxiv.org/abs/2510.03348)

**One-line summary** — Visual Odometry with Transformers (retitled FVO, "Fast Visual Odometry with Transformers"): formulates monocular VO as direct relative pose regression with a high-capacity time–space Transformer plus confidence-weighted aggregation, replacing hybrid network + bundle-adjustment pipelines entirely.

## Problem

Hybrid pipelines that combine deep networks with classical optimization dominate visual odometry: neural predictions plus bundle adjustment yield highly accurate trajectories. But these hybrids fall short of pure end-to-end approaches in speed and capability — they rely on massive, frozen, pre-trained 3D backbones that were trained scale-ambiguous, so the pipeline "essentially inherits this limitation and, by design, fails to estimate absolute scale"; and their slow optimization and post-processing steps bottleneck inference speed. Bundle-adjustment-based methods also typically assume known camera calibration. FVO asks: what if we drop the post-processing altogether?

## Method & architecture

**Pipeline**: overlapping windows of frames → frozen encoder → time–space Transformer decoder → per-pair relative poses + confidences → confidence-weighted trajectory fusion. No bundle adjustment, no camera intrinsics, no test-time optimization.

- **Encoder**: a frozen 300M-parameter CroCo ViT trained within the DUSt3R framework. Each image is split into $h \cdot w$ patches ($h = H/p$, $w = W/p$), giving features $F \in \mathbb{R}^{N \times (h \cdot w) \times d}$ with sinusoidal positional encodings.
- **Time–space decoder**: $L = 12$ blocks (200M parameters), each applying multi-head *temporal* attention (same spatial location across frames), then *spatial* attention (within each frame), then an MLP — a factorized alternative to full attention (163 vs 380 GFLOPs). Learnable camera embeddings $\mathrm{ce} \in \mathbb{R}^d$ are concatenated, $F_0 = [\mathrm{ce}, F]$, and participate only in the spatial attention (injecting them into temporal attention degrades accuracy).
- **Pose head**: for each consecutive pair $(i, i+1)$, a single linear projection of the camera embedding outputs a 14-dim vector: raw rotation matrix $\mathbf{F}_{i,i+1} \in \mathbb{R}^{3\times3}$, translation $\mathbf{t}_{i,i+1} \in \mathbb{R}^3$, and confidences $\mathbf{c}_R, \mathbf{c}_t$. The rotation is projected onto the manifold via the orthogonal Procrustes problem, solved by SVD:

$$\text{Procrustes}(\mathbf{F}_R) = \arg\min_{\hat{\mathbf{R}} \in \mathbb{SO}(3)} \|\hat{\mathbf{R}} - \mathbf{F}_R\|_F^2$$

- **Uncertainty-aware loss**: geodesic rotation error $\mathcal{L}_{\text{rot}} = \cos^{-1}\big(\tfrac{\mathrm{Tr}(\mathbf{R}^\top \hat{\mathbf{R}}) - 1}{2}\big)$ and L1 translation error $\mathcal{L}_{\text{trans}} = \|\mathbf{t} - \hat{\mathbf{t}}\|_1$ are combined heteroscedastically,

$$\mathcal{L} = \mathcal{L}_{\text{rot}} \exp(-\mathbf{c}_R) + \mathbf{c}_R + \mathcal{L}_{\text{trans}} \exp(-\mathbf{c}_t) + \mathbf{c}_t,$$

  so confidence is learned self-supervised from pose labels alone — no depth or correspondence supervision. Translations are de-normalized with training-set statistics, giving *metric* trajectories.
- **Confidence-aware inference**: the video is split into overlapping windows $\{1,\dots,K\}, \{2,\dots,K+1\}, \dots$, so each relative pose $(i,j)$ is predicted $M$ times. Confidences become normalized weights $\tilde{w}^{(k)} = \exp(-\mathbf{c}^{(k)}) / \sum_{\ell} \exp(-\mathbf{c}^{(\ell)})$; rotations are fused via the weighted Fréchet mean on $\mathbb{SO}(3)$, $\bar{\mathbf{R}}_{i,j} = \arg\min_{\mathbf{R}} \sum_k \tilde{w}_R^{(k)} d^2(\mathbf{R}, \mathbf{R}_{i,j}^{(k)})$, translations by weighted average, and the trajectory by composition $\mathbf{T}_{i+1} = \mathbf{T}_i \bar{\mathbf{T}}_{i,i+1}$.
- **Training**: 8 input views at 224×224, AdamW, 250 epochs, 5 days on 12 H100 GPUs; trained on ARKitScenes, ScanNet, 7-Scenes, TartanAir, and KITTI.

## Results

Evaluated with unaligned and aligned ATE (RMSE, meters) — unaligned matters because real deployments have no ground truth to align against:

- **FVO**: ARKit 0.54 / 0.26, ScanNet 0.34 / 0.16, KITTI 50.31 / 8.47, TUM (zero-shot for all methods) 0.47 / 0.19 — best or second-best across the board.
- Baselines: MASt3R-SLAM-VO 0.60 / 0.28 (ARKit), 0.99 / 0.22 (ScanNet), fails on KITTI; DPVO 5.48 / 0.49 (ARKit), 194.55 / 9.74 (KITTI) — accurate when aligned but poor at absolute scale; VGGT 2.94 / 2.26 (ARKit); CUT3R 2.42 / 0.67 (ARKit); large 3D models drift badly over long sequences.
- **Speed**: almost 2× faster than the fastest baseline on an RTX 3090 (VGGT run with only its camera head for fairness).
- Ablations: FVO's heteroscedastic confidence gives 1.04 ATE vs 1.33 with DUSt3R-style per-pixel confidence and 1.21 with none; SO(3) projection beats quaternion (1.19), 6D (1.12), and Plücker-ray (1.17) rotation representations; the CroCoV2-DUSt3R backbone (1.04) far outperforms DINOv2-VGGT (1.31). ATE decreases consistently with more training data and more decoder layers.

## Why it matters for SLAM

VoT/FVO is part of the broader migration of geometric estimation onto Transformer architectures — the same trend that produced LoFTR for matching and VGGT for full multi-view geometry. Its value for a SLAM learner is as a clean case study of the end-to-end extreme of the design space: what you gain by deleting the optimizer (speed, metric scale, no calibration) and what you give up (the interpretable geometric backbone, robustness in dynamic scenes). Note the naming: the arXiv work first appeared as "VoT" and was later retitled FVO.

## Related

- [DROID-SLAM](droid-slam.md) — CNN + optimization learned SLAM baseline
- [DPVO](dpvo.md) — sparse patch-based learned VO baseline
- [VGGT](vggt.md) — full feed-forward Transformer geometry in the same trend
- [LoFTR](../level-05-deep-learning/loftr.md) — Transformer-based detector-free matching
- [TartanVO](tartanvo.md) — earlier generalizable learned VO that kept the geometry-style outputs
