# GNC

> Yang 2020 · [Paper](https://arxiv.org/abs/1909.08605)

**One-line summary** — Graduated Non-Convexity: a general-purpose robust estimation framework that starts from a convex surrogate cost and gradually morphs it into the target robust (non-convex) cost, acting as a black-box wrapper around any non-minimal solver.

## Key ideas

- **The problem**: robust costs (Geman-McClure, Truncated Least Squares) down-weight outliers such as wrong loop closures and spurious matches, but they are non-convex — Gauss-Newton or LM easily converges to bad local minima when initialized poorly.
- **Continuation from convex to robust**: define a parametric family $\rho(r; \mu)$ that is convex (e.g., $\ell_2$) at $\mu = 0$ and equals the target robust cost at $\mu = 1$; for Geman-McClure: $\rho_{\text{GM}}(r; \mu) = \dfrac{\mu \bar{c}^2 r^2}{\mu \bar{c}^2 + r^2}$.
- **Graduated optimization**: solve the convex problem globally, then step $\mu$ through a schedule $\mu_0 = 0 < \mu_1 < \cdots < \mu_K = 1$, warm-starting each solve $\mathbf{x}^{(k+1)} = \arg\min_{\mathbf{x}} \sum_i \rho(r_i(\mathbf{x}); \mu_k)$ from the previous solution — tracking the minimum as the landscape deforms.
- **Black-box wrapper**: GNC only adjusts residual weights between outer iterations, so any existing solver (Ceres, g2o, GTSAM) can be used unmodified.
- **High outlier tolerance**: in the paper's experiments it tolerates far higher outlier ratios than standard IRLS on rotation averaging, and recovers correct pose graphs under injected outlier loop closures, with only a handful of outer iterations of overhead.

## Why it matters for SLAM

Outlier rejection is the difference between a usable map and a corrupted one, and GNC gives every SLAM back-end a simple, general robustification that requires no problem-specific convex relaxation. It shipped in GTSAM as `GncOptimizer` and is used for robust pose graph optimization, point cloud registration, and rotation averaging; within Carlone's group it complements certifiable solvers (SE-Sync, TEASER++) as the pragmatic, general-purpose tool.

## Related

- [SE-Sync](se-sync.md) — certifiably optimal pose graph optimization
- [TEASER++](teaserpp.md) — certifiable robust registration that also employs GNC ideas
- [QUASAR](quasar.md) — certifiable rotation averaging under extreme outliers
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — the problem setting GNC addresses

[Back to Level 5](../README.md#level-5-applying-deep-learning)
