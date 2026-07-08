# IMU preintegration

An IMU produces measurements at 100–1000 Hz, while cameras deliver keyframes at 10–30 Hz. A naive VIO formulation would insert every IMU reading into the estimator, exploding the number of state variables. Worse, naive integration is done in the world frame: the integrated result depends on the absolute pose at the start of the interval, so every time the optimizer adjusts that pose, all raw IMU data would need to be re-integrated.

**Preintegration** (introduced by Lupton and Sukkarieh, 2012) solves both problems. IMU measurements between two keyframe times $i$ and $j$ are integrated *in the local frame of keyframe* $i$, producing a compact relative-motion summary:

$$\left(\Delta\mathbf{R}_{ij},\; \Delta\mathbf{v}_{ij},\; \Delta\mathbf{p}_{ij}\right)$$

— a relative rotation, velocity change, and position change. Crucially, these quantities depend only on the IMU measurements and the bias estimates, **not on the absolute poses**. They are computed once, stored, and act as a single "IMU factor" connecting the states at $i$ and $j$ in the factor graph. When the optimizer moves the poses, nothing needs re-integration.

## The math

Starting from the measurement model $\tilde{\boldsymbol{\omega}}_t = \boldsymbol{\omega}_t + \mathbf{b}^g + \boldsymbol{\eta}^g$, $\;\tilde{\mathbf{a}}_t = \mathbf{R}_t^\top(\mathbf{a}_t - \mathbf{g}) + \mathbf{b}^a + \boldsymbol{\eta}^a$, the preintegrated terms accumulate over the IMU samples in $[i, j)$:

$$\Delta\mathbf{R}_{ij} = \prod_{t=i}^{j-1} \mathrm{Exp}\!\big((\tilde{\boldsymbol{\omega}}_t - \mathbf{b}^g_i)\,\delta t\big)$$

$$
\Delta\mathbf{v}_{ij} = \sum_{t=i}^{j-1} \Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t, \qquad
\Delta\mathbf{p}_{ij} = \sum_{t=i}^{j-1}\Big[\Delta\mathbf{v}_{it}\,\delta t + \tfrac{1}{2}\Delta\mathbf{R}_{it}\,(\tilde{\mathbf{a}}_t - \mathbf{b}^a_i)\,\delta t^2\Big]
$$

Note that gravity does **not** appear here — it re-enters only in the residual below, where absolute orientation is available. In pseudo-code, the accumulation is a simple loop run once per keyframe interval:

```text
ΔR, Δv, Δp ← I, 0, 0
for each IMU sample (ω̃, ã, δt) in [i, j):
    Δp ← Δp + Δv·δt + ½·ΔR·(ã − bᵃ)·δt²
    Δv ← Δv + ΔR·(ã − bᵃ)·δt
    ΔR ← ΔR · Exp((ω̃ − bᵍ)·δt)
    (propagate covariance and bias Jacobians alongside)
```

## The IMU residual

The resulting factor compares the predicted relative motion (from the current pose/velocity/bias estimates and gravity) against the stored preintegrated measurement, exactly parallel to how a reprojection residual compares a predicted and observed pixel:

$$
\mathbf{r}_{\Delta R} = \mathrm{Log}\big(\Delta\mathbf{R}_{ij}^\top\,\mathbf{R}_i^\top\mathbf{R}_j\big), \qquad
\mathbf{r}_{\Delta v} = \mathbf{R}_i^\top\big(\mathbf{v}_j - \mathbf{v}_i - \mathbf{g}\,\Delta t_{ij}\big) - \Delta\mathbf{v}_{ij}
$$

$$\mathbf{r}_{\Delta p} = \mathbf{R}_i^\top\big(\mathbf{p}_j - \mathbf{p}_i - \mathbf{v}_i\,\Delta t_{ij} - \tfrac{1}{2}\mathbf{g}\,\Delta t_{ij}^2\big) - \Delta\mathbf{p}_{ij}$$

weighted by the covariance propagated during the accumulation loop (which is where the [IMU noise model](imu-noise-model.md) parameters enter).

## Two refinements that make it practical

- **Bias correction via Jacobians.** The preintegrated terms were computed with a particular bias estimate $\mathbf{b}_i$. When the optimizer updates the bias by $\delta\mathbf{b}$, a first-order correction using stored Jacobians updates the factor without touching raw data:
  $$\Delta\tilde{\mathbf{R}}_{ij}(\mathbf{b} + \delta\mathbf{b}) \approx \Delta\mathbf{R}_{ij}\cdot\mathrm{Exp}\!\Big(\tfrac{\partial \Delta\mathbf{R}}{\partial \mathbf{b}^g}\,\delta\mathbf{b}^g\Big),$$
  and analogously for $\Delta\mathbf{v}_{ij}, \Delta\mathbf{p}_{ij}$ with $\partial/\partial\mathbf{b}^g$ and $\partial/\partial\mathbf{b}^a$ terms. Only if the bias moves far from the linearization point must the interval be re-integrated.
- **On-manifold formulation (Forster et al., 2015).** Rotations live on the Lie group $SO(3)$, not in a vector space. Forster's formulation performs the integration and its noise propagation properly on the manifold, yielding correct covariances and analytic Jacobians. This is the version implemented in GTSAM, VINS-Mono, ORB-SLAM3, Kimera-VIO, and OKVIS2.

## Common pitfalls

- **Forgetting the bias linearization limit.** The first-order bias correction is only valid near the stored linearization point; after large bias updates (e.g., during initialization) the preintegrated terms should be recomputed.
- **Gravity sign/frame conventions.** Whether $\mathbf{g}$ points up or down, and whether the accelerometer model subtracts or adds it, differs across papers and codebases — mismatches produce a estimator that diverges immediately.
- **Timestamp jitter and dropped samples.** The accumulation assumes accurate per-sample $\delta t$; naive use of nominal rates instead of measured timestamps injects unmodeled error.
- **Ignoring the covariance propagation.** The preintegrated measurement is only as useful as its weight; skipping proper noise propagation (or using ad hoc constant covariances) mis-balances IMU vs visual terms.

## Why it matters for SLAM
Preintegration is the single idea that made optimization-based VIO real-time: it compresses hundreds of high-rate measurements into one factor per keyframe pair while remaining exactly re-linearizable. Every modern tightly-coupled VIO system builds on it, and understanding how $\Delta\mathbf{R}_{ij}$ is formed and bias-corrected is the fastest route to understanding any VIO codebase.

## Related
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the Forster 2015 paper note.
- [IMU noise model](imu-noise-model.md) — the bias and noise terms that enter the integration.
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the math behind the on-manifold formulation.
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — where the preintegrated IMU factor lives.
- [VINS-Mono](vins-mono.md) — a complete system built around preintegrated IMU factors.
