# Consistency

Accuracy tells you *how wrong* an estimator is; **consistency** tells you whether the estimator *knows* how wrong it is. A SLAM estimator outputs both a state estimate $\hat{\mathbf{x}}$ (poses, landmarks) and a covariance $P$ that expresses its confidence. The estimator is consistent when the actual estimation errors are statistically compatible with that reported covariance — i.e., the estimator is neither overconfident (covariance too small) nor underconfident (covariance too large).

## NEES: the standard consistency test

The standard tool for checking consistency is the **NEES (Normalized Estimation Error Squared)**:

$$
\epsilon_k = (\mathbf{x}_k - \hat{\mathbf{x}}_k)^T P_k^{-1} (\mathbf{x}_k - \hat{\mathbf{x}}_k)
$$

where $\mathbf{x}_k$ is the ground-truth state at time $k$. If the estimator is consistent and the errors are Gaussian, the NEES follows a chi-squared distribution with $n = \dim(\mathbf{x})$ degrees of freedom, so its expected value equals the state dimension:

$$
\mathbb{E}[\epsilon_k] = n
$$

A single run's NEES is a noisy random variable, so the test is run as a **Monte Carlo experiment**: repeat the same scenario $M$ times with independent noise realizations and average,

$$
\bar{\epsilon}_k = \frac{1}{M} \sum_{i=1}^{M} \epsilon_k^{(i)}, \qquad M\,\bar{\epsilon}_k \sim \chi^2_{Mn},
$$

then check that $\bar{\epsilon}_k$ stays inside the confidence interval derived from the $\chi^2_{Mn}$ quantiles (divided by $M$). Interpretation:

- **Average NEES ≈ state dimension** — consistent.
- **Average NEES much larger** — overconfident: the filter trusts itself too much, which eventually causes divergence (measurements get down-weighted or rejected).
- **Average NEES much smaller** — conservative: not dangerous, but the estimator wastes information.

It is common to evaluate the position block and the orientation block of the state separately, so that one honest block cannot mask an overconfident one.

## NIS: testing without ground truth

NEES needs ground truth, which real robots rarely have. The companion test that works online is the **NIS (Normalized Innovation Squared)**: for a filter with innovation $\boldsymbol{\nu} = \mathbf{z} - h(\hat{\mathbf{x}})$ and innovation covariance $S$,

$$
\text{NIS} = \boldsymbol{\nu}^T S^{-1} \boldsymbol{\nu} \sim \chi^2_{\dim(\mathbf{z})}
$$

under consistency. You already use this idea constantly without calling it that: **chi-square gating** of measurements (reject an observation whose NIS exceeds a quantile threshold) is a per-measurement consistency test — and it only works if the covariances feeding it are honest.

## Why SLAM estimators become inconsistent

Consistency is a real, practical problem in SLAM, not just a theoretical nicety:

- **Linearization at changing estimates.** Filter-based and sliding-window estimators linearize nonlinear models, and linearizing the same variable at *different* estimates over time injects spurious information along directions that should be unobservable (e.g., global position and yaw in visual-inertial odometry). The covariance then shrinks along directions where no real information exists — overconfidence.
- **Frozen marginalization priors.** After marginalizing old states, the remaining prior is linearized at old estimates and cannot be re-linearized; mixing it with fresh Jacobians evaluated at newer estimates is the classic "FEJ problem" (see [Marginalization](marginalization.md)).
- **Gauge freedom.** In full SLAM the solution is defined only up to a global frame (and scale, for monocular). The covariance is singular along the gauge directions, so a naive NEES on the full state is ill-defined — fix the gauge (e.g., anchor the first pose) or evaluate errors in a gauge-invariant way.

## Remedies

Remedies you will meet in later levels:

- **First-Estimate Jacobians (FEJ)** — evaluate Jacobians of each variable at its first estimate so all information enters along consistent directions.
- **Observability-constrained designs** — explicitly project spurious information out of the unobservable subspace (as in OpenVINS-style filters).
- **Marginalization schemes that avoid re-linearizing frozen priors**, or that recover nonlinear factors instead of keeping a frozen linear prior.
- **Square-root / information-form implementations** for numerical health, so covariances do not lose positive-definiteness.

## Practical recipe

1. Build a simulation of your sensor setup with known ground truth and realistic noise parameters.
2. Run tens of Monte Carlo trials differing only in the noise seed.
3. Plot average NEES over time against the chi-squared bounds, separately for position and orientation blocks.
4. On real data, monitor NIS and the fraction of measurements rejected by the chi-square gate — a climbing rejection rate is the field symptom of an overconfident estimator.

## Why it matters for SLAM

Trajectory metrics like ATE/RPE only measure the mean error, so two systems with identical ATE can behave very differently downstream: an inconsistent one will feed overconfident covariances into loop-closure gating, sensor fusion, or a planner, and bad decisions follow. Whenever you evaluate or design a probabilistic SLAM back-end — especially an EKF or a fixed-lag smoother with marginalization — checking NEES on simulated data is the standard way to verify the estimator is honest about its uncertainty.

## Related

- [Metrics (ATE / RPE)](metrics.md)
- [Marginalization](marginalization.md)
- [Observability](../level-06-vio-vins/observability.md)
- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
