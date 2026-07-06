# Quaternion kinematics for error-state KF

> Solà 2017 · [Paper](https://arxiv.org/abs/1711.02508)

**One-line summary** — A self-contained tutorial that derives quaternion algebra and kinematics from first principles and builds the error-state Kalman filter (ESKF) for IMU-driven state estimation — the standard reference for getting rotation handling *right* in a VIO filter.

## Key ideas

- **Rigorous quaternion algebra**: defines the unit quaternion $\mathbf{q} = [q_w, \mathbf{q}_v]^\top$ with a fixed convention (Hamilton), quaternion product $\mathbf{q}_1 \otimes \mathbf{q}_2$ as rotation composition, and the exponential/log maps connecting rotation vectors to quaternions — resolving the convention confusion (Hamilton vs JPL) that plagues the literature.
- **Quaternion kinematics**: the continuous-time evolution under angular rate $\boldsymbol{\omega}$ is $\dot{\mathbf{q}} = \frac{1}{2}\,\mathbf{q} \otimes \begin{bmatrix}0\\ \boldsymbol{\omega}\end{bmatrix}$, integrated discretely as $\mathbf{q}(t+\delta t) \approx \mathbf{q}(t) \otimes \mathrm{Exp}(\boldsymbol{\omega}\,\delta t)$.
- **Error-state formulation**: the state is split into a *nominal state* (integrates IMU data with the full nonlinear equations, including biases) and a small *error state* $\delta\mathbf{x}$ (position, velocity, orientation error $\delta\boldsymbol{\theta} \in \mathbb{R}^3$, bias errors). The Kalman filter runs only on the error state, which stays small, near-linear, and free of quaternion normalization issues.
- **ESKF cycle**: propagate nominal state with IMU; propagate error covariance with the linearized error dynamics; on a visual (or other) measurement, update the error state; inject the error into the nominal state ($\mathbf{q} \leftarrow \mathbf{q} \otimes \mathrm{Exp}(\delta\boldsymbol{\theta})$); reset the error to zero.
- **Complete Jacobian catalog**: closed-form Jacobians of rotations, perturbations, and the IMU noise/bias random-walk model, ready to transcribe into code.

## Why it matters for SLAM

Rotations do not live in a vector space, so naive additive EKF updates on quaternions or rotation matrices break the group constraints; the error-state trick is how every serious filter-based VIO (MSCKF, ROVIO, OpenVINS, and commercial trackers) handles orientation. Solà's notes are the document most implementers keep open while writing an IMU propagation or ESKF module, and they complement the on-manifold preintegration theory used by optimization-based systems.

## Related

- [IMU noise model](imu-noise-model.md)
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [MSCKF](msckf.md)
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
