# ACE-SLAM

> Alzugaray 2025 · [Paper](https://arxiv.org/abs/2512.14032)

**One-line summary** — The first neural implicit RGB-D SLAM system to use scene coordinate regression as its core map representation, achieving strict real-time operation with the network weights themselves serving as the map.

## Problem

Neural implicit SLAM systems in the iMAP/NICE-SLAM line showed that a network can serve as a dense map, but their rendering-based tracking and mapping require costly volumetric integration along camera rays, so they miss strict real-time budgets and need extra machinery (decoupled front-ends, bundle adjustment, loop-closure modules, semantic masking for dynamics). Scene coordinate regression, meanwhile, had matured (DSAC → ACE → ACE Zero) into an efficient, low-memory, privacy-preserving implicit representation with extremely fast relocalization — but only as an *offline* mapping tool. The open question: can SCR be trained *online*, inside a live SLAM loop, as the single representation for tracking, mapping, and relocalization?

## Method & architecture

**SCR as the map.** Each RGB-D frame $\{\mathcal{I}^t, \mathcal{D}^t\}$ is passed through a frozen feature extractor giving $M$ features $\{(\mathbf{f}_i^t, \mathbf{x}_i^t, d_i^t)\}$ (descriptor, 2D keypoint, depth); keypoints are unprojected to local 3D coordinates $\mathbf{y}_i^t = \boldsymbol{\pi}^{-1}_{\mathbf{K}}(\mathbf{x}_i^t, d_i^t)$. The map $\mathcal{M}$ is a small scene-specific network that regresses global coordinates $\tilde{\mathbf{y}}_i = \mathcal{M}(\mathbf{f}_i) \in \mathbb{R}^3$ directly per feature — fully parallel, no ray sampling. SLAM is the joint self-supervised optimization of poses and map over per-pixel residuals

$$r_i^t(\mathcal{M}, \mathbf{P}^t) = \lVert \mathcal{M}(\mathbf{f}_i^t) - \mathbf{P}^t \mathbf{y}_i^t \rVert^2, \qquad \{\mathcal{M}^\ast, \mathcal{P}^\ast\} = \arg\min_{\mathcal{M}, \mathcal{P}} \sum_{\mathbf{P}^t \in \mathcal{P}} \sum_i r_i^t(\mathcal{M}, \mathbf{P}^t),$$

with no ground-truth supervision and no explicit feature matching — frames interact only through the shared implicit map, which yields emergent implicit matching and *soft loop closure*.

**TriMLP head.** Instead of ACE's direct-regression MLP (HomMLP), a compact MLP predicts classification logits over discretized grids on three orthogonal planes, $C_i^{XY}, C_i^{XZ}, C_i^{YZ} = \mathrm{softmax}(\mathrm{MLP}(\mathbf{f}_i))$; each plane votes coordinates by weighted averaging over its basis grid, e.g. $(\tilde{x}_i^{XZ}, \tilde{z}_i^{XZ}) = \sum B^{XZ} \odot C_i^{XZ}$, and the final coordinate averages the compatible components across planes ($\tilde{x}_i = \tfrac{1}{2}(\tilde{x}_i^{XY} + \tilde{x}_i^{XZ})$, etc.). This voting gives features multiple valid paths to the same 3D point, an inductive bias that speeds up online adaptation.

**Tracking = relocalization.** Every frame's pose is estimated by rigid alignment of predicted vs observed coordinates, $\mathbf{P}^t = \arg\min_{\mathbf{P}} \sum_i \lVert \tilde{\mathbf{y}}_i^t - \mathbf{P}\mathbf{y}_i^t \rVert^2$, solved in closed form (Kabsch–Umeyama) inside RANSAC over sampled triplets (up to $H$ hypotheses). The winning hypothesis's inlier ratio $\lambda^t$ doubles as a quality signal; no pose prior is needed, so relocalization after tracking loss, frame skipping, and robustness to dynamics come for free.

**PTAM-style loop.** Optimization cycles alternate pose estimation and mapping over a window $\mathcal{W}$: the newest $W_L$ keyframes, the latest frame, plus up to $W_G$ keyframes sampled with probability $p^t \propto \tfrac{1}{|\mathcal{P}|} + \alpha(1 - \lambda^t)$ — biased toward poorly-aligned frames (soft loop closure). Feature sampling is biased the same way, and mapping is a few SGD mini-batches on the residual loss per cycle, so compute per cycle is constant. Features are dense ACE-encoder features at 1/8 resolution by default (sparse SuperPoint also supported); the extractor stays frozen.

## Results

All experiments on an RTX 4090 + i7-12700K, averaged over 3 runs; if processing exceeds a frame interval, frames are *skipped*, faithfully mimicking a live feed.

- **Efficiency** (Replica, default config): ACE-SLAM runs at 29.71 equivalent FPS = 99.0% real-time factor with a 1.11 MB map, vs ESLAM 7.35 FPS / 24.5% / 45.46 MB, NICE-SLAM 0.33 FPS / 1.1% / 95.86 MB, Point-SLAM 0.27 FPS / 0.9% / 27.23 MB, iMAP* 0.15 FPS / 0.5% — up to two orders of magnitude faster. Localizing a new frame end-to-end takes 11 ms (ACE features) or 13 ms (SuperPoint).
- **Static ATE RMSE**: competitive with iMAP* and approaching NICE-SLAM, e.g. Replica room-0 0.027 m (NICE-SLAM 0.017, iMAP* 0.031), TUM fr2/xyz 0.016 m, fr1/desk 0.083 m — below the most recent rendering-based pipelines in accuracy, but the only system operating in strict real time. TriMLP clearly beats HomMLP (e.g. ScanNet 0000: 0.164 vs 0.364 m; 0106: 0.319 vs 0.765 m).
- **Dynamic TUM-RGBD**, with *no* semantic priors: fr3/w/xyz 0.072 m vs NICE-SLAM 0.302 and semantics-based NID-SLAM 0.071; fr3/s/static 0.007 m — comparable to or better than specialized dynamic-SLAM pipelines, because always-on RANSAC relocalization naturally rejects moving regions.

## Why it matters for SLAM

ACE-SLAM shows that scene coordinate regression — matured through DSAC, ACE, and ACE Zero as an offline relocalization technique — can serve as the *single* representation for tracking, mapping, relocalization, and (soft) loop closure in a live SLAM loop, with a megabyte-scale privacy-preserving map. It is a clean demonstration of relocalizer-centric SLAM design, a strict-real-time counterpoint to rendering-based neural implicit SLAM, and the natural endpoint (so far) of the ACE lineage.

## Related

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [iMAP](imap.md)
- [NICE-SLAM](nice-slam.md)
- [ACE-G](ace-g.md)
- [SuperPoint](superpoint.md)
