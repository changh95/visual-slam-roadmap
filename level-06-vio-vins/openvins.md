# OpenVINS

> Geneva 2020 · [Paper](https://docs.openvins.com/)

**One-line summary** — OpenVINS is an open-source, modular MSCKF-based VIO research platform from the University of Delaware that packages an on-manifold sliding-window Kalman filter with FEJ consistency, online camera intrinsic/extrinsic and time-offset calibration, a full visual-inertial simulator, and evaluation tooling — becoming the de-facto standard MSCKF implementation.

## Problem

Despite MSCKF's influence since 2007, no authoritative, documented open-source implementation existed, which made reproducing results and comparing filter-based against optimization-based VIO genuinely difficult; existing codebases had hard-coded assumptions and lacked evaluation tools. Real deployments additionally require online calibration of the camera-IMU extrinsics, camera intrinsics, and the time offset between camera and IMU clocks, and EKF inconsistency (spurious information gain along unobservable directions) was well understood in theory but rarely addressed in released code.

## Method & architecture

- **State.** The filter estimates the current inertial state, $c$ historical IMU pose clones, $m$ landmarks, and per-camera calibration plus a time offset (Eqs. 1–5):
$$
\mathbf{x}_k = \begin{bmatrix} \mathbf{x}_I^\top & \mathbf{x}_C^\top & \mathbf{x}_M^\top & \mathbf{x}_W^\top & {}^Ct_I \end{bmatrix}^\top, \qquad
\mathbf{x}_I = \begin{bmatrix} {}^{I_k}_G\bar{q}^\top & {}^G\mathbf{p}_{I_k}^\top & {}^G\mathbf{v}_{I_k}^\top & \mathbf{b}_{\omega}^\top & \mathbf{b}_{a}^\top \end{bmatrix}^\top,
$$
  where $\mathbf{x}_C$ stacks the clone poses, $\mathbf{x}_M$ the landmarks (global 3D, full inverse depth, or anchored representations), and $\mathbf{x}_W$ each camera's intrinsics $\zeta$ and IMU-camera extrinsics. The inertial state lives on $\mathcal{M} = \mathbb{H} \times \mathbb{R}^{12}$ (15 DoF) with a quaternion boxplus $\bar q \boxplus \delta\boldsymbol{\theta} \simeq \begin{bmatrix} \tfrac{1}{2}\delta\boldsymbol{\theta} \\ 1 \end{bmatrix} \otimes \bar q$.
- **Propagate / update on the manifold.** IMU kinematics propagate mean and covariance, $\mathbf{P}_{k|k-1} = \boldsymbol{\Phi}_{k-1}\mathbf{P}_{k-1|k-1}\boldsymbol{\Phi}_{k-1}^\top + \mathbf{Q}_{k-1}$; clones, landmarks, and calibration states are static, so their Jacobian blocks stay identity (sparsity exploited). Measurements $\mathbf{z}_{m,k} = h(\mathbf{x}_k) + \mathbf{n}_{m,k}$ are linearized w.r.t. the zero-mean error state and updated on-manifold:
  $$\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} \boxplus \mathbf{K}_k\big(\mathbf{z}_{m,k} - h(\hat{\mathbf{x}}_{k|k-1})\big), \qquad \mathbf{K}_k = \mathbf{P}_{k|k-1}\mathbf{H}_k^\top\big(\mathbf{H}_k\mathbf{P}_{k|k-1}\mathbf{H}_k^\top + \mathbf{R}_{m,k}\big)^{-1}.$$
  Landmark updates use the standard MSCKF stochastic-clone model with nested measurement functions covering different feature parameterizations and camera models; First-Estimate Jacobians keep the filter from gaining information along the unobservable directions.
- **Online spatiotemporal calibration.** Extra Jacobians w.r.t. intrinsics $\zeta$ and extrinsics $\{{}^C_I\mathbf{R}, {}^C\mathbf{p}_I\}$ calibrate them in-filter; the camera and IMU clocks are related by ${}^It = {}^Ct + {}^Ct_I$ with the offset ${}^Ct_I$ estimated online.
- **Type-based index system.** Each state "type" (its estimate, error-state size, covariance index, and boxplus update) is managed automatically through initialization/cloning/marginalization, so users write sparse Jacobians only over the variables a measurement touches. New variables (e.g. SLAM landmarks) are initialized optimally by QR-separating (Givens rotations) the linearized system into a subsystem that depends on the new state and one that does not.
- **Research infrastructure.** ov_core (KLT-style sparse tracking, triangulation, manifold math), ov_eval (trajectory alignment, ATE/RPE/NEES tooling), ov_msckf (the estimator), plus an SE(3) B-spline-based visual-inertial simulator generating IMU and bearing measurements for arbitrary camera rigs, and documentation with full derivations.

## Results

In 20-run Monte-Carlo simulation (mono camera 10 Hz, IMU 400 Hz with ADIS16448 noise, window size 11, up to 100 tracks/frame and 50 SLAM landmarks, 1 px noise): with online calibration enabled, ATE with *bad* initial calibration is 0.218°/0.139 m — essentially matching the 0.212°/0.134 m obtained with true calibration, with consistent NEES (~2); with calibration disabled and bad guesses, ATE explodes to 5.432°/508.7 m and NEES diverges. Calibration parameters converge rapidly from poor initial guesses. On the EuRoC MAV Vicon-room sequences (10 runs each, V2_03 excluded), monocular OpenVINS-SLAM averages **1.445°/0.079 m ATE** — the best of the compared monocular systems — vs. OKVIS 1.911°/0.154 m, ROVIO (maplab) 2.054°/0.140 m, R-VIO 1.693°/0.149 m, and VINS-Fusion VIO 2.926°/0.104 m; the stereo variants are similarly competitive against Basalt, ICE-BA, and S-MSCKF.

## Why it matters for SLAM

OpenVINS turned the filter-based lineage (MSCKF, FEJ/observability-constrained EKF work) into an accessible, documented codebase — the standard open MSCKF referenced across the VIO literature, and the foundation for follow-on research on multi-camera, multi-IMU, and Schmidt-filter SLAM. It made FEJ-based observability enforcement and online spatiotemporal calibration the expected defaults in EKF-based VIO, and its simulator and evaluation toolbox significantly lowered the barrier to entry for VIO research. If you want to learn how a production-quality EKF-based VIO works — or need a lightweight estimator for a compute-constrained robot — this is the reference system to study.

## Related

- [MSCKF](msckf.md)
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md)
- [ROVIO](rovio.md)
- [Observability](observability.md)
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md)
- [IMU noise model](imu-noise-model.md)
