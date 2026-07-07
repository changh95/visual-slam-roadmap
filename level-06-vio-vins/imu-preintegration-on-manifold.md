# IMU Preintegration on Manifold
> Forster 2015 · [Paper](https://arxiv.org/abs/1512.02363)

**One-line summary** — Derives a theoretically rigorous preintegration of IMU measurements on the $SO(3)$ manifold, enabling optimization-based VIO to correct for bias changes analytically without ever re-integrating raw IMU data.

## Problem
Nonlinear optimization gives highly accurate VIO, but "real-time optimization quickly becomes infeasible as the trajectory grows over time; this problem is further emphasized by the fact that inertial measurements come at high rate, hence leading to fast growth of the number of variables in the optimization" (abstract). Naive integration is defined in the world frame, so it depends on the absolute pose at the start of the interval: whenever the optimizer moves that pose, all raw IMU data must be re-integrated — hopeless at hundreds of Hz. Lupton's preintegration (2012) showed the way out but treated rotation in a vector space; a rigorous formulation had to respect the manifold structure of $SO(3)$ and characterize rotation noise correctly.

## Method & architecture
The IMU measures body-frame angular rate and specific force, corrupted by slowly varying biases and white noise (Eqs. 27–28):

$$\tilde{\boldsymbol{\omega}}(t) = \boldsymbol{\omega}(t) + \mathbf{b}^g(t) + \boldsymbol{\eta}^g(t), \qquad \tilde{\mathbf{a}}(t) = \mathtt{R}_{\mathrm{WB}}^{\mathsf{T}}(t)\big(\mathbf{a}(t) - \mathbf{g}\big) + \mathbf{b}^a(t) + \boldsymbol{\eta}^a(t),$$

with kinematics $\dot{\mathtt{R}}_{\mathrm{WB}} = \mathtt{R}_{\mathrm{WB}}\,\boldsymbol{\omega}^{\wedge}$, $\dot{\mathbf{v}} = \mathbf{a}$, $\dot{\mathbf{p}} = \mathbf{v}$. The pipeline then works as follows:

- **Preintegrated measurements.** All measurements between keyframes $i$ and $j$ are compounded once, relative to frame $i$ and using the bias estimate $\mathbf{b}_i$ at integration time:

$$\Delta\tilde{\mathtt{R}}_{ij} \doteq \prod_{k=i}^{j-1} \mathrm{Exp}\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}^g_i)\Delta t\big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \doteq \sum_{k=i}^{j-1} \Delta\tilde{\mathtt{R}}_{ik}\,(\tilde{\mathbf{a}}_k - \mathbf{b}^a_i)\Delta t,$$

  and $\Delta\tilde{\mathbf{p}}_{ij}$ from the analogous double sum — quantities that depend only on measurements and $\mathbf{b}_i$, not on the absolute state.
- **Correct rotation-noise treatment.** Using the first-order expansion of $\mathrm{Exp}$ and the adjoint property, the compounded rotation splits into measurement times noise, $\Delta\mathtt{R}_{ij} = \Delta\tilde{\mathtt{R}}_{ij}\,\mathrm{Exp}(-\delta\boldsymbol{\phi}_{ij})$, with $\delta\boldsymbol{\phi}_{ij}$ living in the tangent space of $SO(3)$ and involving the right Jacobians $\mathtt{J}_r^k$. This yields the measurement model (Eq. 38)

$$\Delta\tilde{\mathtt{R}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\,\mathrm{Exp}(\delta\boldsymbol{\phi}_{ij}), \quad \Delta\tilde{\mathbf{v}}_{ij} = \mathtt{R}_i^{\mathsf{T}}(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\Delta t_{ij}) + \delta\mathbf{v}_{ij}, \quad \Delta\tilde{\mathbf{p}}_{ij} = \mathtt{R}_i^{\mathsf{T}}\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\Delta t_{ij}^2\big) + \delta\mathbf{p}_{ij},$$

  where the noise vector $[\delta\boldsymbol{\phi}_{ij}, \delta\mathbf{v}_{ij}, \delta\mathbf{p}_{ij}]$ is zero-mean Gaussian up to first order, with covariance $\mathbf{\Sigma}_{ij}$ propagated iteratively.
