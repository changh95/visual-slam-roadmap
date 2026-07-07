# VINS-Fusion

> Qin 2019 · [Paper](https://arxiv.org/abs/1901.03638)

**One-line summary** — VINS-Fusion generalizes VINS-Mono into an optimization-based framework for local odometry where every sensor is treated as a general factor; factors sharing state variables are summed into one sliding-window problem, demonstrated with stereo-only, mono+IMU, and stereo+IMU suites in a single open-source codebase.

## Problem

Robots ship with increasingly diverse sensor suites — stereo cameras on ground vehicles, a monocular camera plus IMU on phones, stereo plus IMU on aerial robots — yet most state estimators are designed for a single sensor or one specific suite and cannot be ported across platforms. A practical system also needs graceful sensor failure handling: an inactive sensor should be removable and an alternative added quickly. VINS-Fusion proposes one general optimization-based framework in which every sensor is just another residual factor in a pose graph.

## Method & architecture

**States.** The sliding window estimates body poses plus optional sensor-specific variables:

$$\mathcal{X} = [\mathbf{p}_0, \mathbf{R}_0, \dots, \mathbf{p}_n, \mathbf{R}_n, \mathbf{x}_{cam}, \mathbf{x}_{imu}], \quad \mathbf{x}_{cam} = [\lambda_0, \dots, \lambda_l], \quad \mathbf{x}_{imu} = [\mathbf{v}_0, \mathbf{b}_{a_0}, \mathbf{b}_{g_0}, \dots]$$

where $\lambda$ is the depth of each feature in its first observing frame; $\mathbf{x}_{imu}$ (velocities and IMU biases) is simply omitted for the stereo-only suite. State estimation is MLE over independent Gaussian measurements, i.e. nonlinear least squares:

$$\mathcal{X}^{*} = \arg\min_{\mathcal{X}} \sum_{t=0}^{n} \sum_{k\in\mathbf{S}} \left\lVert \mathbf{z}^{k}_{t} - h^{k}_{t}(\mathcal{X}) \right\rVert^{2}_{\mathbf{\Omega}^{k}_{t}}$$

**Camera factor.** Shi-Tomasi corners tracked by KLT (and matched left-right for stereo); the factor reprojects feature $l$ from its first observation in image $i$ into image $t$:

$$\mathbf{z}^{l}_{t} - h^{l}_{t}(\mathcal{X}) = \begin{bmatrix} u^{l}_{t} \\ v^{l}_{t} \end{bmatrix} - \pi_c\Big( (\mathbf{T}^{b}_{c})^{-1}\, \mathbf{T}_{t}^{-1}\, \mathbf{T}_{i}\, \mathbf{T}^{b}_{c}\, \pi_c^{-1}\big(\lambda_l, \begin{bmatrix} u^{l}_{i} \\ v^{l}_{i} \end{bmatrix}\big) \Big)$$

with $\pi_c$ the camera model's projection and $\mathbf{T}^b_c$ the body-to-camera extrinsic. The *same* factor serves temporal (left-to-left) and spatial (left-to-right) observations — spatial ones constrain metric scale through the calibrated baseline, no IMU excitation needed.

**IMU factor.** On-manifold preintegration between consecutive frames yields pseudo-measurements $\boldsymbol{\alpha}^{t-1}_{t}, \boldsymbol{\beta}^{t-1}_{t}, \boldsymbol{\gamma}^{t-1}_{t}$ (relative position, velocity, rotation) plus propagated covariance; the residual compares them against the state-predicted motion, e.g. for position $\boldsymbol{\alpha}^{t-1}_{t} \ominus \mathbf{R}_{t-1}^{-1}(\mathbf{p}_t - \mathbf{p}_{t-1} + \tfrac{1}{2}\mathbf{g}\,dt^2 - \mathbf{v}_{t-1} dt)$, with biases modeled as random walks.

**Optimization & marginalization.** The summed cost is solved by Gauss–Newton/Levenberg–Marquardt in Ceres. The window keeps ten spatial camera frames; when a new keyframe arrives, the oldest frame's visual and inertial factors are marginalized via the Schur complement,

$$\mathbf{H}_p = \mathbf{H}_{rr} - \mathbf{H}_{rm}\mathbf{H}_{mm}^{-1}\mathbf{H}_{mr}, \qquad \mathbf{b}_p = \mathbf{b}_r - \mathbf{H}_{rm}\mathbf{H}_{mm}^{-1}\mathbf{b}_m$$

turning the problem into MAP with a prior term and no information loss. Because any sensor reducible to a residual factor fits (wheel odometry, LiDAR, radar are named), sensor failure is handled by removing the inactive sensor's factors and adding another's.

## Results

On EuRoC (RMSE ATE, Horn alignment), the three suites are compared against OKVIS: mono+IMU achieves 0.09 m on MH_02 (OKVIS 0.22), 0.09 m on V1_02 (OKVIS 0.20), 0.06 m on V2_01 (OKVIS 0.13), outperforming OKVIS on most sequences. Stereo-only *fails* on V1_03 and V2_03 (motion too aggressive for visual tracking) and drifts most elsewhere; every IMU-aided configuration survives all eleven sequences — the IMU bridges illumination change, texture-less areas, and motion blur, and suppresses roll/pitch drift by observing gravity. Stereo+IMU is not always best, being more sensitive to calibration error. In outdoor handheld experiments (mvBlueFOX stereo at 20 Hz + DJI A3 IMU at 200 Hz, GPS as ground truth) over ~224–232 m loops, RMSE drops from 1.85–2.59 m (stereo-only) to 0.43–0.75 m with IMU fusion. GPS fusion is named as future work in this paper; the open-source VINS-Fusion release ships it as a companion global pose-graph module fusing local odometry with global position measurements.

## Why it matters for SLAM

VINS-Fusion is one of the most widely deployed open-source odometry stacks in robotics: it took the academically successful VINS-Mono and made it practical for real vehicles by adding stereo scale observability and a sensor-agnostic factor formulation, later extended with GPS drift correction. Its "everything is a factor" design became the template for local-plus-global fusion in autonomous driving and drone autonomy, and it remains a standard baseline for stereo-inertial estimation.

## Related

- [VINS-Mono](vins-mono.md)
- [OKVIS](okvis.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
- [Tightly-coupled vs Loosely-coupled](tightly-coupled-vs-loosely-coupled.md)
- [LVI-SAM](../level-09-lidar-visual-lidar-slam/lvi-sam.md)
- [OKVIS2-X](okvis2-x.md)
