# GNC

> Yang 2020 · [Paper](https://arxiv.org/abs/1909.08605)

**One-line summary** — Graduated Non-Convexity: a general-purpose robust estimation framework that starts from a convex surrogate cost and gradually morphs it into the target robust (non-convex) cost, acting as a black-box wrapper around any non-minimal solver.

## Problem

Semidefinite Programming (SDP) and Sums-of-Squares (SOS) relaxations have produced certifiably optimal *non-minimal solvers* for several robotics and vision problems (rotation averaging, pose graph optimization, registration) — but these solvers rely on least-squares formulations and are therefore brittle against outliers such as wrong loop closures and spurious matches. The standard fix, robust cost functions (Geman-McClure, Truncated Least Squares), reintroduces non-convexity, so Gauss-Newton or LM easily lands in bad local minima without a good initial guess — and the certifiable solvers cannot be applied at all. GNC enables the simultaneous use of non-minimal solvers and robust estimation, without requiring an initial guess.

## Key ideas

- **Continuation from convex to robust**: define a parametric family $\rho(r; \mu)$ that is convex (e.g., $\ell_2$) at one end of the schedule and equals the target robust cost at the other; for Geman-McClure: $\rho_{\text{GM}}(r; \mu) = \dfrac{\mu \bar{c}^2 r^2}{\mu \bar{c}^2 + r^2}$.
- **Graduated optimization**: solve the convex problem globally, then step $\mu$ through a schedule, warm-starting each solve $\mathbf{x}^{(k+1)} = \arg\min_{\mathbf{x}} \sum_i \rho(r_i(\mathbf{x}); \mu_k)$ from the previous solution — tracking the minimum as the landscape deforms toward the robust cost.
- **Black-Rangarajan duality**: the theoretical bridge is the classical duality between robust estimation and *outlier processes* from early vision — each robust cost is rewritten as a weighted least-squares problem plus a penalty on per-measurement weights, which is what lets any least-squares solver be reused.
- **Black-box wrapper**: GNC only alternates between solving a weighted least-squares problem (with the existing solver — Ceres, g2o, GTSAM, or a certifiable non-minimal solver) and updating residual weights in closed form; no initial guess and no solver modification required.
- **General-purpose**: the same recipe applies to any problem with a non-minimal solver for the outlier-free case — demonstrated on point cloud and mesh registration, pose graph optimization, and image-based object pose estimation (shape alignment).
- **Bonus contribution**: the paper also proposes the first certifiably optimal non-minimal solver for shape alignment, using SOS relaxation.

## Results & impact

- The paper reports the resulting robust solvers are robust to 70–80% outliers, outperform RANSAC, are more accurate than specialized local solvers, and faster than specialized global solvers — while GNC's global optimality cannot be guaranteed, its empirical robustness is demonstrated across all tested applications.
- Shipped in GTSAM as `GncOptimizer`, bringing production-grade global outlier rejection to standard SLAM back-ends.

## Why it matters for SLAM

Outlier rejection is the difference between a usable map and a corrupted one, and GNC gives every SLAM back-end a simple, general robustification that requires no problem-specific convex relaxation. It shipped in GTSAM as `GncOptimizer` and is used for robust pose graph optimization, point cloud registration, and rotation averaging; within Carlone's group it complements certifiable solvers (SE-Sync, TEASER++) as the pragmatic, general-purpose tool.

## Related

- [SE-Sync](se-sync.md) — certifiably optimal pose graph optimization
- [TEASER++](teaserpp.md) — certifiable robust registration that also employs GNC ideas
- [QUASAR](quasar.md) — certifiable rotation averaging under extreme outliers
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — the problem setting GNC addresses
- [ICP](../level-04-rgbd-slam/icp.md) — a registration pipeline GNC can robustify

[Back to Level 5](../README.md#level-5-applying-deep-learning)
