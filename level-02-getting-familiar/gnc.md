# GNC

> Yang 2020 · [Paper](https://arxiv.org/abs/1909.08605)

**One-line summary** — Graduated Non-Convexity: a general-purpose robust estimation framework that starts from a convex surrogate cost and gradually morphs it into the target robust (non-convex) cost, acting as a black-box wrapper around any non-minimal solver — no initial guess required.

## Problem

Semidefinite Programming (SDP) and Sums-of-Squares (SOS) relaxations have produced certifiably optimal *non-minimal solvers* for several robotics and vision problems (pose graph optimization, rotation averaging, registration) — but these solvers rely on least-squares formulations and are therefore brittle against outliers such as wrong loop closures and spurious matches. The standard fix, robust cost functions (Geman-McClure, Truncated Least Squares), reintroduces non-convexity, so local iterative optimization needs a good initial guess — and the certifiable solvers cannot be applied at all. GNC enables the simultaneous use of non-minimal solvers and robust estimation, without requiring an initial guess.

## Method & architecture

Outlier-free estimation is least squares, $\min_{\mathbf{x}\in\mathcal{X}}\sum_{i=1}^{N} r^2(\mathbf{y}_i,\mathbf{x})$, where $r$ is the residual of measurement $\mathbf{y}_i$ at estimate $\mathbf{x}$; robustness replaces the quadratic with a robust cost $\rho$. GNC instead optimizes a surrogate $\rho_\mu$ governed by a control parameter $\mu$, convex at one end of the schedule and equal to $\rho$ at the other. For Geman-McClure (GM):

$$\rho_\mu(r) = \frac{\mu\bar{c}^2 r^2}{\mu\bar{c}^2 + r^2},$$

which becomes quadratic (convex) as $\mu\to\infty$ and recovers GM at $\mu=1$; $\bar{c}$ is set to the maximum error expected for inliers. An analogous three-piece surrogate is derived for Truncated Least Squares (TLS), convex as $\mu\to 0$ and exact as $\mu\to\infty$.

The key enabler is **Black-Rangarajan duality**: minimizing $\sum_i \rho_\mu(r_i)$ is equivalent to a weighted least-squares problem plus an *outlier process*,

$$\min_{\mathbf{x}\in\mathcal{X},\ w_i\in[0,1]} \sum_{i=1}^{N} \Big( w_i\, r^2(\mathbf{y}_i,\mathbf{x}) + \Phi_{\rho_\mu}(w_i) \Big),$$

where $w_i$ are per-measurement weights and $\Phi_{\rho_\mu}$ is a penalty on them — for GM, $\Phi_{\rho_\mu}(w_i)=\mu\bar{c}^2(\sqrt{w_i}-1)^2$; for TLS, $\Phi_{\rho_\mu}(w_i)=\frac{\mu(1-w_i)}{\mu+w_i}\bar{c}^2$. At each fixed $\mu$ the algorithm alternates two steps:

1. **Variable update** — $\mathbf{x}^{(t)} = \arg\min_{\mathbf{x}\in\mathcal{X}} \sum_i w_i^{(t-1)} r^2(\mathbf{y}_i,\mathbf{x})$: a *weighted* version of the outlier-free problem, solved globally by the existing non-minimal solver (Horn's method, SE-Sync, the mesh-registration SDP, ...).
2. **Weight update** — closed form. For GNC-GM, with residual $\hat{r}_i^2 = r^2 (\mathbf{y}_i,\mathbf{x}^{(t)})$:

$$w_i^{(t)} = \left( \frac{\mu\bar{c}^2}{\hat{r}_i^2 + \mu\bar{c}^2} \right)^{2};$$

for GNC-TLS a three-branch rule sets $w_i=1$ when $\hat{r}_i^2 \le \frac{\mu}{\mu+1}\bar{c}^2$, $w_i=0$ when $\hat{r}_i^2 \ge \frac{\mu+1}{\mu}\bar{c}^2$, and $w_i = \frac{\bar{c}}{\hat{r}_i}\sqrt{\mu(\mu+1)} - \mu$ in between.

The outer loop then increases the amount of non-convexity: GNC-GM initializes $\mu = 2r_{\max}^2/\bar{c}^2$ and divides by 1.4 each outer iteration until $\mu<1$; GNC-TLS initializes $\mu = \bar{c}^2/(2r_{\max}^2-\bar{c}^2)$ and multiplies by 1.4 until the weighted residual sum converges. All weights start at 1. Since the solver is only asked to solve weighted least squares, GNC works as a black box around Ceres/g2o/GTSAM-style back-ends or certifiable solvers. As a further contribution, the paper proposes the first certifiably optimal non-minimal solver for shape alignment (weak-perspective object pose from 2D-3D correspondences), minimizing a degree-4 polynomial in a non-unit quaternion $\mathbf{v}=\sqrt{s}\,\mathbf{q}$ via SOS relaxation (empirically always exact).

## Results

- **Point cloud registration** (Stanford Bunny, $N=100$ correspondences, noise $\sigma=0.01$): GNC-GM, GNC-TLS, RANSAC, and ADAPT all achieve similar accuracy below 90% outliers and break at 90%; at 80% outliers, average runtimes are 218 ms (RANSAC), 22 ms (GNC-GM), 23 ms (GNC-TLS). TEASER is more robust still but takes over 5 minutes on large instances.
- **Mesh registration** (PASCAL+ "car-2"; 40 point-to-point, 80 point-to-line, 80 point-to-plane correspondences): GNC-GM, GNC-TLS, and ADAPT are robust to 80% outliers, while RANSAC with a 12-point minimal solver breaks at 50%; GNC's iteration count stays roughly constant while ADAPT's grows linearly with the outlier rate.
- **Pose graph optimization** (INTEL and CSAIL with corrupted loop closures, against g2o, DCS, PCM, ADAPT): GNC-TLS dominates — insensitive up to 40% outliers and acceptable to 70–80% on INTEL, robust to 90% outliers on CSAIL; g2o performs poorly throughout and DCS/PCM degrade gradually.
- **Shape alignment** (FG3DCar, all 600 images): GNC-GM/TLS and ADAPT robust to 70% outliers; RANSAC breaks at 60%; Zhou's convex relaxation degrades quickly. One SOS solve takes about 80 ms.

Headline claim: the robust non-minimal solvers tolerate 70–80% outliers, outperform RANSAC, are more accurate than specialized local solvers and faster than specialized global solvers — though GNC's global optimality cannot be guaranteed.

## Why it matters for SLAM

Outlier rejection is the difference between a usable map and a corrupted one, and GNC gives every SLAM back-end a simple, general robustification that requires no problem-specific convex relaxation. It shipped in GTSAM as `GncOptimizer` and is used for robust pose graph optimization, point cloud registration, and rotation averaging; within Carlone's group it complements certifiable solvers (SE-Sync, TEASER++) as the pragmatic, general-purpose tool.

## Related

- [SE-Sync](se-sync.md) — certifiably optimal pose graph optimization
- [TEASER++](teaserpp.md) — certifiable robust registration that also employs GNC ideas
- [QUASAR](quasar.md) — certifiable rotation search under extreme outliers, with the TLS cost GNC also uses
- [Robust pose-graph optimization](robust-pose-graph-optimization.md) — the problem setting GNC addresses
- [ICP](../level-04-rgbd-slam/icp.md) — a registration pipeline GNC can robustify
