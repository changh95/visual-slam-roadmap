# Quaternion kinematics for error-state KF

> Solà 2017 · [Paper](https://arxiv.org/abs/1711.02508)

**One-line summary** — A self-contained tutorial that derives quaternion algebra and kinematics from first principles and builds the error-state Kalman filter (ESKF) for IMU-driven state estimation — the standard reference for getting rotation handling *right* in a VIO filter.

## Problem

3D rotation is the most error-prone ingredient of any estimation engine: quaternions do not form a vector space, competing sign and ordering conventions (Hamilton vs JPL) contaminate the literature, and correct definitions of rotation *perturbations, derivatives, and integrals* are scattered across sources that disagree. Solà's article is "an exhaustive revision of concepts and formulas related to quaternions and rotations in 3D space, and their proper use in estimation engines such as the error-state Kalman filter", including an in-depth study of the rotation group and its Lie structure — with the explicit goal of devising precise ESKF formulations for real applications that integrate IMU signals.

## Method & architecture

- **Rigorous quaternion algebra.** Fixes the Hamilton convention ($ij = k$, $i^2 = j^2 = k^2 = ijk = -1$, scalar part first) and derives the product $\otimes$, conjugate, and the exponential map connecting rotation vectors to unit quaternions (Eq. 101):

  $$\mathbf{q} \triangleq \mathrm{Exp}(\phi\mathbf{u}) = e^{\phi\mathbf{u}/2} = \begin{bmatrix} \cos(\phi/2) \\ \mathbf{u}\sin(\phi/2) \end{bmatrix},$$

  the double product $\mathbf{x}' = \mathbf{q} \otimes \mathbf{x} \otimes \mathbf{q}^{*}$ explaining the half-angle, and the matrix-side Rodrigues formula from $\mathbf{R} = e^{\phi[\mathbf{u}]_\times}$. A dedicated section catalogs the four "quaternion flavors" so Hamilton vs JPL confusion can be diagnosed in any codebase.
- **True, nominal, and error states.** The true state is the composition of a *nominal state* (large-signal, integrated nonlinearly from IMU data) and an *error state* $\delta\mathbf{x} = (\delta\mathbf{p}, \delta\mathbf{v}, \delta\boldsymbol{\theta}, \delta\mathbf{a}_b, \delta\boldsymbol{\omega}_b, \delta\mathbf{g})$ (small-signal, linearly integrable, suitable for linear-Gaussian filtering). The IMU model is $\mathbf{a}_m = \mathbf{R}_t^{\top}(\mathbf{a}_t - \mathbf{g}_t) + \mathbf{a}_{bt} + \mathbf{a}_n$, $\boldsymbol{\omega}_m = \boldsymbol{\omega}_t + \boldsymbol{\omega}_{bt} + \boldsymbol{\omega}_n$, and the true quaternion kinematics are $\dot{\mathbf{q}}_t = \tfrac{1}{2}\mathbf{q}_t \otimes \boldsymbol{\omega}_t$.
- **Nominal-state propagation (discrete, Eq. 260).** $\mathbf{p} \leftarrow \mathbf{p} + \mathbf{v}\Delta t + \tfrac{1}{2}(\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t^2$, $\ \mathbf{v} \leftarrow \mathbf{v} + (\mathbf{R}(\mathbf{a}_m - \mathbf{a}_b) + \mathbf{g})\Delta t$, $\ \mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{(\boldsymbol{\omega}_m - \boldsymbol{\omega}_b)\Delta t\}$ — full nonlinear integration ignoring noise.
- **Error-state dynamics (Eq. 238).** Solving the composition for the error and dropping second-order terms yields the linear time-variant system the Kalman filter actually runs on:

  $$\dot{\delta\mathbf{v}} = -\mathbf{R}[\mathbf{a}_m - \mathbf{a}_b]_\times\,\delta\boldsymbol{\theta} - \mathbf{R}\,\delta\mathbf{a}_b + \delta\mathbf{g} - \mathbf{R}\mathbf{a}_n, \qquad \dot{\delta\boldsymbol{\theta}} = -[\boldsymbol{\omega}_m - \boldsymbol{\omega}_b]_\times\,\delta\boldsymbol{\theta} - \delta\boldsymbol{\omega}_b - \boldsymbol{\omega}_n,$$

  with $\dot{\delta\mathbf{p}} = \delta\mathbf{v}$ and random-walk biases. The orientation error $\delta\boldsymbol{\theta} \in \mathbb{R}^3$ is defined *locally* (multiplicatively) with respect to the nominal quaternion; a variant with globally-defined angular error is worked out in a separate chapter.
- **ESKF cycle.** Predict the error covariance with the discrete error dynamics; on a non-IMU measurement (GPS, vision), update the error state via the standard KF equations with Jacobians chained through the nominal state; **inject** the mean into the nominal state, $\mathbf{q} \leftarrow \mathbf{q} \otimes \mathbf{q}\{\hat{\delta\boldsymbol{\theta}}\}$ (Eq. 283, sums for the vector states); then **reset** $\hat{\delta\mathbf{x}} \leftarrow 0$ with covariance update $\mathbf{P} \leftarrow \mathbf{G}\mathbf{P}\mathbf{G}^{\top}$ to re-express the orientation error in the new nominal frame.
- **Why the error state wins.** The error is always near zero, so linearization is accurate; the orientation error uses a minimal 3-parameter representation far from any singularity; and the large, fast signal is handled by exact nonlinear integration rather than by the filter. Appendices supply Runge-Kutta and closed-form integration schemes, truncated-series transition matrices, and noise-impulse integration for the full IMU example.

## Results

This is a tutorial/reference document, not a benchmarked system — it reports no experiments, and its "results" are the complete, internally consistent catalog of formulas and Jacobians (rotation maps, perturbations, ESKF matrices) ready to transcribe into code. Its impact is measured in adoption: it became one of the standard citations for filter-based VIO and IMU-fusion implementations, and the ESKF recipe it lays out is the pattern behind countless research and production IMU integration modules. Together with on-manifold preintegration (the optimization-side counterpart), it forms the mathematical toolkit modern VIO codebases assume.

## Why it matters for SLAM

Rotations do not live in a vector space, so naive additive EKF updates on quaternions break the group constraints; the error-state trick is how every serious filter-based VIO (MSCKF, ROVIO, OpenVINS, and commercial trackers) handles orientation. Solà's notes are the document most implementers keep open while writing an IMU propagation or ESKF module, and they complement the on-manifold preintegration theory used by optimization-based systems.

## Related

- [IMU noise model](imu-noise-model.md)
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
- [MSCKF](msckf.md)
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md)
- [OpenVINS](openvins.md)
