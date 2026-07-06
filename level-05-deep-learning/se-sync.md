# SE-Sync

> Rosen 2019 · [Paper](https://arxiv.org/abs/1611.00128)

**One-line summary** — First certifiably correct algorithm for pose graph optimization: an SDP relaxation solved via Riemannian optimization that recovers the globally optimal solution with a proof of optimality (arXiv 2016, IJRR 2019).

## Key ideas

- **PGO as synchronization over $SE(d)$**: The maximum-likelihood pose graph problem, $\min_{R_i \in SO(d),\, t_i} \sum_{(i,j)} \kappa_{ij}\|R_j - R_i\tilde{R}_{ij}\|_F^2 + \tau_{ij}\|t_j - t_i - R_i\tilde{t}_{ij}\|^2$, is non-convex — local solvers like g2o/GTSAM can silently converge to bad local minima.
- **SDP relaxation**: Relaxing the rotation constraints into the positive semidefinite cone yields a convex problem; crucially, the relaxation is *provably tight* under moderate measurement noise, so solving the SDP solves the original problem exactly.
- **Riemannian staircase**: Rather than a costly interior-point SDP solver, SE-Sync optimizes over a hierarchy of low-rank manifold factorizations, scaling to large pose graphs at speeds comparable to local methods.
- **Dual certificate**: After solving, the dual problem verifies global optimality — a zero duality gap is a mathematical *certificate* that no better solution exists.

## Why it matters for SLAM

SE-Sync answered a foundational question: despite PGO's non-convexity, the instances arising in practical SLAM are globally solvable, and you can *know* when you have the global optimum. This launched the certifiable-perception research program (TEASER++ for registration, QUASAR for rotation search) and gave SLAM backends a verification tool — e.g., checking whether a local solver's answer is actually optimal after potentially corrupted loop closures.

## Related

- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the problem being certified
- [TEASER++](teaserpp.md) — certifiable point cloud registration
- [QUASAR](quasar.md) — certifiable rotation search
- [GNC](gnc.md) — robust estimation companion for outlier-contaminated graphs

[Back to Level 5](../README.md#level-5-applying-deep-learning)
