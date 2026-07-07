# ROVIO

> Bloesch 2015 · [Paper](https://github.com/ethz-asl/rovio)

**One-line summary** — ROVIO (Robust Visual Inertial Odometry) is a tightly-coupled monocular VIO that combines a *robocentric* EKF formulation with *direct photometric* multi-level patch tracking, gaining robustness in texture-poor scenes and fast motion where feature-descriptor pipelines fail.

## Problem

Feature-based VIO systems (MSCKF, OKVIS) depend on reliable feature extraction and matching, which breaks down in low-texture environments (bare walls, floors) and under fast-motion blur. Independently, the standard world-centric EKF keeps the global pose in its state even though global position and yaw are unobservable in monocular VIO — a source of gauge-freedom and conditioning problems. ROVIO attacks both: direct photometric tracking removes the feature-matching bottleneck, and a robocentric formulation removes the unobservable global state from the filter.

## Key ideas

- **Robocentric state**: instead of estimating poses in an unobservable world frame, the filter origin rides with the current IMU body frame. The state holds the world-to-body rotation, body-frame velocity, IMU biases, and landmarks as bearing vectors with inverse depth expressed in the current body frame,
  $$\mathcal{X} = \left(\mathbf{q}_{BW},\; \mathbf{v}^B,\; \mathbf{b}^g,\; \mathbf{b}^a,\; \{{}^B\mathbf{p}_{f_i},\, d_i\}\right).$$
  This sidesteps the unobservable global position/yaw and improves EKF conditioning; the price is that landmarks must be re-expressed in the new body frame at every IMU propagation step.
- **Direct photometric tracking in the filter**: each landmark is a multi-level (pyramidal) intensity patch; the EKF innovation is the photometric error between the warped reference patch and the current image,
  $$\mathbf{r}^{(i)} = \mathbf{I}_k\!\left(\pi(\hat{\boldsymbol{\ell}}_i) + \mathbf{W}\,\delta\mathbf{u}\right) - \mathbf{I}_{\text{ref}}\!\left(\pi(\boldsymbol{\ell}_{i,\text{ref}})\right),$$
  where $\pi(\cdot)$ is the camera projection and $\mathbf{W}$ a warp accounting for viewpoint change — no descriptors, no explicit matching step.
- **Iterated EKF update**: photometric residuals are strongly nonlinear, so the update re-linearizes within each step (IEKF) for accuracy — a cheap approximation of what optimization-based direct methods do with multiple Gauss-Newton iterations.
- **Inverse-depth landmark initialization**: new patches enter with high depth uncertainty and converge over multiple observations, allowing immediate use of newly seen scene regions; patches are pruned when they leave the field of view and replenished when tracked counts drop.
- Runs in real time on standard CPUs, and is famously robust on sequences with featureless floors/walls where corner-based systems lose track.

## Results & impact

Evaluated on the EuRoC MAV dataset and custom UAV sequences, ROVIO achieves accuracy competitive with MSCKF while being distinctly more robust in fast-rotation and low-texture segments, running in real time on ordinary laptop CPUs. It became a standard EuRoC-era baseline alongside MSCKF and OKVIS, and was adopted as the VIO front-end (ROVIOLI) of the maplab visual-inertial mapping framework — evidence that a compact EKF around photometric residuals is dependable enough to anchor a full mapping stack.

## Why it matters for SLAM

ROVIO showed that direct methods and Kalman filtering combine naturally: the camera becomes "just another sensor" producing intensity innovations for the EKF. It became the VIO front-end (ROVIOLI) of the maplab mapping framework and a standard EuRoC-era baseline alongside MSCKF and OKVIS, and its photometric-residual philosophy carried into later direct VIO systems such as VI-DSO and DM-VIO. Choose it when you need a lightweight, robust odometry that tolerates low texture and motion blur.

## Related

- [MSCKF](msckf.md)
- [OpenVINS](openvins.md)
- [DM-VIO](dm-vio.md)
- [maplab](maplab.md)
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md)

[Back to Level 6](../README.md#level-6-vio--vins)
