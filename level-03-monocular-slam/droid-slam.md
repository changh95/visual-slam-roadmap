# DROID-SLAM

> Teed 2021 · [Paper](https://arxiv.org/abs/2108.10869)

**One-line summary** — An end-to-end learned SLAM system that iteratively refines dense optical flow and solves for poses and depths through a differentiable Dense Bundle Adjustment layer, dramatically reducing catastrophic failures compared to classical systems.

## Problem

Classical SLAM pipelines depend on hand-crafted feature extraction and matching, which are brittle exactly where robots need them most: textureless surfaces, motion blur, repetitive structure — "failures come in many forms, such as lost feature tracks, divergence in the optimization algorithm, and accumulation of drift." Earlier learned systems (DeepVO, TartanVO, DeepV2D, BA-Net) "fall far short of the accuracy of their classical counterparts on common benchmarks" because they lack full bundle adjustment, loop closure, and global refinement. DROID-SLAM's question: can an end-to-end trainable system keep the optimisation structure that makes SLAM accurate, while learning the parts that make classical SLAM fragile?

## Method & architecture

**State and frame graph.** For each image $t$ the system keeps a pose $\mathbf{G}_t \in SE(3)$ and an inverse depth map $\mathbf{d}_t \in \mathbb{R}_+^{H\times W}$. A frame graph $(\mathcal{V},\mathcal{E})$ connects co-visible frames; long-range edges added when the camera revisits a mapped region give loop closure inside the same machinery.

**Features and correlation.** RAFT-style feature and context networks produce maps at 1/8 resolution. For every edge $(i,j)\in\mathcal{E}$ a 4D correlation volume is built from all-pairs dot products, $C^{ij}_{u_1 v_1 u_2 v_2} = \langle g_\theta(I_i)_{u_1 v_1},\, g_\theta(I_j)_{u_2 v_2} \rangle$, pooled into a 4-level pyramid and indexed by a lookup operator with radius $r$.

**Recurrent update operator.** Each iteration first computes the dense correspondence field induced by the current geometry,

$$\mathbf{p}_{ij} = \Pi_c(\mathbf{G}_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}_i)), \qquad \mathbf{G}_{ij} = \mathbf{G}_j \circ \mathbf{G}_i^{-1}$$

where $\Pi_c$ is the camera projection and $\mathbf{p}_i$ a pixel grid. Correlation lookups at $\mathbf{p}_{ij}$, the induced flow, and the previous BA residual feed a $3\times 3$ ConvGRU, which outputs a flow revision $\mathbf{r}_{ij}$ and confidence $\mathbf{w}_{ij} \in \mathbb{R}_+^{H\times W\times 2}$, giving the corrected correspondence $\mathbf{p}^*_{ij} = \mathbf{r}_{ij} + \mathbf{p}_{ij}$, plus a per-pixel damping factor $\lambda$.

**Dense Bundle Adjustment (DBA) layer.** Flow revisions are mapped to pose/depth updates by minimising, over the whole frame graph,

$$\mathbf{E}(\mathbf{G}', \mathbf{d}') = \sum_{(i,j)\in\mathcal{E}} \left\lVert \mathbf{p}^*_{ij} - \Pi_c(\mathbf{G}'_{ij} \circ \Pi_c^{-1}(\mathbf{p}_i, \mathbf{d}'_i)) \right\rVert^2_{\Sigma_{ij}}, \qquad \Sigma_{ij} = \operatorname{diag} \mathbf{w}_{ij}$$

a confidence-weighted (Mahalanobis) reprojection error. One Gauss-Newton step is solved with the Schur complement — the depth block $\mathbf{C}$ is diagonal, so $\Delta\boldsymbol{\xi} = [\mathbf{B} - \mathbf{E}\mathbf{C}^{-1}\mathbf{E}^{T}]^{-1}(\mathbf{v} - \mathbf{E}\mathbf{C}^{-1}\mathbf{w})$ and $\Delta\mathbf{d} = \mathbf{C}^{-1}(\mathbf{w} - \mathbf{E}^{T}\Delta\boldsymbol{\xi})$ — and applied by retraction: $\mathbf{G}^{(k+1)} = \operatorname{Exp}(\Delta\boldsymbol{\xi}^{(k)}) \circ \mathbf{G}^{(k)}$, $\mathbf{d}^{(k+1)} = \Delta\mathbf{d}^{(k)} + \mathbf{d}^{(k)}$. The layer is differentiable, so the whole loop trains end-to-end (pose loss $\mathcal{L}_{pose} = \sum_i \lVert \operatorname{Log}_{SE3}(\mathbf{T}_i^{-1}\cdot\mathbf{G}_i) \rVert_2$ plus flow loss, on 7-frame TartanAir clips, 15 unrolled iterations, 1 week on 4 RTX-3090s).

**System.** A frontend thread tracks incoming frames and runs local BA over a keyframe window; a backend thread rebuilds the frame graph and runs global BA over the full keyframe history (custom block-sparse CUDA kernel). Stereo just adds fixed-baseline cross-camera edges; RGB-D adds a depth-residual term to the objective — the same monocular-trained weights handle all three modalities.

## Results

Trained once, monocular-only, on synthetic TartanAir; evaluated zero-shot on 4 datasets and 3 modalities:

- **TartanAir** (mono, Hard test set): avg ATE 0.24 m vs TartanVO 1.92 and DeepV2D 5.03 — 8x and 20x lower, zero failures. On the ECCV 2020 SLAM competition split: 0.129 (mono) and 0.047 (stereo), 62% / 60% lower error than the top COLMAP-based submissions while running 16x faster.
- **EuRoC** (mono): avg ATE 0.022 m over all 11 sequences with zero failures — 82% lower than prior zero-failure methods, 43% lower than ORB-SLAM3 on the 10/11 sequences ORB-SLAM3 completes; stereo reduces error 71% vs ORB-SLAM3.
- **TUM-RGBD** (freiburg1, mono): avg ATE 0.038 m, tracking all 9 sequences where ORB-SLAM2/3 fail on most; 83% lower error than DeepFactors, 90% lower than DeepV2D.
- **ETH3D-SLAM** (RGB-D): ranks 1st on train and test leaderboards (test AUC 207.79 vs 153.47 for BAD-SLAM), successfully tracking 30/32 datasets vs 19/32 for the next best.
- **Cost**: real-time needs 2 RTX-3090s (~20 fps on EuRoC); the backend can require up to 24 GB GPU memory on long videos — the explicit motivation for DPVO/DPV-SLAM.

## Why it matters for SLAM

DROID-SLAM established the differentiable-BA paradigm for learned SLAM and demonstrated that a trained system can match or exceed decades of hand-engineered SLAM pipelines, catalysing a wave of learning-based SLAM research. Its recurrent-update + DBA architecture is the direct ancestor of DPVO, DPV-SLAM, and MAC-VO, and it serves as the pose/depth frontend inside systems like NeRF-SLAM and GO-SLAM.

## Related

- [RAFT](../level-05-deep-learning/raft.md)
- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [ORB-SLAM3](orb-slam3.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)
