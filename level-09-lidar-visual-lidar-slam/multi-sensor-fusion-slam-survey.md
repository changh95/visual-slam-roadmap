# Multi-Sensor Fusion SLAM Survey

> Zhu 2024 · [Paper](https://www.sciopen.com/article/10.26599/TST.2023.9010010)

**One-line summary** — A comprehensive survey of SLAM systems that fuse camera, LiDAR, and IMU, organizing the last decade of multi-sensor fusion literature into four sensor-combination categories, each split by coupling depth and estimator type.

## Problem

No stand-alone sensor meets the demands of robust, long-term localization: GNSS is unavailable or inaccurate in tunnels, caves, and urban canyons; a low-cost IMU drifts because its measurements are corrupted by noise and bias; a monocular camera suffers from scale drift and is sensitive to illumination change and texture deficiency; LiDAR fails in structure-less environments (long corridors, wide-open spaces) and degenerate geometries. Multi-sensor fusion compensates these deficiencies with complementary sensing — but by 2022 the literature had exploded across visual-inertial, LiDAR-inertial, and LiDAR-visual lines with few surveys covering the full camera+LiDAR+IMU picture. This paper provides that concise-but-complete map.

## Method & architecture

The survey first grounds the reader in the two dominant **state estimator formations**:

- **Kalman-filter family**: KF for linear-Gaussian systems, then EKF (linearized Jacobians), IEKF (re-linearize iteratively at the updated operating point), and the error-state KF (ESKF), which splits the true state as $x_t = x + \delta x$ — high-frequency IMU data is integrated into the nominal state $x$ while noise and model imperfections accumulate in the error state $\delta x$ that the filter estimates.
- **Sliding-window optimization**: over a window of $n$ states $X$, minimize

$$\min_{X}\ \left\{ \left\| r_p(X) \right\|^2 + \sum_{k \in I} \left\| r_I(k, X) \right\|_{P_k^I}^2 + \sum_{k \in A} \left\| r_A(k, X) \right\|_{P_k^A}^2 \right\}$$

where $r_I$ are IMU residuals (relative-motion constraints via preintegration, avoiding re-propagation each iteration), $r_A$ are visual or LiDAR geometric residuals, $P$ their covariances, and $r_p$ the prior from marginalization — which bounds computation without substantial information loss.

It then reviews **four fusion categories**, each with representative systems (its Table 1):

- **Visual-inertial**: filtering-based (MSCKF's structureless nullspace trick; MSCKF 2.0 fixing observability-mismatch inconsistency with first-estimate Jacobians; ROVIO) vs. optimization-based (OKVIS's keyframe fixed-lag smoothing; VINS-Mono's five-block pipeline with initialization, relocalization, and pose-graph optimization), plus the maturation of IMU preintegration (Lupton/Shen/Forster).
- **LiDAR-inertial**: loosely coupled (LOAM-derived odometry with IMU distortion compensation; LION with a condition-number observability metric) vs. tightly coupled (LIOM's sliding window, LINS's robocentric iterated ESKF, LIO-SAM's factor graph, LILI-OM for solid-state LiDAR, FAST-LIO2's direct raw-point registration into an incremental k-d tree, Faster-LIO's incremental voxels).
- **Visual-LiDAR**: loosely coupled depth-enhancement of visual odometry (DEMO's spherical k-d-tree depth association, DVL-SLAM projecting LiDAR points into DSO's photometric framework, LIMO with learned dynamic-object removal) vs. tightly coupled joint optimization (V-LOAM's sequential undistort-then-register; TVL-SLAM keeping visual and LiDAR residuals independent in the front-end but jointly optimized, with online camera-LiDAR extrinsics).
- **LiDAR-visual-inertial (LVI)**: loosely coupled (VIL-SLAM) vs. tightly coupled — LIC-Fusion 2.0 (MSCKF with sliding-window planar-feature tracking), Super Odometry (IMU-centric: VIO and LIO constrain IMU bias, IMU predicts for both), LVI-SAM (VINS-Mono + LIO-SAM subsystems on one factor graph, LiDAR depth for visual features, VIS-proposed/LIS-refined loop closures), R3LIVE and FAST-LIVO (error-state iterated KF fusing point-to-plane, photometric/reprojection, and IMU terms).

Finally it distills the open **challenges**: sensor-to-sensor calibration (marker-based vs. mutual-information and on-the-fly methods), efficient data association, reliable initialization (SfM-aligned vs. closed-form), and dynamic environments — and proposes future directions: versatile platform-agnostic fusion frameworks, deep-learning-aided modules, and distributed cooperative multi-robot fusion.

## Results

As a survey there are no new experiments; its contribution is the taxonomy and the systematic comparison. Its Table 1 classifies about 20 SOTA systems (2013–2022) along four axes — fusion type, coupling (loose/tight), loop-closure mechanism, sensor types (monocular camera, mechanical vs. solid-state LiDAR, RGB-D), and fusion strategy (MSCKF, EKF/iterated-ESKF, sliding-window, factor-graph, pose-graph, BA). The recurring empirical verdict it reports from the literature: loosely-coupled methods win on simplicity, extendibility, and computational cost; tightly-coupled methods win on accuracy and robustness. Published in Tsinghua Science and Technology 29(2):415–429 (2024), open access; see paper for full per-system discussion.

## Why it matters for SLAM

After reading the individual papers in this level, a survey like this is how you consolidate: it places each system in a common taxonomy, summarizes the trade-offs (accuracy vs. compute, robustness vs. complexity), and traces the lineages (LOAM to LIO-SAM to LVI-SAM; FAST-LIO2 to FAST-LIVO/R3LIVE). It is also a practical shortcut when selecting a fusion architecture for a new platform — the design axes it lays out (sensor set, coupling depth, filter vs. smoother) are exactly the decisions you must make, and its challenge list (calibration, initialization, dynamics) is a checklist for deployment.

## Related

- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the core fusion concept the survey covers
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — the key architectural axis
- [LVI-SAM](lvi-sam.md) — representative optimization-based LVI system
- [FAST-LIVO2](fast-livo2.md) — representative filter-based direct LVI system
- [VINS-Mono](../level-06-vio-vins/vins-mono.md) — the visual-inertial foundation the survey builds from
- [Degradation handling](degradation-handling.md) — the robustness motivation behind fusion
