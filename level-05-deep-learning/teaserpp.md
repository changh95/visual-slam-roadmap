# TEASER++

> Yang 2020 · [Paper](https://arxiv.org/abs/2001.07715)

**One-line summary** — First fast and certifiable 3D point cloud registration algorithm, robust to 90%+ outlier correspondences via truncated least squares and maximum-clique inlier selection (T-RO/RSS 2020).

## Problem

Registering two 3D point sets from putative correspondences is a core robotics routine, but real correspondences — from noisy descriptors or ambiguous geometry — can be overwhelmingly wrong. ICP needs a good initial guess and RANSAC degrades sharply as the outlier fraction climbs, while earlier certifiable solvers were far too slow for online use.

Before TEASER there was no algorithm that was simultaneously *fast* and *certifiable* for registration in the presence of large amounts of outlier correspondences — the regime that LiDAR loop closure and global relocalization actually live in.

## Key ideas

- **Truncated Least Squares (TLS)**: Replaces the $\ell_2$ registration cost with $\rho_c(r) = \min(r^2, c^2)$, so measurements beyond threshold $c$ contribute a constant — outliers cannot drag the solution, unlike ICP or vanilla least squares.
- **Graph-theoretic decoupling**: Translation- and rotation-invariant measurements decouple the joint problem into a *cascade*: solve scale, then rotation, then translation. TLS scale and component-wise translation are solved exactly in polynomial time by adaptive voting.
- **Max-clique inlier pruning**: A pairwise-consistency graph is built over correspondences (true inliers must agree on invariant distances); its maximum clique isolates a mutually consistent inlier set, drastically pruning gross outliers before any estimation.
- **Certifiable rotation via tight SDP**: The remaining TLS rotation search is relaxed to a semidefinite program (the QUASAR machinery), and the relaxation stays tight even at extreme outlier rates — yielding a certificate of global optimality.
- **TEASER++ = speed**: Since solving large SDPs is slow, TEASER++ solves the rotation subproblem with graduated non-convexity (GNC) and then *certifies* global optimality efficiently via Douglas–Rachford splitting — certifiable performance at millisecond speeds.
- **Theoretical error bounds**: The paper provides bounds on the estimation errors of both algorithms — the first of their kind for robust registration problems.

## Results & impact

- On standard, object-detection, and 3DMatch benchmarks, both algorithms dominate the state of the art and are robust to more than 99% outlier correspondences.
- TEASER++ runs in milliseconds — real-time registration with optimality certificates.
- So robust it can solve registration *without correspondences at all*, largely outperforming ICP and beating Go-ICP in accuracy while being orders of magnitude faster.
- The open-source C++ library is widely integrated into LiDAR SLAM, relocalization, and multi-robot map-merging systems (e.g., Kimera-Multi-style pipelines), making certifiable robust registration a practical commodity.

## Why it matters for SLAM

Registration with putative correspondences is everywhere in SLAM: LiDAR loop closure, global relocalization, multi-robot map merging, and object pose estimation — all regimes where feature matching can be mostly wrong. TEASER++ made "correspondences are 90% garbage" a solvable setting with optimality guarantees, and its open-source C++ library is widely integrated into LiDAR SLAM and multi-robot systems (e.g., Kimera-Multi-style map merging). It is a pillar of the certifiable-perception line alongside SE-Sync and QUASAR.

## Related

- [SE-Sync](se-sync.md) — certifiable pose graph optimization
- [QUASAR](quasar.md) — the certifiable rotation subsolver
- [GNC](gnc.md) — general-purpose robust estimation wrapper
- [ICP](../level-04-rgbd-slam/icp.md) — the classical local registration method it hardens against outliers
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot system using robust registration for map merging

[Back to Level 5](../README.md#level-5-applying-deep-learning)
