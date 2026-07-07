# Quaternion kinematics for error-state KF

> Solà 2017 · [Paper](https://arxiv.org/abs/1711.02508)

**One-line summary** — A self-contained tutorial that derives quaternion algebra and kinematics from first principles and builds the error-state Kalman filter (ESKF) for IMU-driven state estimation — the standard reference for getting rotation handling *right* in a VIO filter.

## Problem

3D rotation is the most error-prone ingredient of any estimation engine: quaternions and rotation matrices do not form a vector space, competing sign and ordering conventions (Hamilton vs JPL) contaminate the literature, and the correct definitions of rotation *perturbations, derivatives, and integrals* are scattered across sources that disagree with each other. Solà's article is an exhaustive revision of the concepts and formulas related to quaternions and rotations in 3D space and their proper use in estimation engines such as the error-state Kalman filter, including an in-depth study of the rotation group and its Lie structure — with the explicit goal of devising precise ESKF formulations for real applications that integrate IMU signals.

## Key ideas

- **Rigorous quaternion algebra**: defines the unit quaternion $\mathbf{q} = [q_w, \mathbf{q}_v]^\top$ with a fixed convention (Hamilton), quaternion product $\mathbf{q}_1 \otimes \mathbf{q}_2$ as rotation composition, and the exponential/log maps connecting rotation vectors to quaternions — resolving the convention confusion (Hamilton vs JPL) that plagues the literature.
- **Rotations as a Lie group**: the paper works out the rotation group with both quaternion and rotation-matrix formulations, connected through $\mathrm{Exp}/\mathrm{Log}$ maps; for a rotation vector $\boldsymbol{\phi}$ the matrix form is the Rodrigues formula
  $$\mathrm{Exp}(\boldsymbol{\phi}) = \mathbf{I} + \frac{\sin\theta}{\theta}[\boldsymbol{\phi}]_\times + \frac{1-\cos\theta}{\theta^2}[\boldsymbol{\phi}]_\times^2, \qquad \theta = \|\boldsymbol{\phi}\|.$$
  Perturbations are defined multiplicatively on the group ($\mathbf{R}\,\mathrm{Exp}(\delta\boldsymbol{\phi})$), never additively.
- **Quaternion kinematics**: the continuous-time evolution under angular rate $\boldsymbol{\omega}$ is $\dot{\mathbf{q}} = \frac{1}{2}\,\mathbf{q} \otimes \begin{bmatrix}0\\ \boldsymbol{\omega}\end{bmatrix}$, integrated discretely as $\mathbf{q}(t+\delta t) \approx \mathbf{q}(t) \otimes \mathrm{Exp}(\boldsymbol{\omega}\,\delta t)$.
- **Error-state formulation**: the state is split into a *nominal state* (integrates IMU data with the full nonlinear equations, including biases) and a small *error state* $\delta\mathbf{x}$ (position, velocity, orientation error $\delta\boldsymbol{\theta} \in \mathbb{R}^3$, bias errors). The Kalman filter runs only on the error state, which stays small, near-linear, and free of quaternion normalization issues.
- **Why the error state wins**: because the error is always near zero, linearization is accurate; the orientation error uses a minimal 3-parameter representation with no singularities in its operating range; and the large, fast signal (the nominal trajectory) is handled by exact nonlinear integration rather than by the filter.
- **ESKF cycle**: propagate nominal state with IMU; propagate error covariance with the linearized error dynamics; on a visual (or other) measurement, update the error state; inject the error into the nominal state ($\mathbf{q} \leftarrow \mathbf{q} \otimes \mathrm{Exp}(\delta\boldsymbol{\theta})$); reset the error to zero.
- **Complete Jacobian catalog**: closed-form Jacobians of rotations, perturbations, and the IMU noise/bias random-walk model, ready to transcribe into code — plus numerous geometric intuitions to help the reader grasp the inner mechanisms of 3D rotation.

## Results & impact

This is a tutorial/reference document rather than a benchmarked system, so its impact is measured in adoption: it became one of the standard citations for filter-based VIO and IMU fusion implementations, and the ESKF recipe it lays out is the pattern behind countless research and production IMU integration modules. Together with on-manifold preintegration (the optimization-side counterpart), it forms the mathematical toolkit that modern VIO codebases assume.

## Why it matters for SLAM

Rotations do not live in a vector space, so naive additive EKF updates on quaternions or rotation matrices break the group constraints; the error-state trick is how every serious filter-based VIO (MSCKF, ROVIO, OpenVINS, and commercial trackers) handles orientation. Solà's notes are the document most implementers keep open while writing an IMU propagation or ESKF module, and they complement the on-manifold preintegration theory used by optimization-based systems.

## Related

- [IMU noise model](imu-noise-model.md)
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [MSCKF](msckf.md)
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md)
- [OpenVINS](openvins.md)

[Back to Level 6](../README.md#level-6-vio--vins)
