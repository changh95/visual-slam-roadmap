# MLE & MAP

Maximum Likelihood Estimation (MLE) and Maximum A Posteriori (MAP) estimation are the two statistical principles that turn "SLAM" from a vague goal into a concrete optimization problem. Almost every SLAM back-end — filter or smoother — is computing one of these two estimates.

## Bayes' theorem sets the stage

Let $\mathbf{x}$ be the state (robot poses and map) and $\mathbf{z}$ the measurements (feature observations, IMU readings). Bayes' theorem relates what we want (the posterior) to what our sensor and motion models give us:

$$
p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

- $p(\mathbf{z} \mid \mathbf{x})$ — the **likelihood**: how probable the measurements are if the state were $\mathbf{x}$ (from the observation model).
- $p(\mathbf{x})$ — the **prior**: what we believe before seeing $\mathbf{z}$ (from a motion model, or previous estimates).
- $p(\mathbf{z})$ — a normalizer, irrelevant for optimization.

## The two estimators

**MAP** picks the state maximizing the posterior:

$$
\mathbf{x}^*_{\text{MAP}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

**MLE** drops the prior (equivalently, assumes a uniform prior) and maximizes the likelihood alone:

$$
\mathbf{x}^*_{\text{MLE}} = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})
$$

MAP = MLE + prior. In SLAM terms: pure [bundle adjustment](bundle-adjustment.md) over image observations is MLE; add motion-model factors, IMU factors, or a prior on the first pose, and you are doing MAP.

## From probabilities to least squares

The reason SLAM back-ends are *least-squares solvers* and not generic probabilistic inference engines is the Gaussian noise assumption. Take a measurement model $\mathbf{z} = h(\mathbf{x}) + \mathbf{v}$ with $\mathbf{v} \sim \mathcal{N}(\mathbf{0}, \Sigma)$. Then

$$
p(\mathbf{z} \mid \mathbf{x}) \propto \exp\!\left(-\tfrac{1}{2}\,\|\mathbf{z} - h(\mathbf{x})\|^2_{\Sigma^{-1}}\right)
$$

where $\|\mathbf{e}\|^2_{\Sigma^{-1}} = \mathbf{e}^T \Sigma^{-1} \mathbf{e}$ is the squared **Mahalanobis distance**. Taking the negative logarithm — which turns maximization into minimization and products of independent measurements into sums — the MAP problem becomes:

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

The first sum is the observation cost (e.g. [reprojection error](reprojection-error.md) with measurement covariance $R_t$); the second is the motion-model cost (odometry/IMU, with process covariance $Q_t$). Three consequences worth internalizing:

- **Squared errors are not arbitrary** — they are the negative log of a Gaussian. If the noise is not Gaussian (outliers!), the squared loss is the wrong likelihood, which is exactly why [M-estimators](m-estimator.md) exist.
- **Covariances become weights**: a confident sensor (small $\Sigma$) contributes a strongly weighted residual. Information matrices $\Omega = \Sigma^{-1}$ in g2o/GTSAM are precisely these weights.
- **Independence becomes sparsity**: each measurement depends on only a few state variables, so the log-posterior is a sum of small local terms — a [factor graph](factor-graph.md), whose structure the solver exploits.

## Filters vs. smoothers

The Extended Kalman Filter computes a recursive Gaussian approximation of the posterior one time step at a time (predict with $p(\mathbf{x})$, update with $p(\mathbf{z} \mid \mathbf{x})$), while modern smoothing back-ends solve the full MAP problem over the whole trajectory with [non-linear optimization](non-linear-optimization.md). Both are chasing the same posterior; they differ in what they approximate and when they linearize.

## Why it matters for SLAM

MLE/MAP is the bridge between the probabilistic *formulation* of SLAM and the optimization *machinery* that solves it. Every design decision downstream — why residuals are weighted by inverse covariances, why bundle adjustment minimizes squared reprojection error, why a prior factor anchors the gauge freedom, why outliers demand robust kernels — is a direct corollary of "MAP under Gaussian noise equals weighted nonlinear least squares". If you can re-derive that one line, most back-end papers become easy reading.

## Related

- [Basic Probability & Statistics](../level-01-beginner/basic-probability-and-statistics.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Factor graph](factor-graph.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Extended Kalman Filter](extended-kalman-filter.md)
