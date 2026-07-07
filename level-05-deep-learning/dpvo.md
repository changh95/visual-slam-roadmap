# DPVO

> Teed 2023 · [Paper](https://arxiv.org/abs/2208.04726)

**One-line summary** — A patch-based, lightweight variant of DROID-SLAM showing that sparse patch tracking plus differentiable bundle adjustment matches or beats dense flow at a fraction of the memory and compute.

## Problem

Deep VO built on dense optical flow (DROID-SLAM) raised accuracy dramatically, but "using dense flow incurs a large computational cost, making these previous methods impractical for many use cases": DROID's VO frontend needs 8.7 GB of GPU memory and its frame rate collapses during fast motion. The field assumed the cost was necessary — that dense flow "provides additional redundancy against incorrect matches." Deep Patch Visual Odometry (DPVO) set out to test, and ultimately disprove, that assumption.

## Method & architecture

**Patch representation.** The scene is a set of poses $\mathbf{T} \in \mathbb{SE}(3)^N$ and square $p \times p$ image patches, each stored as a $4 \times p^2$ homogeneous array with pixel coordinates $(\mathbf{x}, \mathbf{y})$ and a single inverse depth $\mathbf{d}$ shared by the patch (a fronto-parallel plane, as in DSO). A patch $k$ from frame $i$ reprojects into frame $j$ as

$$\mathbf{P}'_{kj} \sim \mathbf{K} \mathbf{T}_j \mathbf{T}_i^{-1} \mathbf{K}^{-1} \mathbf{P}_k$$

with $\mathbf{K}$ the calibration matrix. A bipartite **patch graph** links each patch to every frame within distance $r$ of its source frame; patch trajectories are the sets of these reprojections, and the graph grows/shrinks as frames arrive.

**Features and patches.** Twin residual networks give matching and context features at 1/4 resolution (2-level pyramid). Patches are cropped at *random* pixel locations — 96 per frame (Default) or 48 (Fast) — which ablations show works better than SIFT, ORB, SuperPoint, or gradient-based selection.

**Recurrent update operator.** Operating on the patch graph with a hidden state per edge, each iteration runs: (1) *correlation* — for each pixel of the reprojected patch, inner products against a $7\times 7$ grid of frame features, $\mathbf{C}_{uv\alpha\beta} = \langle \mathbf{g}_{uv},\ \mathbf{f}(\mathbf{P}'_{kj}(u,v) + \Delta_{\alpha\beta}) \rangle$; (2) *1D temporal convolution* along each patch trajectory; (3) *softmax aggregation* — message passing among edges sharing a patch or a frame, replacing the spatial convolutions dense methods get for free; (4) a *transition block* (gated residual units + LayerNorm); (5) a *factor head* predicting a 2D trajectory revision $\delta_{kj}$ and confidence $\Sigma_{kj} \in (0,1)^2$ per edge.

**Differentiable bundle adjustment.** Poses and patch inverse depths are updated by two Gauss-Newton iterations (Schur complement, gradients backpropagated through) on

$$\sum_{(k,j)\in\mathcal{E}} \left\lVert \hat{\omega}_{ij}(\mathbf{T}, \mathbf{P}_k) - [\hat{\mathbf{P}}'_{kj} + \delta_{kj}] \right\rVert^2_{\Sigma_{kj}}$$

the Mahalanobis distance between induced and predicted patch-center reprojections — DROID-SLAM's DBA on a radically smaller problem.

**Training and system.** Trained end-to-end on TartanAir (240k iterations, one RTX-3090, 3.5 days) with loss $\mathcal{L} = 10\mathcal{L}_{pose} + 0.1\mathcal{L}_{flow}$, where $\mathcal{L}_{pose}$ compares relative poses after Umeyama scale alignment. At inference: 8-frame initialization, constant-velocity pose prediction, one update + two BA iterations per frame over a 10-keyframe window (7 for Fast), flow-based keyframe removal. No loop closure or global BA — that gap is filled by DPV-SLAM.

## Results

Median of 5 runs; two configs: Default (60 FPS, 4.9 GB) and Fast (120 FPS, 2.5 GB) on an RTX-3090, vs DROID-VO at 40 FPS / 8.7 GB.

- **TartanAir** (ECCV 2020 SLAM competition test split): avg ATE 0.21 — 40% lower than full DROID-SLAM (0.33) and 64% lower than DROID-VO (0.58); classical DSO averages 7.32 and ORB-SLAM3 14.38. On the validation split, AUC 0.80 vs DROID-SLAM's 0.71 while running 4x faster.
- **EuRoC**: avg ATE 0.105 vs DROID-VO 0.186 (43% lower); even the 120 FPS Fast config (0.129) beats DROID-VO on most sequences.
- **TUM-RGBD** (freiburg1, mono): avg ATE 0.089 vs DROID-VO 0.098 (9% lower), with zero catastrophic failures where ORB-SLAM3 and DSO fail on multiple sequences.
- **Stability**: frame rate is nearly constant (above 48 FPS for 95% of frames; Fast stays above 98 FPS) while DROID-VO drops to 11 FPS in the worst case — an 8.9x gap.

## Why it matters for SLAM

DPVO made differentiable-BA-based visual odometry practical for real-time robotics rather than an offline GPU-heavy affair, and its recurrent-update-on-sparse-patches design was adopted by followers such as MAC-VO and DPV-SLAM (and adapted to event cameras in DEVO). It is the standard modern baseline for learned monocular VO. It appears in both Level 3 (as a monocular system) and Level 5 (as a deep-learning method).

## Related

- [DROID-SLAM](droid-slam.md)
- [DPV-SLAM](dpv-slam.md)
- [MAC-VO](mac-vo.md)
- [DSO](../level-03-monocular-slam/dso.md) — source of the patch representation
- [RAFT](raft.md)
- [DEVO](../level-10-event-camera-slam/devo.md)
