# MAP inference as sparse nonlinear least squares

This is the central theoretical identity of modern SLAM: **maximum a posteriori (MAP) estimation over a factor graph, under Gaussian noise, is exactly a sparse nonlinear least-squares problem.** Everything the back-end does follows from this one derivation.

Start from Bayes' rule. We want the most probable states given the measurements:

$$
\mathbf{x}^* = \arg\max_{\mathbf{x}}\, p(\mathbf{x} \mid \mathbf{z}) \propto p(\mathbf{z} \mid \mathbf{x})\, p(\mathbf{x})
$$

With a motion model $\mathbf{x}_{t} = f(\mathbf{x}_{t-1}, \mathbf{u}_t) + \mathbf{w}_t$, $\mathbf{w}_t \sim \mathcal{N}(\mathbf{0}, Q_t)$ and an observation model $\mathbf{z}_t = h(\mathbf{x}_t, \mathbf{m}) + \mathbf{v}_t$, $\mathbf{v}_t \sim \mathcal{N}(\mathbf{0}, R_t)$, taking the negative log of the Gaussian product turns *maximizing probability* into *minimizing a sum of squared, covariance-weighted residuals*:

$$
\mathbf{x}^* = \arg\min_{\mathbf{x}} \left[ \sum_t \|h(\mathbf{x}_t) - \mathbf{z}_t\|^2_{R_t^{-1}} + \sum_t \|f(\mathbf{x}_{t-1}, \mathbf{u}_t) - \mathbf{x}_t\|^2_{Q_t^{-1}} \right]
$$

Each factor in the factor graph contributes one term; for visual SLAM the observation terms are reprojection errors, and the problem specializes to bundle adjustment. The problem is *nonlinear* (projection, rotations) and is solved iteratively by Gauss-Newton or Levenberg-Marquardt: linearize the residuals, solve the normal equations $H \Delta\mathbf{x} = -\mathbf{b}$ with $H = J^T J$, update on the manifold, repeat.

**Sparsity is the other half of the story.** Each factor touches only a few variables (an observation involves one pose and one landmark), so $J$ and $H$ are overwhelmingly sparse and block-structured. Exploiting this is what makes SLAM tractable at scale — via sparse Cholesky/QR factorization, and via the Schur complement that eliminates all landmarks first in bundle adjustment.

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
