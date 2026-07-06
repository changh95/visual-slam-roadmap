# Schur complement / Sparsity

Bundle adjustment looks intractable at first glance: a modest map with $m$ keyframes and $n$ points has $6m + 3n$ unknowns, and $n$ is easily in the hundreds of thousands. What makes it practical is that the problem is **sparse**, and the **Schur complement** is the trick that exploits that sparsity.

**Where the sparsity comes from.** Each reprojection-error term involves exactly one pose and one point. So in the Gauss-Newton normal equations $H \Delta\mathbf{x} = -\mathbf{b}$ with $H = J^T J$, the Hessian has the arrow-like block structure

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

where $B$ ($6m \times 6m$) couples only poses, $C$ ($3n \times 3n$) couples only points, and $E$ holds the pose-point coupling. Crucially, two points never appear in the same residual, so $C$ is **block-diagonal** — one independent $3 \times 3$ block per point.

**The Schur complement step** (also called *marginalizing out the points*) eliminates the point variables from the linear system, leaving the reduced camera system:

$$\left(B - E C^{-1} E^T\right) \Delta\mathbf{x}_{\text{cam}} = -\mathbf{b}_{\text{cam}} + E C^{-1} \mathbf{b}_{\text{pts}}$$

Because $C$ is block-diagonal, $C^{-1}$ costs almost nothing (invert each $3 \times 3$ block). One solves the $6m \times 6m$ reduced system for the pose update, then back-substitutes to recover each point update independently. A $(6m + 3n)$-dimensional solve becomes a $6m$-dimensional one — orders of magnitude faster when $n \gg m$, which is always.

Two further layers of sparsity matter in practice. First, the reduced camera matrix $B - EC^{-1}E^T$ is itself sparse: entry $(i, j)$ is non-zero only if keyframes $i$ and $j$ observe a common point (the covisibility structure), so sparse Cholesky factorization with good variable ordering (COLAMD) applies. Second, the same elimination viewpoint generalises: in factor-graph terms, the Schur complement is just variable elimination, the operation underlying marginalization in sliding-window VIO and incremental smoothers like iSAM2.

Every serious solver — Ceres (`SPARSE_SCHUR`), g2o, GTSAM — implements this. Knowing it explains why BA scales, why "marginalizing" old states creates fill-in (dense blocks) in the remaining Hessian, and why solver choice and ordering can change runtime by orders of magnitude.

## Why it matters for SLAM

Real-time SLAM exists because of structure-exploiting linear algebra: without the Schur complement, bundle adjustment over even a few hundred keyframes would be hopeless. The same idea — eliminate variables, keep the problem sparse — reappears in marginalization, sliding-window estimators, and incremental smoothing, so this is one of the highest-leverage pieces of math on the whole roadmap.

## Related

- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Marginalization](marginalization.md)
- [Math libraries](math-libraries.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
