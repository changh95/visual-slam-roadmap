# Basic Probability & Statistics

SLAM is at its core a *probabilistic estimation problem*: given noisy sensor data, what is the most likely state (pose + map) of the robot? Probability theory provides the rigorous language for reasoning under uncertainty.

## Gaussian Distribution

The univariate Gaussian (normal) distribution with mean $\mu$ and standard deviation $\sigma$ has probability density function:

$$p(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

SLAM states are multi-dimensional, so we use the **multivariate Gaussian**. For a random vector $\mathbf{x} \in \mathbb{R}^n$ with mean $\boldsymbol{\mu}$ and covariance matrix $\boldsymbol{\Sigma}$ (symmetric positive definite):

$$p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\boldsymbol{\Sigma}|^{1/2}} \exp\!\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

The argument of the exponential, $(\mathbf{x}-\boldsymbol{\mu})^T\boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})$, is the **Mahalanobis distance** — a scale-invariant measure of how far $\mathbf{x}$ is from the mean. In SLAM, the covariance $\boldsymbol{\Sigma}$ encodes uncertainty: a large diagonal entry $\Sigma_{ii}$ means we are uncertain about the $i$-th component of the state.

Two properties make Gaussians the workhorse of estimation:

- **Closure under linear maps**: if $\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Sigma})$, then $\mathbf{y} = A\mathbf{x} + \mathbf{b}$ is Gaussian with mean $A\boldsymbol{\mu} + \mathbf{b}$ and covariance $A\boldsymbol{\Sigma}A^T$. This **covariance propagation** rule ($\Sigma_y = A\Sigma A^T$, with $A$ replaced by a Jacobian for nonlinear maps) is how uncertainty flows through a SLAM pipeline — from pixel noise to triangulated-point covariance to pose covariance.
- **Products of Gaussians are Gaussian** (up to normalization), which is why Bayesian updates with Gaussian priors and likelihoods stay tractable — the algebra behind the Kalman filter.

## Bayes' Theorem

Bayes' theorem is the engine of probabilistic SLAM. It relates the *posterior* $p(\mathbf{x}|\mathbf{z})$ (our belief about state $\mathbf{x}$ given observation $\mathbf{z}$) to the *likelihood* $p(\mathbf{z}|\mathbf{x})$ and *prior* $p(\mathbf{x})$:

$$p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

In SLAM, $\mathbf{x}$ is the robot pose (and map) and $\mathbf{z}$ is the camera image (or feature observations). The prior comes from a motion model; the likelihood comes from an observation model. Recursive application of Bayes' theorem — predict then update — is the basis of the Extended Kalman Filter (EKF-SLAM) and particle filters.

## MAP and MLE

Finding the state that maximizes the posterior is **Maximum A Posteriori (MAP)** estimation:

$$\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

When the prior is uniform, MAP reduces to **Maximum Likelihood Estimation (MLE)**. For Gaussian noise models, MLE is equivalent to minimizing a sum of squared errors — which is precisely what bundle adjustment does.

## From MLE to least squares (the key derivation)

Assume independent observations $\mathbf{z}_i$ with Gaussian noise: $\mathbf{z}_i = \mathbf{h}_i(\mathbf{x}) + \boldsymbol{\epsilon}_i$, $\boldsymbol{\epsilon}_i \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\Sigma}_i)$. The likelihood is a product, so its *negative logarithm* is a sum:

$$-\log \prod_i p(\mathbf{z}_i \mid \mathbf{x}) = \frac{1}{2}\sum_i \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big)^T \boldsymbol{\Sigma}_i^{-1} \big(\mathbf{z}_i - \mathbf{h}_i(\mathbf{x})\big) + \text{const}$$

Maximizing the likelihood therefore equals **minimizing the sum of squared Mahalanobis-weighted residuals**. This one line connects probability to optimization: bundle adjustment, pose graph optimization, and factor graph inference are all MAP estimation with Gaussian noise, and the information matrix $\boldsymbol{\Sigma}_i^{-1}$ is exactly the weight each residual gets.

## Common pitfalls

- **Confusing likelihood and posterior**: $p(\mathbf{z}|\mathbf{x})$ is a function of the state given fixed data; it does not integrate to 1 over $\mathbf{x}$.
- **Ignoring correlations**: treating $\boldsymbol{\Sigma}$ as diagonal when errors are correlated (e.g., after marginalization) makes the estimator overconfident — a root cause of *inconsistency* in SLAM.
- **Gaussian assumptions vs. outliers**: a single wrong feature match violates the Gaussian noise model badly enough to corrupt the whole estimate, which is why robust kernels and RANSAC exist.

## Why it matters for SLAM

The two dominant families of SLAM back-ends — filtering (EKF, particle filters) and smoothing (factor graphs, bundle adjustment) — are both direct applications of Bayesian estimation under Gaussian noise. Understanding Gaussians, Bayes' theorem, and the MAP/MLE connection is what lets you see that a Kalman filter update and a least-squares solve are two views of the same underlying inference problem.

## Related

- [Basic Calculus](basic-calculus.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md)
- [Consistency](../level-02-getting-familiar/consistency.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
