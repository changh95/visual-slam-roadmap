# AMB3R

> Wang 2025 · [Paper](https://arxiv.org/abs/2511.20343)

**One-line summary** — A feed-forward 3D reconstruction model in the DUSt3R/VGGT lineage that adds a metric-scale head and a sparse volumetric backend to frozen VGGT, so one network serves multi-view reconstruction, uncalibrated visual odometry, and large-scale SfM — without fine-tuning or test-time optimization.

## Problem

Pointmap models (DUSt3R, MASt3R, VGGT) regress per-pixel 3D geometry, but the network operates on 2D grids: nothing enforces *spatial compactness* — the property (shared by TSDFs, feature grids, coordinate networks) that one 3D location has one value, which is what fuses multiple observations of the same point into coherent geometry. Pointmap predictions of overlapping pixels are only implicitly encouraged to agree. Two further gaps separate these models from a deployable SfM/SLAM engine: predictions are normalized rather than metric-scale, and prior systems needed optimization-based backends (e.g. VGGT-SLAM's SL(4) factor graph) or task-specific tuning to run as VO/SfM. AMB3R ("Accurate feed-forward Metric-scale 3D reconstruction with Backend") targets all three inside one model.

## Method & architecture

- **Front-end**: frozen VGGT predicts pointmaps $P_t^{(1)}$ (in the first frame's coordinates), depths, cameras, and confidences from images $\{I_t\}_{t=1}^{T}$.
- **Metric-scale head**: rather than regressing a global scale (unstable — it varies with frame combination and order), a lightweight head regresses, per frame, the metric log-depth of the pixel with median predicted depth from encoder + depth-branch features; the median across frames aligns the reconstruction to metric space. Trained with an L1 loss.
- **Sparse volumetric backend**: predicted points and geometric features are pooled into a sparse voxel grid $\mathcal{V}$ (voxel size 0.01 in normalized space, so resolution adapts to scene scale):
  $$H_i = \frac{1}{|\mathcal{P}_i|} \sum_{(t,\mathbf{u}) \in \mathcal{P}_i} G_t[\mathbf{u}], \qquad \{\hat{H}_i\}_{i=1}^{N} = (\mathcal{S}^{-1} \circ f_{\theta} \circ \mathcal{S})\left(\{H_i\}_{i=1}^{N}\right),$$
  where $\mathcal{P}_i$ collects pixels whose 3D points fall in voxel $\mathcal{V}_i$, $\mathcal{S}$ serializes voxels into a 1D sequence via space-filling (Hilbert) curves, and $f_{\theta}$ is a Point Transformer v3. KNN interpolation maps voxel features back to pixels, and they are injected into the frozen decoder through zero-convolutions (ControlNet-style), reusing VGGT's learned attention and confidence. Training the backend + scale head costs only ~80 H100 GPU hours ($\mathcal{L} = \mathcal{L}_{\mathrm{depth}} + \mathcal{L}_{\mathrm{pointmap}} + \mathcal{L}_{\mathrm{camera}}$, with ROE scale alignment before supervision).
- **Uncalibrated VO, no optimization backend**: because pointmap predictions are always expressed in the first (reference) frame up to a median scale, no Sim(3)/SL(4) alignment is needed. Selected keyframes act as memory for each new window of $N_w = 8$ frames; keyframes are chosen by pose distance
  $$D_{i,j} = \arccos\left(\frac{\operatorname{Tr}(R_j R_i^{T}) - 1}{2}\right) + \lambda \lVert \tau'_i - \tau'_j \rVert_2,$$
  with a minimum spacing $\eta_d = 0.15$. The new window's scale is $s^w = \mathrm{ROE}(P_k^{(1)}, P_k^{(1),w})$ from a shared keyframe, and predictions are fused into the map by confidence-weighted running averages of points, scales, translations, and slerped quaternions, e.g. $P_k \leftarrow (C_k P_k + C_k^w s^w P_k^w)/(C_k + C_k^w)$. Active keyframes are resampled (max 10 → 7) with a backward search window that re-uses old keyframes to implicitly close loops.
- **Feed-forward SfM**: divide-and-conquer — feature-based image clustering (FPS on whitened descriptors), coarse incremental registration cluster-by-cluster, then confidence-prioritized BFS refinement over the keyframe graph. No bundle adjustment anywhere.

## Results

Evaluated over 7 tasks on 13 datasets (all distances in cm; ATE RMSE via evo):

- **VO on TUM RGB**: average ATE **3.2** (all frames) / 2.7 (keyframes) vs previous uncalibrated SOTA MUSt3R 7.1 — and on **ETH3D SLAM**: **2.6** vs MUSt3R's 11.2. First feed-forward VO to surpass optimization-based counterparts (DROID-VO 11.4, GlORIE-VO 9.3 on TUM).
- **SLAM comparison on TUM** (keyframe protocol, baselines allowed loop closure + global BA): AMB3R 2.7 beats uncalibrated VGGT-SLAM (5.3) and MASt3R-SLAM (6.0), and even *calibrated* MASt3R-SLAM (3.0) — with no trajectory post-processing.
- **7-Scenes**: 2.1 average ATE, lower than the dataset's own KinectFusion pseudo-ground-truth (5.7) as validated by novel-view-synthesis PSNR.
- **Multi-view depth (RMVDB)**: average rel 1.7 / $\delta_{1.03}$ 87.3 — new SOTA, ahead of VGGT (2.4 / 81.3) and concurrent $\pi^3$ (1.8 / 85.6), and better than pose-given MVSA (2.7 / 77.0).
- **3D reconstruction**: best rel/accuracy/completeness on ETH3D (4.64/9.98/9.69), DTU (0.81/0.22/0.08 — millimeter object accuracy), and 7-Scenes (4.74/1.74/2.84).
- **SfM on ETH3D**: RRA@5 **98.2** / RTA@5 81.9 average vs MASt3R-SfM's 81.2/79.7, without any optimization-based BA.
- Also: camera pose AUC@30 on RealEstate10K 86.3 (VGGT 85.3); zero-shot monocular depth SOTA on NYUv2 (rel 3.0) and ETH3D (3.2); competitive dynamic-scene VO on TUM Dynamic (avg 1.9) approaching MegaSaM despite no dynamic training. Code, weights, and an evaluation toolkit are open-sourced.

## Why it matters for SLAM

The pointmap line is progressively absorbing the classical SfM/SLAM stack, and AMB3R marks a threshold: an uncalibrated, feed-forward system beating calibrated optimization-based SLAM on TUM. Its two ideas matter independently — metric scale recovered from frozen features attacks monocular scale ambiguity without IMU or stereo, and the compact 3D backend restores the spatial-compactness prior that pointmap regression lost, at academic-scale training cost. Its remaining limits (no explicit loop closure or relocalization, quadratic attention cost in view count, reliance on the reference-frame prior) sketch exactly where optimization backends still earn their keep.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [VGGT](vggt.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [VGGT-SLAM](vggt-slam.md) — the optimization-backend alternative AMB3R argues is unnecessary
- [COLMAP](colmap.md)
- [Scale ambiguity](scale-ambiguity.md)
