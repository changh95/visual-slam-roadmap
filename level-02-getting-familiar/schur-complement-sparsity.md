# Schur complement / Sparsity

Bundle adjustment looks intractable at first glance: a modest map with $m$ keyframes and $n$ points has $6m + 3n$ unknowns, and $n$ is easily in the hundreds of thousands. What makes it practical is that the problem is **sparse**, and the **Schur complement** is the trick that exploits that sparsity.

**Where the sparsity comes from.** Each reprojection-error term involves exactly one pose and one point. So in the Gauss-Newton normal equations $H \Delta\mathbf{x} = -\mathbf{b}$ with $H = J^T J$, the Hessian has the arrow-like block structure

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

where $B$ ($6m \times 6m$) couples only poses, $C$ ($3n \times 3n$) couples only points, and $E$ holds the pose-point coupling. Crucially, two points never appear in the same residual, so $C$ is **block-diagonal** — one independent $3 \times 3$ block per point.

**The Schur complement step** (also called *marginalizing out the points*) eliminates the point variables from the linear system, leaving the reduced camera system:

$$\left(B - E C^{-1} E^T\right) \Delta\mathbf{x}_{\text{cam}} = -\mathbf{b}_{\text{cam}} + E C^{-1} \mathbf{b}_{\text{pts}}$$

Because $C$ is block-diagonal, $C^{-1}$ costs almost nothing (invert each $3 \times 3$ block). One solves the $6m \times 6m$ reduced system for the pose update, then back-substitutes to recover each point update independently. A $(6m + 3n)$-dimensional solve becomes a $6m$-dimensional one — orders of magnitude faster when $n \gg m$, which is always.

Two further layers of sparsity matter in practice. First, the reduced camera matrix $B - EC^{-1}E^T$ is itself sparse: entry $(i, j)$ is non-zero only if keyframes $i$ and $j$ observe a common point (the covisibility structure), so sparse Cholesky factorization with good variable ordering (COLAMD) applies. Second, the same elimination viewpoint generalises: in factor-graph terms, the Schur complement is just variable elimination, the operation underlying marginalization in sliding-window VIO and incremental smoothers like iSAM2.

## Where the formula comes from

The Schur complement is nothing more exotic than block Gaussian elimination. Write out the two block rows of the normal equations:

$$B\,\Delta\mathbf{x}_{\text{cam}} + E\,\Delta\mathbf{x}_{\text{pts}} = -\mathbf{b}_{\text{cam}}$$
$$E^T \Delta\mathbf{x}_{\text{cam}} + C\,\Delta\mathbf{x}_{\text{pts}} = -\mathbf{b}_{\text{pts}}$$

Solve the second row for the point update, $\Delta\mathbf{x}_{\text{pts}} = -C^{-1}\left(\mathbf{b}_{\text{pts}} + E^T \Delta\mathbf{x}_{\text{cam}}\right)$, and substitute into the first — the reduced camera system above appears immediately, and the same expression *is* the back-substitution rule once $\Delta\mathbf{x}_{\text{cam}}$ is known. Statistically, the reduced system is the information-matrix form of the *marginal* over the cameras: eliminating the points does not approximate anything, it re-expresses the same Gaussian exactly.

**Counting the win.** A dense solve of the full system costs $O((6m + 3n)^3)$. With the Schur trick: inverting $C$ is $n$ independent $3\times 3$ inversions ($O(n)$), forming the reduced system is bounded by the number of observations, and the remaining solve is $O((6m)^3)$ worst-case — usually far less thanks to covisibility sparsity. With $m$ in the hundreds and $n$ in the hundreds of thousands, the point elimination is the difference between milliseconds and minutes. When $m$ itself grows large (city-scale SfM), even the reduced system stops being cheap to factor, and solvers switch to iterative methods (preconditioned conjugate gradient on the Schur complement — Ceres' `ITERATIVE_SCHUR`).

In Ceres, all of this is one configuration choice:

```cpp
ceres::Solver::Options options;
options.linear_solver_type = ceres::SPARSE_SCHUR;  // or DENSE_SCHUR, ITERATIVE_SCHUR
```

with the solver automatically detecting the pose/point elimination ordering (or taking an explicit `ParameterBlockOrdering`). Every serious solver — Ceres, g2o, GTSAM — implements the same trick; knowing it explains why BA scales, why marginalizing old states creates fill-in (dense blocks) in the remaining Hessian, and why solver choice and ordering can change runtime by orders of magnitude.

## Common pitfalls

- **Eliminating in the wrong order** — the trick works because points are many, cheap, and mutually independent; eliminating *poses* first couples all their points together and densifies the system. Elimination order is a correctness-of-performance decision.
- **Confusing marginalization with deletion** — dropping old states and *marginalizing* them are different: marginalization keeps their information as a dense prior over their neighbours (fill-in). That density is why sliding-window VIO systems carefully choose what to marginalize versus discard.
- **Gauge freedom** — full BA has 7 unobservable DoF for monocular (6 + scale); without fixing a pose (or adding priors), the reduced camera matrix is singular and the solver limps or fails.
- **Ill-conditioning from far points** — points at near-infinite depth make their $3\times3$ blocks nearly singular; inverse-depth parameterisation or depth priors keep $C^{-1}$ well-behaved.

## Why it matters for SLAM

Real-time SLAM exists because of structure-exploiting linear algebra: without the Schur complement, bundle adjustment over even a few hundred keyframes would be hopeless. The same idea — eliminate variables, keep the problem sparse — reappears in marginalization, sliding-window estimators, and incremental smoothing, so this is one of the highest-leverage pieces of math on the whole roadmap.

## Related

- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Marginalization](marginalization.md)
- [Math libraries](math-libraries.md)