- **Bias correction without re-integration.** When the optimizer updates the bias by $\delta\mathbf{b}$, the delta measurements are corrected with precomputed, constant Jacobians instead of re-integrating (Eq. 44):

$$\Delta\tilde{\mathtt{R}}_{ij}(\mathbf{b}^g_i) \simeq \Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}\!\Big(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g\Big), \qquad \Delta\tilde{\mathbf{v}}_{ij} \simeq \Delta\tilde{\mathbf{v}}_{ij}(\bar{\mathbf{b}}_i) + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g + \tfrac{\partial\Delta\bar{\mathbf{v}}_{ij}}{\partial\mathbf{b}^a}\delta\mathbf{b}^a.$$

- **The preintegrated IMU factor.** One 9-DoF residual $\mathbf{r}_{\mathcal{I}_{ij}} = [\mathbf{r}_{\Delta\mathtt{R}_{ij}}, \mathbf{r}_{\Delta\mathbf{v}_{ij}}, \mathbf{r}_{\Delta\mathbf{p}_{ij}}]$ constrains consecutive keyframe states, e.g. $\mathbf{r}_{\Delta\mathtt{R}_{ij}} = \mathrm{Log}\big(\big(\Delta\tilde{\mathtt{R}}_{ij}(\bar{\mathbf{b}}^g_i)\,\mathrm{Exp}(\tfrac{\partial\Delta\bar{\mathtt{R}}_{ij}}{\partial\mathbf{b}^g}\delta\mathbf{b}^g)\big)^{\mathsf{T}}\mathtt{R}_i^{\mathsf{T}}\mathtt{R}_j\big)$ — exactly parallel to a reprojection residual, with all Jacobians in analytic form.
- **Factor-graph back-end with structureless vision factors.** The IMU factor plugs into MAP estimation over a factor graph solved with iSAM2; visual landmarks are eliminated in closed form (structureless projection factors), which "avoids optimizing over the 3D points, further accelerating the computation" — full smoothing in real time instead of fixed-lag filtering.

## Results
- **Simulation:** Monte Carlo analysis with 50 runs on a 120 m circular trajectory with sinusoidal vertical motion confirms accuracy and consistency of the preintegrated model (solved with iSAM2).
- **Indoor (430 m trajectory, VI-Sensor: ADIS16448 IMU at 800 Hz, camera at 20 Hz, Vicon ground truth):** the full pipeline (SVO front-end + preintegration + structureless factors + iSAM2) achieves **0.3 m average drift over 360 m traveled vs 0.7 m for both OKVIS and MSCKF**, with markedly less yaw drift.
- **Runtime (Intel i7, 2.4 GHz laptop):** average iSAM2 update 10 ms (10 iterations, full MAP); SVO front-end ~3 ms per frame. OKVIS by contrast must repeat IMU integration at every linearization-point change.
- **Outdoor vs Google Tango:** end-to-end loop error 1.5 m vs Tango's 2.2 m around an office building; 0.5 m vs 1.4 m across a three-floor trajectory.
- Published in IEEE TRO (2017; arXiv 2015); the reference implementation of the preintegrated IMU and structureless vision factors ships in GTSAM.

## Why it matters for SLAM
This is the foundational theory underlying essentially all modern optimization-based VIO: VINS-Mono, ORB-SLAM3, Kimera-VIO, Basalt, and OKVIS2 all use Forster-style on-manifold preintegration for their IMU factors. It upgraded Lupton's original preintegration idea with correct manifold treatment — avoiding Euler-angle singularities — and made high-rate inertial sensing compatible with keyframe-rate nonlinear optimization. If you implement one piece of VIO theory by hand, make it this one.

## Related
- [IMU preintegration](imu-preintegration.md) — the concept note with the surrounding context.
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — companion reference for on-manifold state estimation.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the mathematical machinery ($\mathrm{Exp}/\mathrm{Log}$, Jacobians).
- [VINS-Mono](vins-mono.md) — a widely used system built on these IMU factors.
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 back-end the paper pairs with.
- [IMU noise model](imu-noise-model.md) — where the noise terms entering the covariance propagation come from.
