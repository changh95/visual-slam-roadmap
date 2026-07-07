# LVI-SAM

> Shan 2021 · [Paper](https://arxiv.org/abs/2104.10831)

**One-line summary** — LVI-SAM tightly couples a VINS-Mono-style visual-inertial subsystem with a LIO-SAM-style LiDAR-inertial subsystem atop a shared factor graph, with each subsystem bootstrapping and rescuing the other.

## Problem

LiDAR-based methods capture fine environmental detail at long range but typically fail in structure-less environments such as a long corridor or a flat open field; vision-based methods excel at place recognition and texture-rich scenes but are sensitive to illumination change, rapid motion, and initialization. Coupling each with an IMU helps, but neither pair alone is robust across real deployments. LVI-SAM fuses all three sensors in one framework that keeps functioning when either the visual or the LiDAR half degrades.

## Method & architecture

Two sub-systems share one factor graph, optimized with iSAM2:

- **Visual-inertial system (VIS)**, adapted from VINS-Mono: Shi-Tomasi corners tracked by KLT, with sliding-window bundle adjustment over states $\mathbf{x} = [\,\mathbf{R},\ \mathbf{p},\ \mathbf{v},\ \mathbf{b}\,]$, where $\mathbf{R} \in SO(3)$ is rotation, $\mathbf{p} \in \mathbb{R}^3$ position, $\mathbf{v}$ velocity, and $\mathbf{b} = [\,\mathbf{b}_a, \mathbf{b}_w\,]$ the accelerometer/gyro biases; the body-to-world transform is $\mathbf{T} = [\mathbf{R}\,|\,\mathbf{p}] \in SE(3)$.
- **LiDAR-inertial system (LIS)**, adapted from LIO-SAM: after IMU de-skewing, edge and planar features are matched to a feature map kept in a sliding window of keyframes; a new keyframe (graph node) is added when the pose change exceeds a threshold. Four factor types are jointly optimized: IMU preintegration, visual odometry, lidar odometry, and loop closure.

Cross-system aiding is the core design:

- **Initialization**: VINS-Mono-style initialization often fails at small or constant velocity (scale unobservable without acceleration excitation), so the LIS — where depth is directly observable — initializes first and hands its estimated $\mathbf{x}$ and $\mathbf{b}$ to the VIS as initial guesses.
- **Feature depth from LiDAR**: several LiDAR frames are stacked into a dense depth map; features and depth points are projected onto a unit sphere around the camera, the three nearest depth points are found via a 2-D K-D tree in polar coordinates, and feature depth is the length of the ray from the camera center to its intersection with the plane of those three points. If the maximum distance among the three points exceeds 2 m (depth ambiguity from stacking), no depth is associated.
- **Initial guess for scan-matching**: visual-inertial odometry seeds LiDAR scan-matching; before LIS initialization, raw IMU integration suffices for initial linear velocity below 10 m/s and angular velocity below 180°/s.
- **Failure detection**: the VIS reports failure when tracked features drop below a threshold or the estimated IMU bias exceeds a threshold, then re-initializes; the LIS treats scan-matching as iteratively solving $\min_{\mathbf{T}} \|\mathbb{A}\mathbf{T} - \mathbf{b}\|^2$ and reports failure when the smallest eigenvalue of $\mathbb{A}^{\mathsf{T}}\mathbb{A}$ is below a threshold, in which case no lidar factor is added.
- **Two-stage loop closure**: DBoW2 with BRIEF descriptors proposes candidates in the VIS; the LIS refines them by scan-matching before the constraint enters the graph.

## Results

Evaluated on three self-gathered datasets (*Urban*, *Jackal*, *Handheld*) with a Velodyne VLP-16, FLIR camera, MicroStrain 3DM-GX5-25 IMU, and RTK GPS ground truth, against VINS-Mono, LOAM, LIO-mapping, LINS, and LIO-SAM on an Intel i7-10710U laptop.

- **Urban ablation** (end-to-end error): VIS-only 239.19 m → 142.12 m with LiDAR depth; LIS-only 290.43 m (diverges in degraded spots); full LVIO without loop closure 45.42 m → 32.18 m with depth (29% reduction); all modules enabled: 0.28 m translation, 5.77° rotation.
- **Jackal (UGV)**: LVI-SAM w/ loop achieves the best RMSE w.r.t. GPS of 0.67 m (vs 1.52 m LIO-SAM, 0.77 m LINS, 4.49 m VINS-Mono) and the best end-to-end rotation error of 1.52°.
- **Handheld** (crossing an open baseball field): all lidar-based methods fail outright; LVI-SAM completes the run with 0.83 m RMSE and 0.27 m end-to-end translation error w/ loop closure (vs 73.07 m RMSE for VINS-Mono w/ loop).

## Why it matters for SLAM

LVI-SAM is the canonical factor-graph realization of LiDAR-visual-inertial fusion, and the clearest illustration of *bidirectional* sensor aiding: depth flows from LiDAR to camera, initialization and initial guesses flow in both directions. Built by the LIO-SAM authors as its natural extension, it became the standard open-source LVI baseline that direct, filter-based competitors (R3LIVE, FAST-LIVO) measure themselves against, and the go-to case study for degradation handling in triple fusion.

## Related

- [LIO-SAM](lio-sam.md) — the LiDAR-inertial subsystem and factor-graph backbone
- [VINS-Mono](../level-06-vio-vins/vins-mono.md) — the design basis of the visual-inertial subsystem
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the fusion concept it exemplifies
- [Degradation handling](degradation-handling.md) — its cross-subsystem fallback behavior
- [FAST-LIVO](fast-livo.md) — the direct, filter-based alternative
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — the architectural principle it realizes with a factor graph
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — one of the four factor types in its graph
