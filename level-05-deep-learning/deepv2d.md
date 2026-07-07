# DeepV2D

> Teed 2018 · [Paper](https://arxiv.org/abs/1812.04605)

**One-line summary** — DeepV2D predicts depth from video by composing classical geometric algorithms (PnP-style pose updates, plane-sweep stereo) into differentiable modules and alternating between motion and depth estimation until both converge — block coordinate descent, learned.

## Problem

Depth-from-video sits between two unsatisfying extremes: classical SfM pipelines are geometrically principled but produce noisy or missing reconstructions in low-texture regions, occlusions, and lighting changes, while generic depth-regression networks are hard to train to actually exploit multi-view geometry. DeepV2D's goal is an end-to-end architecture that "combines the representation ability of neural networks with the geometric principles governing image formation" — it "differentializes" a classical SfM pipeline that alternates between stereopsis, dense 2D matching, and PnP.

## Method & architecture

Two modules alternate at inference. With projection $\pi$ and backprojection $\pi^{-1}$ under a pinhole model, a pixel $\mathbf{x}$ with depth $z$ in camera $i$ reprojects into camera $j$ as $\pi(\mathbf{G}_{ij}\,\pi^{-1}(\mathbf{x},z))$ where $\mathbf{G}_{ij}=\mathbf{G}_{j}\mathbf{G}_{i}^{-1}$ is the relative pose in $SE(3)$.

**Depth module** (given poses, predict keyframe depth): a stacked-hourglass 2D encoder maps each image to features $F_i$; for each non-keyframe $j$ a cost volume is built by backprojecting features over depth hypotheses $z_1,\dots,z_D$ (0.2–10 m indoors):

$$C_{uvk}^{j}=F_{j}\big(\pi(\mathbf{G}_{j}\mathbf{G}_{1}^{-1}\pi^{-1}(\mathbf{x},z_{k}))\big),$$

using differentiable bilinear sampling — so the volume is differentiable w.r.t. camera pose too. Volumes are concatenated with keyframe features, matched by 3D convolutions, averaged across views ("view pooling"), refined by 3D hourglass modules, and read out with a differentiable soft argmax over the depth dimension.

**Motion module (Flow-SE3)** (given depth, update poses): a shared feature extractor plus an hourglass network predicts dense *residual flow* $\mathbf{R}$ and confidence $\mathbf{W}$ between the keyframe features and features warped with the current depth/pose. Each pixel defines a geometric reprojection error over pose perturbations $\xi\in se(3)$:

$$\mathbf{e}_{k}^{ij}(\xi_{i},\xi_{j})=\mathbf{r}_{k}-\big[\pi\big((e^{\xi_{j}}\mathbf{G}_{j})(e^{\xi_{i}}\mathbf{G}_{i})^{-1}\mathbf{X}_{k}^{i}\big)-\pi(\mathbf{G}_{ij}\mathbf{X}_{k}^{i})\big],\qquad \mathbf{X}_{k}^{i}=\pi^{-1}(\mathbf{x}_{k},z_{k}),$$

and the objective $E(\boldsymbol{\xi})=\sum_{(i,j)\in\mathcal{C}}\sum_{k}\mathbf{e}_{k}^{ij\,T}\,diag(\mathbf{w}_{k})\,\mathbf{e}_{k}^{ij}$ is minimized by one differentiable Gauss-Newton step

$$\xi^{*}=-(\mathbf{J}^{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{T}\mathbf{W}\,\mathbf{r},$$

unrolling a single PnP iteration; gradients flow through the solve into the flow and feature networks. Two variants of the pair set $\mathcal{C}$: *keyframe* optimization (keyframe vs. each frame; each $\xi_j$ solved independently) and *global* optimization (all $N\times(N-1)$ pairs, jointly updating all poses like a pose graph).

**Training and inference.** Supervision is L1 depth loss with a smoothness penalty plus a Huber-robust reprojection loss between predicted and ground-truth poses, combined as $\mathcal{L}=\mathcal{L}_{depth}+\lambda\mathcal{L}_{motion}$ with $\lambda=1$. Inference initializes with a constant depth map (self-init) or a single-image network (fcrn-init) and alternates the modules — evaluated after 8 iterations, though accuracy converges within a few.

## Results

- **NYUv2** (scale-matched depth): Abs Rel 0.061, RMSE 0.403, $\delta<1.25$ = 0.956 (fcrn-init, global) — vs DeMoN retrained on NYU 0.144, MVSNet+OpenMVG 0.181, and single-image DORN 0.109 / DenseDepth 0.103. Even self-init reaches Abs Rel 0.070.
- **ScanNet**: trained on ScanNet, Abs Rel 0.057, sc-inv 0.077, rotation 0.628 deg, translation 1.373 cm; trained *only on NYU* it still beats BA-Net (5-view: Abs Rel 0.091) on all metrics — strong cross-dataset generalization.
- **SUN3D**: L1-inv 0.041 / sc-inv 0.104 (NYU+ScanNet training) vs DeepTAM 0.054 / 0.128 — even though DeepTAM was trained on SUN3D and evaluated with ground-truth poses.
- **KITTI** (Eigen split): Abs Rel 0.037, RMSE 2.005 vs BA-Net 0.083 / 3.640 and DORN 0.069 / 2.857.
- **TUM RGB-D tracking** (translational RMSE, m/s): mean 0.033 vs DeepTAM 0.040 and DVO 0.060, using global pose optimization over a sliding 8-frame window.
- Ablation: replacing the 3D stereo-matching network with a correlation layer + 2D encoder-decoder worsens NYU Abs Rel from 0.062 to 0.135.

## Why it matters for SLAM

DeepV2D is a key link in the lineage from DeMoN to DROID-SLAM: it showed that iterating between learned motion and learned depth — with geometry (a differentiable Gauss-Newton layer over $SE(3)$) mediating the exchange — beats regressing either quantity in one shot. Unlike BA-Net's joint optimization over a depth basis, its block-coordinate-descent decomposition optimizes per-pixel depth directly. Teed & Deng's subsequent RAFT and DROID-SLAM grew straight out of this alternate-and-converge design, which now underpins the most accurate learned VO/SLAM systems.

## Related

- [DeMoN](demon.md)
- [BA-Net](ba-net.md)
- [DeepTAM](deeptam.md)
- [RAFT](raft.md)
- [DROID-SLAM](droid-slam.md)
