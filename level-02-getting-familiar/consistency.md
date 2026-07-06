# Consistency

Accuracy tells you *how wrong* an estimator is; **consistency** tells you whether the estimator *knows* how wrong it is. A SLAM estimator outputs both a state estimate $\hat{\mathbf{x}}$ (poses, landmarks) and a covariance $P$ that expresses its confidence. The estimator is consistent when the actual estimation errors are statistically compatible with that reported covariance — i.e., the estimator is neither overconfident (covariance too small) nor underconfident (covariance too large).

The standard tool for checking this is the **NEES (Normalized Estimation Error Squared)**:

$$
\text{NEES} = (\mathbf{x} - \hat{\mathbf{x}})^T P^{-1} (\mathbf{x} - \hat{\mathbf{x}})
$$

where $\mathbf{x}$ is the ground-truth state. If the estimator is consistent and the errors are Gaussian, the NEES follows a chi-squared distribution with $\dim(\mathbf{x})$ degrees of freedom, so its expected value equals the state dimension. In practice you run many Monte Carlo trials (or many trajectory segments), average the NEES, and check whether it stays inside the chi-squared confidence bounds:

- **Average NEES ≈ state dimension** — consistent.
- **Average NEES much larger** — overconfident: the filter trusts itself too much, which eventually causes divergence (measurements get down-weighted or rejected).
- **Average NEES much smaller** — conservative: not dangerous, but the estimator wastes information.

Consistency is a real, practical problem in SLAM, not just a theoretical nicety. Filter-based and sliding-window estimators linearize nonlinear models, and linearizing the same variable at *different* estimates over time injects spurious information along directions that should be unobservable (e.g., global position and yaw in visual-inertial odometry). The result is a covariance that shrinks faster than the true error, i.e., overconfidence. Remedies you will meet in later levels include First-Estimate Jacobians (FEJ), observability-constrained filter designs (as in OpenVINS), and marginalization schemes that avoid re-linearizing frozen priors.

## Why it matters for SLAM

Trajectory metrics like ATE/RPE only measure the mean error, so two systems with identical ATE can behave very differently downstream: an inconsistent one will feed overconfident covariances into loop-closure gating, sensor fusion, or a planner, and bad decisions follow. Whenever you evaluate or design a probabilistic SLAM back-end — especially an EKF or a fixed-lag smoother with marginalization — checking NEES on simulated data is the standard way to verify the estimator is honest about its uncertainty.

## Related

- [Metrics (ATE / RPE)](metrics.md)
- [Marginalization](marginalization.md)
- [Observability](../level-06-vio-vins/observability.md)
- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
