# Levenberg-Marquardt

Levenberg-Marquardt (LM) is the workhorse solver for nonlinear least-squares problems in SLAM. It is a damped version of [Gauss-Newton](gauss-newton.md) that interpolates between Gauss-Newton (fast near the minimum) and gradient descent (safe far from it), making it much more robust to poor initialization.

## From Gauss-Newton to LM

For a cost $F(\mathbf{x}) = \tfrac{1}{2}\|\mathbf{e}(\mathbf{x})\|^2$, Gauss-Newton linearizes the residual $\mathbf{e}(\mathbf{x}_k + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}_k) + J_k \Delta\mathbf{x}$ and solves the normal equations

$$
(J_k^T J_k)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

This can diverge when the linearization is a bad approximation, or when $J_k^T J_k$ is (nearly) singular. LM adds a **damping term** $\lambda I$:

$$
(J_k^T J_k + \lambda I)\,\Delta\mathbf{x} = -J_k^T \mathbf{e}(\mathbf{x}_k)
$$

where:

- $J_k$ is the Jacobian of the residual vector at the current estimate $\mathbf{x}_k$,
- $\lambda > 0$ is the damping parameter,
- $\Delta\mathbf{x}$ is the update, applied as $\mathbf{x}_{k+1} = \mathbf{x}_k + \Delta\mathbf{x}$ (or via the exponential map for poses on a manifold).

The two limits explain the behavior:

- $\lambda \to 0$: the equation reduces to Gauss-Newton — large, aggressive steps with near-quadratic convergence close to the minimum.
- $\lambda \to \infty$: the equation approaches $\lambda\,\Delta\mathbf{x} = -J_k^T\mathbf{e}$, i.e. a short step along the negative gradient — slow but reliable descent.

Marquardt's refinement scales the damping by the curvature of each coordinate, replacing $\lambda I$ with $\lambda\,\mathrm{diag}(J_k^T J_k)$, so that weakly constrained directions get damped more and the method becomes invariant to per-parameter rescaling.

## Adapting the damping

$\lambda$ is adjusted every iteration based on whether the step actually helped:

1. Solve for $\Delta\mathbf{x}$ with the current $\lambda$.
2. Evaluate the true cost at $\mathbf{x}_k + \Delta\mathbf{x}$.
3. If the cost decreased: accept the step and **decrease** $\lambda$ (trust the linearization more).
4. If the cost increased: reject the step and **increase** $\lambda$ (take a smaller, more gradient-like step), then re-solve.

A common refinement compares the actual cost reduction against the reduction predicted by the linearized model (the **gain ratio**): a ratio near 1 means the local quadratic model is trustworthy and $\lambda$ can shrink aggressively; a small or negative ratio means the model is poor and $\lambda$ must grow. This is exactly the logic of a **trust-region method** — LM can be read as implicitly maintaining a region around $\mathbf{x}_k$ within which the linearization is trusted, with $\lambda$ inversely related to the region's radius.

## Practical notes for SLAM problems

- The damped system matrix $J^T J + \lambda I$ is always positive definite for $\lambda > 0$, so Cholesky factorization always succeeds — important for gauge-underconstrained problems such as monocular bundle adjustment.
- The sparsity of the SLAM Hessian is preserved: damping only touches the diagonal, so the Schur complement trick for bundle adjustment works unchanged.
- Robust kernels ([M-estimators](m-estimator.md)) fold into LM as iteratively reweighted least squares — weights modify $J$ and $\mathbf{e}$, the LM loop is otherwise identical.
- LM is the default optimizer in Ceres Solver, g2o, and GTSAM, and hence the algorithm actually running inside most SLAM back-ends.

## Why it matters for SLAM

Nearly every optimization in a modern SLAM pipeline — [bundle adjustment](bundle-adjustment.md), pose graph optimization, PnP refinement, camera calibration — is solved with LM. SLAM problems are highly nonlinear (projection, rotation manifolds) and initializations are often mediocre (motion-model predictions, noisy triangulations), so the pure Gauss-Newton step frequently overshoots. LM's automatic damping is what makes these solvers converge reliably frame after frame without hand-tuning, which is why it has been the default in SLAM back-ends for decades.

## Related

- [Gauss-Newton](gauss-newton.md)
- [Non-linear optimization](non-linear-optimization.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Reprojection error](reprojection-error.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)
