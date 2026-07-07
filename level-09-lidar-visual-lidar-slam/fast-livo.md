# FAST-LIVO

> Zheng 2022 · [Paper](https://arxiv.org/abs/2203.00893)

**One-line summary** — FAST-LIVO unified direct LiDAR-inertial and direct visual odometry in a single ESIKF by attaching image patches to LiDAR map points, removing feature extraction from both modalities.

## Problem

Existing LVI systems (R2LIVE, LVI-SAM) run feature-based frontends — corner extraction and sliding-window optimization on the visual side, edge/plane extraction on the LiDAR side — which cost significant computation and fail where salient features are scarce. FAST-LIVO asks whether the direct philosophy that FAST-LIO2 brought to LiDAR extends to the camera, and whether both sensors can share one map instead of separate visual and LiDAR representations.

## Method & architecture

One error-state iterated Kalman filter (ESIKF) over the 18-dimensional manifold state $\mathbf{x} = [{^G}\mathbf{R}_I^T\ {^G}\mathbf{p}_I^T\ {^G}\mathbf{v}^T\ \mathbf{b_g}^T\ \mathbf{b_a}^T\ {^G}\mathbf{g}^T]^T \in SO(3)\times\mathbb{R}^{15}$, with IMU forward propagation between measurements and backward propagation to de-skew each LiDAR scan.

- **LIO subsystem** (adapted from FAST-LIO2): raw scan points — no edge/plane features — are registered frame-to-map with point-to-plane residuals

$$\mathbf{r}_l(\mathbf{x}_k, {^L}\mathbf{p}_j) = \mathbf{u}_j^T\big({^G}\mathbf{T}_{I_k}\,{^I}\mathbf{T}_L\,{^L}\mathbf{p}_j - \mathbf{q}_j\big),$$

  where $\mathbf{u}_j, \mathbf{q}_j$ are the normal and center of a plane fit to the 5 nearest map points found in an incremental k-d tree (ikd-Tree).
- **VIO subsystem** (sparse-direct, frame-to-map): map points ${^G}\mathbf{p}_i$ carry patch pyramids from previous observing images; the reference patch $\mathbf{Q}_i$ is the one with the closest observation angle, and alignment minimizes the photometric residual

$$\mathbf{r}_c(\mathbf{x}_k, {^G}\mathbf{p}_i) = \mathbf{I}_k\big(\boldsymbol{\pi}({^I}\mathbf{T}_C^{-1}\,{^G}\mathbf{T}_{I_k}^{-1}\,{^G}\mathbf{p}_i)\big) - \mathbf{A}_i\mathbf{Q}_i$$

  ($\mathbf{A}_i$ an affine warp, $\boldsymbol{\pi}$ the pinhole projection), optimized coarse-to-fine over three pyramid levels. No ORB/FAST corners, no triangulation, no depth filters.
- **One MAP problem per measurement**: whichever sensor's data arrives at $t_k$ triggers an iterated update of $\min_{\mathbf{x}_k} \big( \|\mathbf{x}_k \boxminus \hat{\mathbf{x}}_k\|^2_{\hat{\mathbf{P}}_k} + \sum_j \|\mathbf{r}_l\|^2_{\boldsymbol{\Sigma}_l} + \sum_i \|\mathbf{r}_c\|^2_{\boldsymbol{\Sigma}_c} \big)$ — LiDAR scans fuse only $\mathbf{r}_l$, images only $\mathbf{r}_c$, both against the same state and covariance (equivalent to Gauss-Newton).
- **Shared map**: the LiDAR global map is the ikd-Tree of all points; the visual global map holds LiDAR points plus their patch pyramids in hash-indexed voxels. The visual submap is fetched by polling the voxels hit by the most recent scan.
- **Outlier rejection**: submap points are projected with the predicted pose, only the lowest-depth point per 40×40-pixel grid is kept, and points occluded by current-scan points within a 9×9 neighborhood are rejected — removing edge and occluded points that would corrupt photometric alignment.
- **Map update**: after alignment, points with high photometric error get a new 8×8 patch if >20 frames or >40 pixels have passed since the last one; new map points are the highest-gradient projected LiDAR points per 40×40 grid, skipping high-curvature edge points.

## Results

- **NTU-VIRAL benchmark** (9 UAV sequences, Ouster OS1-16 + camera + IMU): FAST-LIVO achieves the best absolute translational RMSE on 8 of 9 sequences — e.g. eee_01: 0.28 m vs 0.54 m (FAST-LIO2), 0.45 m (R2LIVE), 2.88 m (DVL-SLAM, loop closure removed), SVO2.0 fails; nya_01: 0.19 m. Only on sbs_01 (0.29 m vs FAST-LIO2's 0.25 m) does severe motion blur make the images unhelpful.
- **LiDAR-degenerate wall** (facing a ~30 m wall): FAST-LIO2 drifts along the unconstrained direction and SVO2.0 drifts on the repetitive texture; FAST-LIVO achieves the lowest end-to-end drift of 0.05 m.
- **Visual challenge sequence** (indoor-outdoor transitions, two aggressive motions, texture-less white wall): survives with 0.04 m end-to-end error over a 79.52 m path.
- **Runtime**: total 36.75 ms per LiDAR+image frame vs R2LIVE's 45.16 ms frontend + 59.27 ms sliding-window backend; the VIO subsystem takes 10.23 ms on an Intel i7 and 13.82 ms on ARM (Qualcomm RB5) — real time on both, with hard-synchronized Livox Avia + camera hardware also open-sourced.

## Why it matters for SLAM

FAST-LIVO is the proof that the "direct" philosophy extends cleanly from LiDAR to the visual modality — one shared map, one filter, no feature frontends. LiDAR supplies exact depth for every visual anchor, so vision contributes pose constraints at almost no extra cost. This architectural economy (versus LVI-SAM's two feature pipelines, or R3LIVE's coloring-only VIO) made it the template for high-rate LVI odometry on small onboard computers, and it leads directly to FAST-LIVO2.

## Related

- [FAST-LIO2](fast-lio2.md) — the direct LIO foundation and ikd-Tree map
- [FAST-LIVO2](fast-livo2.md) — the refined successor with sequential ESIKF updates
- [R3LIVE](r3live.md) — sibling system with a map-coloring VIO philosophy
- [SVO](../level-03-monocular-slam/svo.md) — the sparse-direct visual alignment idea it builds on
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the concept this system defines
- [LVI-SAM](lvi-sam.md) — the feature-based, factor-graph alternative
