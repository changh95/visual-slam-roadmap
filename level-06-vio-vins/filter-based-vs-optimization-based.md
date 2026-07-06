# Filter-based vs Optimization-based

Within tightly-coupled VIO there are two estimation paradigms.

**Filter-based** methods (MSCKF, ROVIO, OpenVINS) maintain a state vector and covariance matrix updated recursively in an Extended Kalman Filter. Each measurement is linearized *once*, at the moment it is processed, and then absorbed into the Gaussian belief. This gives constant-time, low-latency updates — but the single linearization point is permanent: if the estimate later moves, the already-absorbed information cannot be re-linearized, and accumulated linearization error causes drift and (without care) inconsistency.

**Optimization-based** methods (OKVIS, VINS-Mono, Basalt, ORB-SLAM3) keep a *sliding window* of recent keyframe states and minimize a joint nonlinear cost — reprojection residuals, preintegrated IMU residuals, and a marginalization prior — with Gauss-Newton or Levenberg-Marquardt:

$$\min_{\mathcal{X}} \; \|\mathbf{r}_p\|^2 + \sum \|\mathbf{r}_{\text{IMU}}\|^2_{\Sigma^{-1}} + \sum \rho\left(\|\mathbf{r}_{\text{reproj}}\|^2_{R^{-1}}\right)$$

Because every solver iteration re-linearizes all residuals in the window at the current estimate, linearization error is much smaller, and accuracy is correspondingly higher — at higher computational cost.

| | Filter (EKF) | Sliding-window optimization |
|---|---|---|
| Linearization | Once per measurement | Re-linearized every iteration |
| Cost | Low, constant-time | Higher, grows with window size |
| Accuracy | Good | Better (typically) |
| Consistency tools | First-Estimate Jacobians (FEJ), observability constraints | FEJ on the marginalization prior; nonlinear factor recovery (Basalt); delayed marginalization (DM-VIO) |
| Representative systems | MSCKF, ROVIO, OpenVINS | OKVIS, VINS-Mono, Basalt, ORB-SLAM3 |

The two families are closer than they appear: a sliding-window optimizer that marginalizes old states via the Schur complement is mathematically a form of filtering on the marginalized part, and an EKF is an optimizer that stops after one Gauss-Newton iteration. The practical difference is where each spends its compute budget. Filters remain attractive on embedded platforms with hard real-time constraints; optimization dominates when accuracy is the priority.

## Why it matters for SLAM
This is the VIO version of the classic "why filter?" question studied for visual SLAM (Strasdat et al.): given a fixed compute budget, re-linearizing a small window of keyframes beats filtering a large state. Knowing the failure mode of each side — filter inconsistency vs optimizer latency — tells you which system to pick for a given platform and which papers (FEJ, nonlinear factor recovery, delayed marginalization) exist to patch those failure modes.

## Related
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md) — the foundational analysis of this trade-off.
- [MSCKF](msckf.md) — the canonical filter-based VIO.
- [OKVIS](okvis.md) — the canonical optimization-based VIO.
- [Basalt](basalt.md) — nonlinear factor recovery to fix marginalization-prior linearization error.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the mechanism connecting both worlds.

[Back to Level 6](../README.md#level-6-vio--vins)
