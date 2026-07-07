# DSP-SLAM

> Wang (UCL) 2021 · [Paper](https://arxiv.org/abs/2108.09481)

**One-line summary** — Augments ORB-SLAM2 with category-level DeepSDF shape priors to reconstruct complete, dense object models online from monocular, stereo, or stereo+LiDAR input.

## Problem

Object-level SLAM systems without priors (e.g. Fusion++) reconstruct each object only as well as the camera happened to observe it — partial viewpoints yield partial, low-quality models — while instance-database systems (SLAM++) require every object to be pre-scanned. Learned shape priors such as DeepSDF can complete unseen object parts from sparse observations, but integrating a deep implicit shape model into a real-time SLAM loop — with online pose tracking, sparse and partial data, and a joint map — was an open problem: prior-based reconstructors like FroDO were slow batch methods, and NodeSLAM needed dense depth. DSP-SLAM builds a joint map of dense object models for the foreground and sparse landmark points for the background, closing that gap.

## Method & architecture

ORB-SLAM2 (monocular or stereo) provides camera tracking, keyframing, and the sparse 3D point cloud. At each keyframe, Mask R-CNN masks plus a 3D detector give each object instance $I=\{\mathcal{B},\mathcal{M},\mathcal{D},\mathbf{T}_{co,0}\}$ — 2D box, mask, sparse 3D point observations (SLAM points, or as few as 50 LiDAR points), and an initial pose from a LiDAR/image 3D detector or PCA on the object points. Each object is a DeepSDF latent code $\mathbf{z}\in\mathbb{R}^{64}$ with decoder $s=G(\mathbf{x},\mathbf{z})$ and 7-DoF pose $\mathbf{T}_{co}\in \mathbf{Sim}(3)$. Shape and pose are estimated by minimizing two energies. A surface-consistency term drives observed back-projected points onto the zero level set:

$$E_{surf}=\frac{1}{\lvert\mathbf{\Omega}_{s}\rvert}\sum_{\mathbf{u}\in\mathbf{\Omega}_{s}}G^{2}\big(\mathbf{T}_{oc}\,\pi^{-1}\!\left(\mathbf{u},\mathcal{D}\right),\,\mathbf{z}\big)$$

Alone this lets shapes grow oversized under partial observation, so a differentiable SDF renderer adds silhouette-aware depth supervision: along each pixel ray, $M$ sampled depths get occupancy $o_i$ from the predicted SDF (piecewise-linear cutoff $\sigma=0.01$), ray-termination event probabilities $\phi_{i}=o_{i}\prod_{j=1}^{i-1}(1-o_{j})$, and an expected rendered depth $\hat{d}_{\mathbf{u}}=\sum_{i=1}^{M+1}\phi_{i}d_{i}$, giving

$$E_{rend}=\frac{1}{\lvert\mathbf{\Omega}_{r}\rvert}\sum_{\mathbf{u}\in\mathbf{\Omega}_{r}}(d_{\mathbf{u}}-\hat{d}_{\mathbf{u}})^{2}$$

where $\mathbf{\Omega}_{r}$ adds pixels inside the box but outside the mask, assigned background depth $1.1\,d_{max}$ — penalizing shapes that leak outside the silhouette. The total energy $E=\lambda_{s}E_{surf}+\lambda_{r}E_{rend}+\lambda_{c}\lVert\mathbf{z}\rVert^{2}$ ($\lambda_s=100$, $\lambda_r=2.5$, $\lambda_c=0.25$) is minimized by Gauss-Newton with analytical Jacobians through the network from $\mathbf{z}=\mathbf{0}$ — roughly an order of magnitude faster per iteration than first-order descent (20 ms vs 183 ms with both terms) and needing ~10 instead of 50 iterations. Reconstructed objects then enter a joint factor graph over camera poses $C$, object poses $O$, and points $P$:

$$C^{*},O^{*},P^{*}=\mathop{\arg\min}_{\{C,O,P\}}\sum_{i,j}\big\lVert\mathbf{e}_{co}(\mathbf{T}_{wc_{i}},\mathbf{T}_{wo_{j}})\big\rVert_{\Sigma_{i,j}}+\sum_{i,k}\big\lVert\mathbf{e}_{cp}(\mathbf{T}_{wc_{i}},{}^{w}\mathbf{p}_{k})\big\rVert_{\Sigma_{i,k}}$$

with camera-object residual $\mathbf{e}_{co}=\log(\mathbf{T}^{-1}_{co}\mathbf{T}^{-1}_{wc}\mathbf{T}_{wo})$ and the standard ORB-SLAM2 reprojection residual $\mathbf{e}_{cp}$, solved by Levenberg-Marquardt in g2o — objects act as additional landmarks. Data association matches detections to map objects by 3D-box distance (LiDAR) or shared feature matches (mono/stereo); re-observed objects get pose-only updates.

## Results

On KITTI3D (7481 frames, single image + LiDAR, same DeepSDF prior and initialization as the baseline), DSP-SLAM beats auto-labelling on nearly all object pose metrics: BEV AP@0.5 83.31 vs 80.70 (Easy) and 75.28 vs 63.36 (Moderate); nuScenes NS@0.5 88.01 vs 86.52 (E) and 76.15 vs 64.44 (M) — with visibly better shapes (sedans no longer reconstructed "beetle"-shaped). On the KITTI odometry benchmark, stereo+LiDAR DSP-SLAM averages 0.70 % translation / 0.22 deg per 100 m — improving on its ORB-SLAM2 backbone (0.72/0.22) on object-rich sequences 03, 05, 06, 08, and matching SuMa++ (0.70/0.29) while using only a few hundred LiDAR points per frame; reducing to 50 points per object barely changes accuracy (0.72/0.22). Stereo-only runs at 0.75/0.25, and at 5 Hz with per-keyframe BA matches ORB-SLAM2 (0.72/0.22). The full system runs at ~10 fps and produces complete object reconstructions from monocular input on Freiburg Cars and Redwood-OS chairs.

## Why it matters for SLAM

DSP-SLAM was the first SLAM system to integrate learned implicit shape priors for online object reconstruction, updating the SLAM++ vision — maps made of objects, not raw geometry — for the deep learning era: instead of a database of scanned CAD models, a latent shape space covers a whole category. Its second-order optimization through a neural SDF showed that deep shape fitting can live inside a real-time loop, and it is a key stepping stone between classical object-level SLAM (SLAM++, Fusion++, NodeSLAM) and later neural-field object mapping (vMAP) — a good template whenever you need semantically meaningful, complete object models rather than surfel soup.

## Related

- [SLAM++](slampp.md) — the original object-oriented SLAM with a CAD model database
- [Fusion++](fusionpp.md) — per-object TSDFs without shape priors
- [MoreFusion](morefusion.md) — object-level fusion with pose estimation for manipulation
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md) — the underlying SLAM backbone
- [NodeSLAM](../level-05-deep-learning/nodeslam.md) — shape-prior SLAM from dense depth, the closest contemporary
- [vMAP](../level-03-monocular-slam/vmap.md) — per-object neural fields as the next step
