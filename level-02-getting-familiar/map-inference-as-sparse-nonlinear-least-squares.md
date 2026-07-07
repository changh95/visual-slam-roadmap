# MAP inference as sparse nonlinear least squares

This is the central theoretical identity of modern SLAM: **maximum a posteriori (MAP) estimation over a factor graph, under Gaussian noise, is exactly a sparse nonlinear least-squares problem.** Everything the back-end does follows from this one derivation.

## From Bayes to least squares

Start from Bayes' rule. We want the most probable states given the measurements:

$$
\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

With a motion model $\mathbf{x}_{t} = f(\mathbf{x}_{t-1}, \mathbf{u}_t) + \mathbf{w}_t$, $\mathbf{w}_t \sim \mathcal{N}(\mathbf{0}, Q_t)$ and an observation model $\mathbf{z}_t = h(\mathbf{x}_t, \mathbf{m}) + \mathbf{v}_t$, $\mathbf{v}_t \sim \mathcal{N}(\mathbf{0}, R_t)$, taking the negative log of the Gaussian product turns *maximizing probability* into *minimizing a sum of squared, covariance-weighted residuals*:

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

Each factor in the factor graph contributes one term; for visual SLAM the observation terms are reprojection errors, and the problem specializes to bundle adjustment. A useful bookkeeping identity: the covariance weighting can be absorbed into the residual, $\|\mathbf{r}\|^2_{\Sigma^{-1}} = \|\Sigma^{-1/2}\mathbf{r}\|^2$ ("whitening"), so every weighted problem is a plain least-squares problem on whitened residuals.

## Solving it: Gauss-Newton and Levenberg-Marquardt

The problem is *nonlinear* (projection, rotations) and is solved iteratively. **Gauss-Newton** linearizes the stacked residual $\mathbf{e}$ around the current estimate $\mathbf{x}_k$:

$$
\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}
$$

Substituting into the cost and minimizing over $\Delta\mathbf{x}$ yields the **normal equations**:

$$
(J_k^T J_k)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

The matrix $H = J^T J$ approximates the Hessian (dropping second-order terms). Gauss-Newton converges fast near the solution but can diverge from a poor initial estimate. **Levenberg-Marquardt** fixes this by damping:

$$
(J_k^T J_k + \lambda I)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

As $\lambda \to 0$ it behaves like Gauss-Newton (fast near the minimum); as $\lambda \to \infty$ it becomes a small steepest-descent step (robust far away). $\lambda$ is adapted per iteration — decreased when a step reduces the cost, increased when it doesn't. LM is the standard algorithm in Ceres and most SLAM back-ends.

The full iteration loop, with the manifold machinery from the Lie groups note:

1. Linearize all residuals at the current estimate (Jacobians with respect to tangent-space perturbations $\boldsymbol{\xi}$).
2. Solve the sparse (damped) normal equations for $\Delta\mathbf{x}$.
3. Update on the manifold: $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$ for each pose, plain addition for Euclidean variables.
4. Repeat until the cost or update norm converges.

**Robust kernels.** Real correspondence sets contain outliers, and a single bad squared residual can dominate the sum. Practical systems wrap each term in a robust loss $\rho$ (Huber: quadratic for small residuals, linear beyond a threshold; Cauchy: logarithmic growth that strongly down-weights gross outliers). The optimization is then solved as iteratively reweighted least squares — each residual gets weight $w_i = \rho'(r_i)/r_i$ — which fits into the exact same normal-equations machinery.

## Sparsity: the other half of the story

Each factor touches only a few variables (an observation involves one pose and one landmark), so $J$ and $H$ are overwhelmingly sparse and block-structured. Exploiting this is what makes SLAM tractable at scale — via sparse Cholesky/QR factorization, and via the Schur complement that eliminates all landmarks first in bundle adjustment (reducing a $(6m+3n)$-dimensional system to $6m$ camera variables, huge when landmarks vastly outnumber poses).

**Variable elimination and the Bayes tree.** Solving the sparse system can be viewed graph-theoretically: eliminate variables one by one from the factor graph, each elimination producing a conditional density and new induced factors on the remaining variables. The elimination *order* determines how much fill-in (density) is created — good orderings (e.g., COLAMD) keep the factorization sparse. Running elimination to completion yields a **Bayes net**, whose cliques organize into the **Bayes tree**: a directed tree of cliques in which each variable's solution depends only on its ancestors. The Bayes tree is more than an implementation detail — it reveals which parts of the solution are affected by a new measurement, which is precisely the structure iSAM2 exploits for incremental updates, and it explains marginalization (eliminating a variable permanently) as the same algebraic operation.

Two families of solving schedules build on this foundation:

- **Batch / full smoothing**: solve over all variables (bundle adjustment, pose graph optimization); most accurate, cost grows with trajectory length.
- **Incremental / fixed-lag**: update the Bayes tree incrementally (iSAM2), or bound the window and marginalize old variables (sliding-window VIO).

## Why it matters for SLAM

This formulation is the reason the field moved from filtering to optimization ("smoothing"): it re-linearizes wherever needed, handles arbitrary factor types uniformly, and scales via sparsity. Every back-end library (Ceres, g2o, GTSAM) is an implementation of exactly this pipeline, and every back-end paper you will read — from ORB-SLAM's BA to VINS-Mono's sliding window to iSAM2 — is a particular answer to "which variables, which factors, which elimination/solving schedule."

## Related

- [Factor graph](factor-graph.md)
- [Lie groups](lie-groups.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Visual-SLAM: Why filter?](../level-03-monocular-slam/visual-slam-why-filter.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
