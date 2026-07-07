# ROVIO

> Bloesch 2015 · [Paper](https://github.com/ethz-asl/rovio)

**One-line summary** — ROVIO (Robust Visual Inertial Odometry) is a tightly-coupled monocular VIO that feeds direct pixel-intensity errors of multilevel image patches straight into an EKF as innovation terms, on a fully robocentric state with bearing-vector/inverse-distance landmarks — yielding a "power-up-and-go" estimator that needs no initialization procedure.

## Problem

Feature-based VIO systems (MSCKF, OKVIS) depend on descriptor extraction and matching, which breaks down in low-texture environments and under fast-motion blur. Independently, the standard world-centric EKF keeps globally unobservable quantities (absolute position, yaw) in its state, causing gauge-freedom and consistency issues. ROVIO attacks both: photometric patch errors replace the feature-matching pipeline, and a robocentric formulation with minimal on-manifold landmark parametrization avoids representing the unobservable global position at all.

## Method & architecture

- **Robocentric state.** With the IMU frame $B$, world frame $I$, and camera frame $V$, the filter state (Eq. 1 of the paper) is
  $$\mathbf{x} := \big(\mathbf{r},\ \mathbf{v},\ \mathbf{q},\ \mathbf{b}_f,\ \mathbf{b}_\omega,\ \mathbf{c},\ \mathbf{z},\ \mu_0,\dots,\mu_N,\ \rho_0,\dots,\rho_N\big),$$
  where $\mathbf{r}, \mathbf{v}$ are the robocentric IMU position and velocity (expressed in $B$), $\mathbf{q}$ the attitude (map $B\to I$), $\mathbf{b}_f, \mathbf{b}_\omega$ the accelerometer/gyro biases, $\mathbf{c}, \mathbf{z}$ the online-calibrated IMU-camera extrinsics, and each landmark is a bearing vector $\mu_i \in S^2$ plus a distance parameter $\rho_i$ with $d(\rho_i) = 1/\rho_i$ (inverse distance). Rotations and unit vectors use minimal boxplus differences, so a landmark costs only 3 covariance columns (2 bearing + 1 depth) and can be initialized *undelayed* at detection with huge depth uncertainty.
- **IMU-driven propagation.** With bias-corrected measurements $\hat{\mathbf{f}}, \hat{\boldsymbol{\omega}}$, the continuous dynamics (Eqs. 2–4) are
  $$\dot{\mathbf{r}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{r} + \mathbf{v} + \mathbf{w}_r, \qquad \dot{\mathbf{v}} = -\hat{\boldsymbol{\omega}}^\times\mathbf{v} + \hat{\mathbf{f}} + \mathbf{q}^{-1}(\mathbf{g}), \qquad \dot{\mathbf{q}} = -\mathbf{q}(\hat{\boldsymbol{\omega}}),$$
  and each landmark's bearing and distance evolve with the camera-frame velocities (Eqs. 9–10): $\dot{\mu}_i = N^T(\mu_i)\hat{\boldsymbol{\omega}}^V - \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} N^T(\mu_i)\frac{\hat{\mathbf{v}}^V}{d(\rho_i)}$ and $\dot{\rho}_i = -\mu_i^T\hat{\mathbf{v}}^V / d'(\rho_i)$, where $N^T(\mu)$ projects onto the tangent space of $\mu$.
- **Direct photometric update.** Each landmark carries a multilevel patch: $8{\times}8$-pixel patches $P_l$ on every level of a factor-2 image pyramid (4 levels → $256 = 4\times8\times8$ intensity errors per feature). For level $l$ and patch pixel $\mathbf{p}_j$ the intensity error (Eq. 17) is
  $$e_{l,j} = P_l(\mathbf{p}_j) - I_l\big(\mathbf{p}\,s_l + \mathbf{W}\mathbf{p}_j\big) - m,$$
  with affine warp $\mathbf{W}$ for viewpoint distortion, per-level scale $s_l$, and mean error $m$ subtracted for illumination invariance. Stacking all terms gives $\bar{\mathbf{b}}(\hat{\mathbf{p}}) = \bar{\mathbf{A}}(\hat{\mathbf{p}})\,\delta\mathbf{p}$; a QR decomposition compresses it to an equivalent 2D system $\mathbf{b}(\hat{\mathbf{p}}) = \mathbf{A}(\hat{\mathbf{p}})\,\delta\mathbf{p}$, which enters the EKF as innovation $\mathbf{y}_i = \mathbf{b}_i(\pi(\hat{\mu}_i)) + \mathbf{n}_i$ with Jacobian $\mathbf{H}_i = \mathbf{A}_i(\pi(\hat{\mu}_i))\frac{d\pi}{d\mu}(\hat{\mu}_i)$ — no descriptors, no explicit matching.
- **Robustness machinery.** Features with large predicted uncertainty (e.g. fresh ones) get a patch-based pre-alignment that improves the EKF linearization point before the update; a Mahalanobis innovation test rejects outliers/moving objects; detection uses a FAST corner detector scored by a multilevel Shi-Tomasi criterion ($\mathbf{H} = \bar{\mathbf{A}}^T\bar{\mathbf{A}}$, minimal eigenvalue) with bucketing, and local/global tracking-quality scores govern feature replacement.

## Results

Evaluated on data from a VI-Sensor (one wide-VGA global-shutter camera at 20 Hz with 120° FOV lens; ADIS16448 IMU at 200 Hz, angular random walk 0.66 deg/√Hz), max 50 features, 4 pyramid levels, motion-capture ground truth. On a ~1 min hand-held sequence (average rotation rate ~1.5 rad/s), the relative position error vs. distance traveled is **similar to a reference batch-optimization framework and often slightly better**; accuracy degrades noticeably only below 20 features. Per-image timings on a single core of an Intel i7-2760QM: 6.65 ms with 10 features up to **29.72 ms with 50 features** — comfortably real-time at 20 Hz. On a fast-motion dataset (mean 3.5 rad/s, peaks up to 8 rad/s) attitude and robocentric velocity track ground truth within their 3σ bounds, with only the unobservable yaw drifting slowly; IMU-camera extrinsics converge online from a rough guess (translation initialized to zero). The filter also ran on-board a multirotor UAV, stabilizing flight from take-off to landing with online calibration.

## Why it matters for SLAM

ROVIO showed that direct methods and Kalman filtering combine naturally: the camera becomes "just another sensor" producing intensity innovations for the EKF, and the robocentric + inverse-distance formulation removes both the initialization procedure and the unobservable global states that plague world-centric filters. It became the VIO front-end (ROVIOLI) of the maplab mapping framework and a standard EuRoC-era baseline alongside MSCKF and OKVIS, and its photometric-residual philosophy carried into later direct VIO systems such as VI-DSO and DM-VIO. Choose it when you need a lightweight, robust odometry that tolerates low texture and motion blur.

## Related

- [MSCKF](msckf.md)
- [OpenVINS](openvins.md)
- [DM-VIO](dm-vio.md)
- [maplab](maplab.md)
- [VI-DSO](vi-dso.md)
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md)
