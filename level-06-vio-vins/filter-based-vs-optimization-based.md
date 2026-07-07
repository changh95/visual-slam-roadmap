# Filter-based vs Optimization-based

Within tightly-coupled VIO there are two estimation paradigms. Both solve the same probabilistic inference problem; they differ in how often they are willing to *re-linearize* it.

## Filter-based (EKF)

Filter-based methods (MSCKF, ROVIO, OpenVINS) maintain a state vector $\mathbf{x}$ and covariance $\mathbf{P}$ updated recursively:

- **Propagate** with IMU measurements: $\mathbf{x} \leftarrow f(\mathbf{x}, \tilde{\boldsymbol{\omega}}, \tilde{\mathbf{a}})$, $\;\mathbf{P} \leftarrow \boldsymbol{\Phi}\mathbf{P}\boldsymbol{\Phi}^\top + \mathbf{Q}$.
- **Update** with visual measurements: with residual $\mathbf{r} = \mathbf{z} - h(\mathbf{x})$ and Jacobian $\mathbf{H}$, apply the Kalman gain $\mathbf{K} = \mathbf{P}\mathbf{H}^\top(\mathbf{H}\mathbf{P}\mathbf{H}^\top + \mathbf{R})^{-1}$ and absorb the measurement into the Gaussian belief.

Each measurement is linearized *once*, at the moment it is processed. That gives constant-time, low-latency updates — but the linearization point is permanent: if the estimate later moves, the already-absorbed information cannot be re-linearized, and accumulated linearization error causes drift and (without care) inconsistency. MSCKF's insight was to make the EKF window-shaped — keeping a sliding set of past camera poses in the state and applying feature constraints structurelessly — so even "filtering" VIO is secretly windowed.

## Optimization-based (sliding-window BA)

Optimization-based methods (OKVIS, VINS-Mono, Basalt, ORB-SLAM3) keep a *sliding window* of recent keyframe states and minimize a joint nonlinear cost — reprojection residuals, preintegrated IMU residuals, and a marginalization prior — with Gauss-Newton or Levenberg-Marquardt:

$$\min_{\mathcal{X}} \; \|\mathbf{r}_p\|^2 + \sum \|\mathbf{r}_{\text{IMU}}\|^2_{\Sigma^{-1}} + \sum \rho\left(\|\mathbf{r}_{\text{reproj}}\|^2_{R^{-1}}\right)$$

Because every solver iteration re-linearizes all residuals in the window at the current estimate, linearization error is much smaller, and accuracy is correspondingly higher — at higher computational cost. Old states are compressed into the prior $\mathbf{r}_p$ by Schur-complement marginalization, which is where the paradigms meet (see below).

## Comparison

| | Filter (EKF) | Sliding-window optimization |
|---|---|---|
| Linearization | Once per measurement | Re-linearized every iteration |
| Cost | Low, constant-time | Higher, grows with window size |
| Accuracy | Good | Better (typically) |
| Latency | Very low (one update per measurement) | Higher (iterative solve per frame) |
| Consistency tools | First-Estimate Jacobians (FEJ), observability constraints | FEJ on the marginalization prior; nonlinear factor recovery (Basalt); delayed marginalization (DM-VIO) |
| Representative systems | MSCKF, ROVIO, OpenVINS | OKVIS, VINS-Mono, Basalt, ORB-SLAM3 |

## The two families are closer than they appear

- A sliding-window optimizer that marginalizes old states via the Schur complement is mathematically performing a *filtering* step on the marginalized part — the prior it creates is linearized once and frozen, exactly like an EKF update.
- Conversely, an EKF is an optimizer that stops after a single Gauss-Newton iteration; the *iterated* EKF (used in ROVIO's update step) re-linearizes within an update and moves further toward the optimization side.
- Both families suffer the same disease at their frozen linearization points — spurious information gain along unobservable directions — and both use the same medicine (FEJ and its relatives). The consistency literature that grew out of MSCKF applies to the marginalization prior of every sliding-window system.

So the practical difference is not "recursive vs batch" but *where each design spends its compute budget*: filters spend almost nothing on re-linearization and everything on throughput; optimizers buy accuracy by re-linearizing a small, well-chosen window.

## Choosing in practice

- **Hard real-time, embedded compute, high-rate control loops** → filter (MSCKF/OpenVINS class). Constant, predictable per-frame cost; this efficiency profile is why filter-style estimators are associated with deployed AR/VR tracking.
- **Accuracy-critical mapping, offline or desktop-class compute** → sliding-window optimization, or optimization plus a mapping back-end (Basalt, OKVIS2).
- **Study both failure modes**: filter inconsistency shows up as overconfident covariance and yaw drift; optimizer latency shows up as dropped frames under load. The patch literature — FEJ, observability-constrained EKF, nonlinear factor recovery, delayed marginalization — exists precisely to treat these.

## Common pitfalls

- Comparing a filter and an optimizer at different compute budgets and concluding one paradigm is "better" — the classic "why filter?" analysis (Strasdat et al.) is a *fixed-budget* argument: re-linearizing a small keyframe window beats filtering a large state.
- Treating the marginalization prior of a sliding-window system as exact — it is a one-shot linearization, and ignoring that (no FEJ handling) reintroduces filter-style inconsistency into an "optimization-based" system.
- Assuming filters cannot be accurate: with FEJ, online calibration, and good front-ends, modern MSCKF implementations are competitive on standard benchmarks at a fraction of the cost.

## Why it matters for SLAM
This is the VIO version of the classic "why filter?" question studied for visual SLAM (Strasdat et al.): given a fixed compute budget, re-linearizing a small window of keyframes beats filtering a large state. Knowing the failure mode of each side — filter inconsistency vs optimizer latency — tells you which system to pick for a given platform and which papers (FEJ, nonlinear factor recovery, delayed marginalization) exist to patch those failure modes.

## Related
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md) — the foundational analysis of this trade-off.
- [MSCKF](msckf.md) — the canonical filter-based VIO.
- [OKVIS](okvis.md) — the canonical optimization-based VIO.
- [Basalt](basalt.md) — nonlinear factor recovery to fix marginalization-prior linearization error.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the mechanism connecting both worlds.
- [Consistency](../level-02-getting-familiar/consistency.md) — the estimator property at stake in this choice.

[Back to Level 6](../README.md#level-6-vio--vins)
