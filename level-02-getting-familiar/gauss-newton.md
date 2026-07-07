# Gauss-Newton

**Gauss-Newton** is the fundamental iterative algorithm for nonlinear least squares — the problem class that virtually every SLAM back-end computation (bundle adjustment, pose graph optimization, PnP refinement, direct image alignment) reduces to. It exploits the special *sum-of-squares* structure of the cost to get near-second-order convergence while only ever computing first derivatives.

## Derivation

We minimize a cost built from a residual vector $\mathbf{e}(\mathbf{x}) \in \mathbb{R}^m$ over a state $\mathbf{x} \in \mathbb{R}^n$:

$$
F(\mathbf{x}) = \frac{1}{2} \|\mathbf{e}(\mathbf{x})\|^2
$$

Linearize the residual (not the cost) around the current estimate $\mathbf{x}_k$ using the Jacobian $J_k = \partial \mathbf{e} / \partial \mathbf{x}$ evaluated at $\mathbf{x}_k$:

$$
\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}
$$

Substituting gives a *quadratic* model of the cost in $\Delta\mathbf{x}$:

$$
F(\mathbf{x}_k + \Delta\mathbf{x}) \approx \frac{1}{2}\|\mathbf{e}_k\|^2 + \Delta\mathbf{x}^T J_k^T \mathbf{e}_k + \frac{1}{2} \Delta\mathbf{x}^T J_k^T J_k \Delta\mathbf{x}
$$

Setting the derivative with respect to $\Delta\mathbf{x}$ to zero yields the **normal equations**:

$$
(J_k^T J_k)\, \Delta\mathbf{x} = -J_k^T \mathbf{e}_k
$$

Solve for $\Delta\mathbf{x}$ (in practice by Cholesky factorization of the sparse $J^T J$, never by explicit inversion), update $\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$, re-linearize, repeat until the update or the cost change is negligible.

With measurement covariances, residuals are weighted by information matrices $\Omega = \Sigma^{-1}$ and the normal equations become $J^T \Omega J \,\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$ — the same algebra, and precisely MAP estimation under Gaussian noise.

## Relation to Newton's method

Newton's method uses the true Hessian of $F$:

$$
\nabla^2 F = J^T J + \sum_i e_i \, \nabla^2 e_i
$$

Gauss-Newton **drops the second term**, approximating $H \approx J^T J$. This is cheap (no second derivatives) and accurate when residuals are small at the optimum (a good model fitting well) or nearly linear — exactly the regime of a converging SLAM problem. Near the solution the convergence is close to quadratic. The approximation also guarantees $H \succeq 0$, so the computed step is a descent direction whenever $H$ is nonsingular.

## Failure modes

- **Divergence far from the optimum**: the linearization can be so poor that the full step increases the cost. Gauss-Newton has no step-size control; Levenberg-Marquardt fixes this by damping the normal equations.
- **Singular or ill-conditioned $J^T J$**: unobservable directions (monocular scale, the global gauge freedom of BA — the whole solution can translate/rotate freely) make $H$ rank-deficient. Remedies: fix a pose, add a prior, or use LM's damping.
- **Local minima**: like all local methods, it converges to the basin it starts in — hence SLAM's obsession with good initialization.

## On manifolds

Poses live on $\mathrm{SE}(3)$, not $\mathbb{R}^n$, so the update is applied through the exponential map: parameterize the increment as $\boldsymbol{\xi} \in \mathbb{R}^6$, solve the normal equations for $\boldsymbol{\xi}$, and update $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$. The Jacobians are taken with respect to this local perturbation. All SLAM solvers (g2o, Ceres, GTSAM) implement Gauss-Newton/LM in this "optimize a local vector, retract onto the manifold" form.

## Why it matters for SLAM

Gauss-Newton is *the* inner loop of SLAM. Bundle adjustment is Gauss-Newton/LM on reprojection errors, where the sparse block structure of $J^T J$ (poses coupled to points only through observations) is exploited via the Schur complement; pose graph optimization is Gauss-Newton on relative-pose residuals; direct methods (LSD-SLAM, DSO) run it on photometric errors; even ICP's alignment step is a Gauss-Newton iteration. Reading any SLAM back-end paper requires fluency in the vocabulary defined here — residual, Jacobian, Hessian approximation, normal equations, damping — and most practical debugging (why did my optimization diverge? why is my Hessian singular?) traces back to the assumptions listed above.

## Related

- [Non-linear optimization](non-linear-optimization.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Reprojection error](reprojection-error.md)
- [Bundle adjustment](bundle-adjustment.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
