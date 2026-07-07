# FAST-LIO2

> Xu 2022 · [Paper](https://arxiv.org/abs/2107.06829)

**One-line summary** — FAST-LIO2 showed that registering raw LiDAR points directly to the map inside a tightly-coupled iterated Kalman filter — with an incremental k-d tree (ikd-Tree) as the map — is faster *and* more accurate than feature-based LiDAR-inertial odometry.

## Problem

Feature-based LiDAR pipelines discard most of each scan during edge/planar extraction, throwing away subtle environmental structure and failing where distinct features are scarce — a situation worsened by the small fields of view of emerging solid-state LiDARs. Feature extractors also vary with the scanning pattern (spinning, prism, MEMS), so each new sensor requires hand-engineering. Registering *all* raw points instead demands a large dense map supporting efficient kNN queries *and* real-time incremental updates — the actual bottleneck FAST-LIO2 set out to remove.

## Method & architecture

Raw points are accumulated into scans (10–100 ms), registered to a large local map via an iterated Kalman filter, and immediately merged into the map — odometry and mapping run at the same rate.

- **State on manifold**: $\mathcal{M} \triangleq SO(3) \times \mathbb{R}^{15} \times SO(3) \times \mathbb{R}^3$ (dim 24) with $\mathbf{x} = [{}^{G}\mathbf{R}_I,\ {}^{G}\mathbf{p}_I,\ {}^{G}\mathbf{v}_I,\ \mathbf{b}_{\omega},\ \mathbf{b}_{a},\ {}^{G}\mathbf{g},\ {}^{I}\mathbf{R}_L,\ {}^{I}\mathbf{p}_L]$ — pose, velocity, IMU biases, gravity, and *online-calibrated* LiDAR-IMU extrinsics. Discrete propagation per IMU sample: $\mathbf{x}_{i+1} = \mathbf{x}_i \boxplus \left(\Delta t\, \mathbf{f}(\mathbf{x}_i, \mathbf{u}_i, \mathbf{w}_i)\right)$.
- **Back-propagation de-skew**: IMU measurements estimate the LiDAR pose at every point's individual sampling time, projecting all points to the scan-end time before the update.
- **Direct point-to-plane measurement model**: each measured point, projected to the global frame, must lie on a small plane fitted to its 5 nearest map neighbors:

  $$\mathbf{0} = {}^{G}\mathbf{u}_j^{\top}\left({}^{G}\mathbf{T}_{I_k}\, {}^{I}\mathbf{T}_{L}\left({}^{L}\mathbf{p}_j + {}^{L}\mathbf{n}_j\right) - {}^{G}\mathbf{q}_j\right),$$

  where ${}^{G}\mathbf{u}_j$ is the plane normal, ${}^{G}\mathbf{q}_j$ a point on it, and ${}^{L}\mathbf{n}_j$ the measurement noise. No feature extraction — subtle structure is exploited, and any scanning pattern works.
- **Iterated on-manifold update**: linearizing at the current iterate gives residuals $\mathbf{z}_j^{\kappa}$, and the MAP problem

  $$\min_{\widetilde{\mathbf{x}}_k^{\kappa}} \left( \lVert \mathbf{x}_k \boxminus \widehat{\mathbf{x}}_k \rVert_{\widehat{\mathbf{P}}_k}^2 + \sum_{j=1}^{m} \lVert \mathbf{z}_j^{\kappa} + \mathbf{H}_j^{\kappa}\widetilde{\mathbf{x}}_k^{\kappa} \rVert_{\mathbf{R}_j}^2 \right)$$

  is solved by an iterated Kalman filter with the gain $\mathbf{K} = (\mathbf{H}^{\top}\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^{\top}\mathbf{R}^{-1}$ — inverting a matrix of *state* dimension (24) instead of measurement dimension (thousands of points), the trick that makes direct registration tractable. Iteration until $\lVert \widehat{\mathbf{x}}_k^{\kappa+1} \boxminus \widehat{\mathbf{x}}_k^{\kappa} \rVert < \epsilon$ handles linearization error under fast motion.
- **ikd-Tree mapping**: the optimized scan is inserted into an incremental k-d tree supporting point insertion with *on-tree downsampling*, box-wise delete via lazy labels, and scapegoat-style partial re-balancing run in a parallel thread — no full rebuild, no intermittent delay. The map covers a length-$L$ cube (default 1000 m) that slides whenever the LiDAR's detection ball touches its boundary, deleting exiting points box-wise.

## Results

- **Accuracy**: on 19 sequences from five open datasets (lili, liosam, utbm, ulhk, nclt — solid-state and spinning LiDARs), FAST-LIO2 or a variant is best in 18 of 19. Example RMSE: liosam_1 4.58 m vs LIO-SAM 4.75 m, LILI-OM 18.78 m, LINS 880.92 m; the sole exception is ulhk_4 where LILI-OM edges it 2.29 m vs 2.57 m. The direct method beats the feature-based variant of the same system in most sequences.
- **Speed**: on a DJI Manifold 2-C (i7-8550U) it is about ×8 faster than LILI-OM, ×10 faster than LIO-SAM, and ×6 faster than LINS in total per-scan processing; it also achieves 10 Hz real time on an ARM Khadas VIM3 — not previously demonstrated by any LIO system.
- **ikd-Tree**: benchmarked on 18 sequences against octree, R\*-tree, and nanoflann k-d tree, it achieves the best overall performance for incremental updates plus kNN search.
- **Robustness**: a quadrotor flip experiment reaches 1198 °/s peak angular velocity with 2.01 ms average per-scan processing at 100 Hz odometry; a fast handheld run (up to 7 m/s) closes an 81 m loop with < 0.06 m end-to-end error.

## Why it matters for SLAM

FAST-LIO2 flipped the field's default from "extract features, then register" to "register everything, fast." Its ikd-Tree became a widely reused open-source component, and its iEKF-on-manifold formulation is the reference design for filter-based LiDAR-inertial odometry. It is also the foundation of the HKU MARS ecosystem — R3LIVE and FAST-LIVO/FAST-LIVO2 build their visual fusion on this LIO core — and it is the pragmatic first choice today for pure LiDAR-inertial odometry, especially on cheap solid-state sensors.

## Hands-on

- [Run FAST-LIO2](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/fast_lio2)

## Related

- [LOAM](loam.md) — the feature-based paradigm it displaced
- [LIO-SAM](lio-sam.md) — the factor-graph alternative with loop closure and GPS
- [FAST-LIVO](fast-livo.md) — adds direct visual fusion on the same map
- [R3LIVE](r3live.md) — uses FAST-LIO as its geometric backbone
- [PIN-SLAM](pin-slam.md) — neural-map successor to direct LiDAR registration
