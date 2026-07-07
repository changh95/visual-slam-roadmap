# IMU Preintegration on Manifold
> Forster 2015 · [Paper](https://arxiv.org/abs/1512.02363)

**One-line summary** — Derives a theoretically rigorous preintegration of IMU measurements on the $SO(3)$ manifold, enabling optimization-based VIO to correct for bias changes analytically without ever re-integrating raw IMU data.

## Problem
Nonlinear optimization gives highly accurate VIO, but "real-time optimization quickly becomes infeasible as the trajectory grows over time," and the problem is "further emphasized by the fact that inertial measurements come at high rate, hence leading to fast growth of the number of variables in the optimization" (abstract). Naive integration is also defined in the world frame, so it depends on the absolute pose at the start of the interval: whenever the optimizer moves that pose, all raw IMU data must be re-integrated — hopeless at hundreds of Hz.

Lupton's preintegration (2012) had shown the way out, but treated rotation in a vector space; a rigorous formulation had to respect the manifold structure of $SO(3)$ and characterize rotation noise correctly.

## Key ideas
- **Preintegrated measurements on $SO(3)$.** With the measurement model $\tilde{\boldsymbol{\omega}}_t = \boldsymbol{\omega}_t + \mathbf{b}^g_t + \boldsymbol{\eta}^g_t$ and $\tilde{\mathbf{a}}_t = \mathbf{R}_t^\top(\mathbf{a}_t - \mathbf{g}) + \mathbf{b}^a_t + \boldsymbol{\eta}^a_t$, the measurements between keyframes $i$ and $j$ are compounded once into
  $$\Delta\mathbf{R}_{ij} = \prod_{t=i}^{j-1} \mathrm{Exp}\big((\tilde{\boldsymbol{\omega}}_t - \mathbf{b}^g_i)\,\delta t\big), \quad
  \Delta\mathbf{v}_{ij} = \sum_{t=i}^{j-1} \Delta\mathbf{R}_{it}(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t, \quad
  \Delta\mathbf{p}_{ij} = \sum_{t=i}^{j-1}\Big[\Delta\mathbf{v}_{it}\,\delta t + \tfrac{1}{2}\Delta\mathbf{R}_{it}(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t^2\Big],$$
  which depend only on measurements and the bias estimate — not on absolute poses.
- **Correct rotation-noise treatment.** The preintegration theory "properly addresses the manifold structure of the rotation group": rotation uncertainty lives in the tangent space of $SO(3)$, avoiding the singularities and distortions of Euler-angle or naive vector treatments, and yielding valid covariances for the preintegrated terms.
- **A-posteriori bias correction without re-integration.** Analytic Jacobians of the preintegrated terms w.r.t. the biases enable a first-order update when the optimizer changes the bias by $\delta\mathbf{b}$:
  $$\Delta\tilde{\mathbf{R}}_{ij}(\mathbf{b} + \delta\mathbf{b}) \approx \Delta\mathbf{R}_{ij}\,\mathrm{Exp}\!\Big(\tfrac{\partial\Delta\mathbf{R}}{\partial\mathbf{b}^g}\,\delta\mathbf{b}^g\Big)$$
  — the key to keeping IMU factors cheap inside an iterative optimizer.
- **The IMU factor.** The preintegrated measurement becomes one relative constraint between consecutive keyframe states $(\mathbf{R}, \mathbf{v}, \mathbf{p}, \mathbf{b}^g, \mathbf{b}^a)$ with residuals
  $$\mathbf{r}_{\Delta R} = \mathrm{Log}\big(\Delta\mathbf{R}_{ij}^\top \mathbf{R}_i^\top \mathbf{R}_j\big), \qquad
  \mathbf{r}_{\Delta v} = \mathbf{R}_i^\top(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}) - \Delta\mathbf{v}_{ij},$$
  $$\mathbf{r}_{\Delta p} = \mathbf{R}_i^\top(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2) - \Delta\mathbf{p}_{ij},$$
  exactly parallel to a reprojection residual — predicted relative motion vs stored preintegrated measurement.
- **MAP estimation in a factor graph.** The paper formally derives the generative measurement model and the maximum-a-posteriori estimator, so the preintegrated IMU model integrates seamlessly with factor-graph smoothers (iSAM2/GTSAM) and all Jacobians come in analytic form.
- **Structureless vision factors.** Combined with visual factors that marginalize 3D points in closed form, the formulation "avoids optimizing over the 3D points, further accelerating the computation" — enabling real-time full smoothing rather than fixed-lag filtering.

## Results & impact
The paper reports an extensive evaluation of the monocular VIO pipeline on real and simulated datasets, confirming that "our modelling effort leads to accurate state estimation in real-time, outperforming state-of-the-art approaches" (abstract). Published in IEEE Transactions on Robotics (2017; arXiv 2015), it became the foundational theory beneath essentially all modern optimization-based VIO: VINS-Mono, ORB-SLAM3, Kimera-VIO, Basalt, and OKVIS2 all use Forster-style on-manifold preintegration, and the reference implementation lives in GTSAM.

## Why it matters for SLAM
This is the foundational theory underlying essentially all modern optimization-based VIO: VINS-Mono, ORB-SLAM3, Kimera-VIO, Basalt, and OKVIS2 all use Forster-style on-manifold preintegration for their IMU factors, and the reference implementation lives in GTSAM. It upgraded Lupton's original preintegration idea (2012) with correct manifold treatment — avoiding Euler-angle singularities — and made high-rate inertial sensing compatible with keyframe-rate nonlinear optimization. If you implement one piece of VIO theory by hand, make it this one.

## Related
- [IMU preintegration](imu-preintegration.md) — the concept note with the surrounding context.
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — companion reference for on-manifold state estimation.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the mathematical machinery ($\mathrm{Exp}/\mathrm{Log}$, Jacobians).
- [VINS-Mono](vins-mono.md) — a widely used system built on these IMU factors.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 back-end the paper pairs with.
- [IMU noise model](imu-noise-model.md) — where the noise terms entering the covariance propagation come from.

[Back to Level 6](../README.md#level-6-vio--vins)
