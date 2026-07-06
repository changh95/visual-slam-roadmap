# Basic Probability & Statistics

SLAM is at its core a *probabilistic estimation problem*: given noisy sensor data, what is the most likely state (pose + map) of the robot? Probability theory provides the rigorous language for reasoning under uncertainty.

## Gaussian Distribution

The univariate Gaussian (normal) distribution with mean $\mu$ and standard deviation $\sigma$ has probability density function:

$$p(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

SLAM states are multi-dimensional, so we use the **multivariate Gaussian**. For a random vector $\mathbf{x} \in \mathbb{R}^n$ with mean $\boldsymbol{\mu}$ and covariance matrix $\boldsymbol{\Sigma}$ (symmetric positive definite):

$$p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\boldsymbol{\Sigma}|^{1/2}} \exp\!\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

The argument of the exponential, $(\mathbf{x}-\boldsymbol{\mu})^T\boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})$, is the **Mahalanobis distance** — a scale-invariant measure of how far $\mathbf{x}$ is from the mean. In SLAM, the covariance $\boldsymbol{\Sigma}$ encodes uncertainty: a large diagonal entry $\Sigma_{ii}$ means we are uncertain about the $i$-th component of the state.

## Bayes' Theorem

Bayes' theorem is the engine of probabilistic SLAM. It relates the *posterior* $p(\mathbf{x}|\mathbf{z})$ (our belief about state $\mathbf{x}$ given observation $\mathbf{z}$) to the *likelihood* $p(\mathbf{z}|\mathbf{x})$ and *prior* $p(\mathbf{x})$:

$$p(\mathbf{x} \mid \mathbf{z}) = \frac{p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})}{p(\mathbf{z})} \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

In SLAM, $\mathbf{x}$ is the robot pose (and map) and $\mathbf{z}$ is the camera image (or feature observations). The prior comes from a motion model; the likelihood comes from an observation model. Recursive application of Bayes' theorem — predict then update — is the basis of the Extended Kalman Filter (EKF-SLAM) and particle filters.

## MAP and MLE

Finding the state that maximizes the posterior is **Maximum A Posteriori (MAP)** estimation:

$$\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) = \arg\max_{\mathbf{x}}\, p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})$$

When the prior is uniform, MAP reduces to **Maximum Likelihood Estimation (MLE)**. For Gaussian noise models, MLE is equivalent to minimizing a sum of squared errors — which is precisely what bundle adjustment does.

## Why it matters for SLAM

The two dominant families of SLAM back-ends — filtering (EKF, particle filters) and smoothing (factor graphs, bundle adjustment) — are both direct applications of Bayesian estimation under Gaussian noise. Understanding Gaussians, Bayes' theorem, and the MAP/MLE connection is what lets you see that a Kalman filter update and a least-squares solve are two views of the same underlying inference problem.

## Related

- [Basic Calculus](basic-calculus.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md)

[Back to Level 1](../README.md#level-1-beginner)
