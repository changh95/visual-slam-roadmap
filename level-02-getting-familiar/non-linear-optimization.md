# Non-linear Optimization

SLAM estimation ultimately reduces to minimizing a cost function

$$
F(\mathbf{x}) = \frac{1}{2}\sum_i \|\mathbf{e}_i(\mathbf{x})\|^2_{\Sigma_i^{-1}}
$$

over the state $\mathbf{x}$ (poses, landmarks, biases), where each $\mathbf{e}_i$ is a residual — a reprojection error, an odometry error, an IMU error — weighted by its inverse covariance. The residuals are **non-linear** in the state: camera projection divides by depth, and rotations live on a curved manifold. So there is no closed-form solution; we must iterate.

## The iterative descent template

All practical solvers share one loop: starting from an initial guess $\mathbf{x}_0$, repeatedly find an update $\Delta\mathbf{x}$ that decreases the cost, apply it, and stop when the update or the gradient becomes tiny. Methods differ in how they pick $\Delta\mathbf{x}$:

- **Gradient descent**: $\Delta\mathbf{x} = -\alpha\, \nabla F$. Only needs first derivatives, but zig-zags and converges slowly (linearly) — rarely used directly in SLAM.
- **Newton's method**: solve $H\,\Delta\mathbf{x} = -\nabla F$ with the true Hessian $H$. Quadratic convergence, but second derivatives of residuals are expensive and $H$ may not be positive definite far from the optimum.
- **[Gauss-Newton](gauss-newton.md)**: exploit the least-squares structure. Linearize each residual, $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\Delta\mathbf{x}$, and solve the normal equations $(J^T J)\,\Delta\mathbf{x} = -J^T\mathbf{e}$. The matrix $J^T J$ approximates the Hessian using only first derivatives — the key trick that makes large-scale SLAM tractable.
- **[Levenberg-Marquardt](levenberg-marquardt.md)**: Gauss-Newton with adaptive damping, $(J^T J + \lambda I)\,\Delta\mathbf{x} = -J^T\mathbf{e}$, blending toward gradient descent when the linearization is untrustworthy. The de-facto default.
- **Dogleg / trust-region**: explicitly maintain a region radius and combine the Gauss-Newton and gradient steps inside it; comparable in spirit to LM, often faster on bundle adjustment.

## Optimization on manifolds

Camera poses are elements of $\mathrm{SE}(3)$, not vectors — naively adding an update to a rotation matrix destroys orthogonality. The standard fix is to optimize a **local perturbation** $\boldsymbol{\xi} \in \mathbb{R}^6$ in the [Lie algebra](lie-groups.md) and apply it through the exponential map:

$$
T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})
$$

The solver only ever sees the small vector $\boldsymbol{\xi}$; the retraction keeps the state on the manifold. Every SLAM library implements this (local parameterizations in Ceres, vertex `oplus` in g2o, retractions in GTSAM).

## What makes SLAM problems solvable

- **Sparsity.** Each residual touches very few variables (one pose + one landmark, or two poses), so $J^T J$ is extremely sparse. Sparse Cholesky and the Schur complement turn otherwise-impossible problems (tens of thousands of variables) into real-time ones.
- **Good initialization.** These methods only find the *local* minimum of a non-convex cost. SLAM survives because it always has a decent initial guess — the previous frame's pose, a motion model, a minimal-solver result from RANSAC. Cold-start problems (relocalization, map merging) are hard precisely because this guess is missing.
- **Robustness.** Squared costs assume Gaussian noise; real matchers produce outliers. Robust kernels ([M-estimators](m-estimator.md)) reshape the cost so gross errors stop dominating, at the price of more non-convexity.

## Reading a solver's output

Iterations are stopped by practical criteria: the cost decrease per iteration falls below a tolerance, the update norm $\|\Delta\mathbf{x}\|$ becomes negligible, the gradient norm approaches zero, or an iteration/time budget is exhausted (real-time systems often cap bundle adjustment at a handful of iterations per keyframe). When a solve goes wrong, the symptoms map to causes: cost exploding usually means a bad initial guess or a Jacobian bug; cost stalling high with many small steps suggests convergence to a poor local minimum or unmodeled outliers; a rank-deficient normal-equation matrix points to unobservable directions (gauge freedom, unconstrained landmarks) that need priors or fixing.

## Why it matters for SLAM

The back-end of every modern SLAM system — bundle adjustment, pose graph optimization, VIO sliding windows, direct photometric alignment — is an instance of sparse non-linear least squares solved with Gauss-Newton/LM iterations on a manifold. The probabilistic view ([MLE & MAP](mle-and-map.md)) says *what* to minimize; non-linear optimization is *how*. Fluency here pays off everywhere: reading a paper's "we minimize the following energy" section, diagnosing divergence (bad initialization? wrong parameterization? outliers?), and using Ceres/g2o/GTSAM effectively all rest on this material.

## Hands-on

- [Ceres-solver hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_15)

## Related

- [Gauss-Newton](gauss-newton.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [MLE & MAP](mle-and-map.md)
- [Bundle Adjustment](bundle-adjustment.md)
- [Lie groups](lie-groups.md)
