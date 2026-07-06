# IMU preintegration

An IMU produces measurements at 100–1000 Hz, while cameras deliver keyframes at 10–30 Hz. A naive VIO formulation would insert every IMU reading into the estimator, exploding the number of state variables. Worse, naive integration is done in the world frame: the integrated result depends on the absolute pose at the start of the interval, so every time the optimizer adjusts that pose, all raw IMU data would need to be re-integrated.

**Preintegration** (introduced by Lupton and Sukkarieh, 2012) solves both problems. IMU measurements between two keyframe times $i$ and $j$ are integrated *in the local frame of keyframe* $i$, producing a compact relative-motion summary:

$$\left(\Delta\mathbf{R}_{ij},\; \Delta\mathbf{v}_{ij},\; \Delta\mathbf{p}_{ij}\right)$$

— a relative rotation, velocity change, and position change. Crucially, these quantities depend only on the IMU measurements and the bias estimates, **not on the absolute poses**. They are computed once, stored, and act as a single "IMU factor" connecting the states at $i$ and $j$ in the factor graph. When the optimizer moves the poses, nothing needs re-integration.

Two refinements make this practical:

- **Bias correction via Jacobians.** The preintegrated terms were computed with a particular bias estimate. When the optimizer updates the bias by $\delta\mathbf{b}$, a first-order correction using stored Jacobians (e.g., $\Delta\mathbf{R}_{ij} \cdot \mathrm{Exp}\!\left(\tfrac{\partial \Delta\mathbf{R}}{\partial \mathbf{b}^g}\,\delta\mathbf{b}^g\right)$) updates the factor without touching raw data.
- **On-manifold formulation (Forster et al., 2015).** Rotations live on the Lie group $SO(3)$, not in a vector space. Forster's formulation performs the integration and its noise propagation properly on the manifold, yielding correct covariances and analytic Jacobians. This is the version implemented in GTSAM, VINS-Mono, ORB-SLAM3, Kimera-VIO, and OKVIS2.

The resulting IMU residual compares the predicted relative motion (from the current pose/velocity/bias estimates and gravity) against the stored preintegrated measurement, exactly parallel to how a reprojection residual compares a predicted and observed pixel.

## Why it matters for SLAM
Preintegration is the single idea that made optimization-based VIO real-time: it compresses hundreds of high-rate measurements into one factor per keyframe pair while remaining exactly re-linearizable. Every modern tightly-coupled VIO system builds on it, and understanding how $\Delta\mathbf{R}_{ij}$ is formed and bias-corrected is the fastest route to understanding any VIO codebase.

## Related
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the Forster 2015 paper note.
- [IMU noise model](imu-noise-model.md) — the bias and noise terms that enter the integration.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the math behind the on-manifold formulation.
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — where the preintegrated IMU factor lives.
- [VINS-Mono](vins-mono.md) — a complete system built around preintegrated IMU factors.

[Back to Level 6](../README.md#level-6-vio--vins)
