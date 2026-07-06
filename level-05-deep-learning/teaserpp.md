# TEASER++

> Yang 2020 · [Paper](https://arxiv.org/abs/2001.07715)

**One-line summary** — First fast and certifiable 3D point cloud registration algorithm, robust to 90%+ outlier correspondences via truncated least squares and maximum-clique inlier selection (T-RO/RSS 2020).

## Key ideas

- **Truncated Least Squares (TLS)**: Replaces the $\ell_2$ registration cost with $\rho_c(r) = \min(r^2, c^2)$, so measurements beyond threshold $c$ contribute a constant — outliers cannot drag the solution, unlike ICP or vanilla least squares.
- **Decoupled cascade**: The joint scale-rotation-translation TLS problem is split into three sequential subproblems using translation/rotation-invariant measurements; scale and translation are solved exactly by adaptive voting in polynomial time.
- **Max-clique inlier pruning**: A pairwise-consistency graph is built over correspondences (inliers must agree on distances); its maximum clique isolates a mutually consistent inlier set before estimation, discarding most gross outliers cheaply.
- **Certifiable rotation via SDP**: The remaining TLS rotation search is relaxed to a semidefinite program (the QUASAR machinery) with a dual certificate of global optimality.
- Tolerates extreme outlier rates (90%+) while running in real time, orders of magnitude faster than earlier certifiable solvers.

## Why it matters for SLAM

Registration with putative correspondences is everywhere in SLAM: LiDAR loop closure, global relocalization, multi-robot map merging, and object pose estimation — all regimes where feature matching can be mostly wrong. TEASER++ made "correspondences are 90% garbage" a solvable setting with optimality guarantees, and its open-source C++ library is widely integrated into LiDAR SLAM and multi-robot systems (e.g., Kimera-Multi-style map merging). It is a pillar of the certifiable-perception line alongside SE-Sync and QUASAR.

## Related

- [SE-Sync](se-sync.md) — certifiable pose graph optimization
- [QUASAR](quasar.md) — the certifiable rotation subsolver
- [GNC](gnc.md) — general-purpose robust estimation wrapper
- [ICP](../level-04-rgbd-slam/icp.md) — the classical local registration method it hardens against outliers
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot system using robust registration for map merging

[Back to Level 5](../README.md#level-5-applying-deep-learning)
