# SE-Sync

> Rosen 2019 · [Paper](https://arxiv.org/abs/1611.00128)

**One-line summary** — First certifiably correct algorithm for pose graph optimization: an SDP relaxation solved via Riemannian optimization that recovers the globally optimal solution with a proof of optimality (arXiv 2016, IJRR 2019).

## Problem

Pose graph optimization — estimate a set of poses from noisy measurements of a subset of their pairwise relative transforms — is the standard SLAM backend, formulated as maximum-likelihood estimation. But the MLE is a non-convex nonlinear program, computationally intractable in general: local solvers (g2o, GTSAM, Ceres) can silently converge to local minima far from the true solution, and there was no way to *know* whether a returned answer was globally optimal.

SE-Sync asks whether practical SLAM instances can be solved to certified global optimality in a non-adversarial noise regime, at a cost competitive with local methods.

## Key ideas

- **PGO as synchronization over $SE(d)$**: The maximum-likelihood problem is $\min_{R_i \in SO(d),\, t_i} \sum_{(i,j)} \kappa_{ij}\|R_j - R_i\tilde{R}_{ij}\|_F^2 + \tau_{ij}\|t_j - t_i - R_i\tilde{t}_{ij}\|^2$ — translations can be eliminated analytically, reducing everything to rotation synchronization.
- **SDP relaxation, provably tight**: Relaxing the rotation constraints into the positive semidefinite cone yields a convex program whose minimizer provides the *exact* MLE whenever the noise magnitude falls below a critical threshold — in that regime, solving the SDP solves the original non-convex problem.
- **A posteriori certification**: Whenever exactness holds, it can be *verified after the fact* via the dual solution — a zero duality gap is a mathematical certificate that no better solution exists, turning "hope the optimizer converged" into a checkable property.
- **Riemannian staircase**: Rather than a costly interior-point SDP solver, SE-Sync exploits the relaxation's low-rank, geometric, and graph-theoretic structure to reduce it to an equivalent problem on a low-dimensional Riemannian manifold, solved with a truncated-Newton trust-region method and climbed rank-by-rank until the global SDP optimum is found.
- **Rounding**: A simple rounding procedure projects the low-rank factor back to a feasible set of rotations, completing a fast end-to-end pipeline.

## Results & impact

- On a variety of simulated and real-world pose-graph SLAM datasets, SE-Sync recovers globally optimal solutions when measurements are corrupted by noise up to an order of magnitude greater than that typically encountered in robotics.
- Roughly an order of magnitude faster than solving the same SDP with generic solvers, thanks to the low-rank Riemannian reduction.
- Does so at a computational cost that scales comparably with direct Newton-type local search techniques — certification without a big speed penalty.
- Answered a foundational question in the field: practical PGO instances are globally solvable despite non-convexity, launching the certifiable-perception research program (TEASER++, QUASAR, and successors) and providing a verification tool for SLAM backends.

## Why it matters for SLAM

SE-Sync answered a foundational question: despite PGO's non-convexity, the instances arising in practical SLAM are globally solvable, and you can *know* when you have the global optimum. This launched the certifiable-perception research program (TEASER++ for registration, QUASAR for rotation search) and gave SLAM backends a verification tool — e.g., checking whether a local solver's answer is actually optimal after potentially corrupted loop closures.

## Related

- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the problem being certified
- [TEASER++](teaserpp.md) — certifiable point cloud registration
- [QUASAR](quasar.md) — certifiable rotation search
- [GNC](gnc.md) — robust estimation companion for outlier-contaminated graphs

[Back to Level 5](../README.md#level-5-applying-deep-learning)
