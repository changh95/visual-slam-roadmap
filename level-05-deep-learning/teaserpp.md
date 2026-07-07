# TEASER++

> Yang 2020 · [Paper](https://arxiv.org/abs/2001.07715)

**One-line summary** — First fast and certifiable 3D point cloud registration algorithm, robust to 99% outlier correspondences via truncated least squares, invariant-measurement decoupling, and maximum-clique inlier selection (T-RO/RSS 2020).

## Problem

Registering two 3D point clouds from putative correspondences $(\mathbf{a}_i, \mathbf{b}_i)$ follows the generative model $\mathbf{b}_i = s^{\circ}\mathbf{R}^{\circ}\mathbf{a}_i + \mathbf{t}^{\circ} + \mathbf{o}_i + \boldsymbol{\epsilon}_i$, where $\mathbf{o}_i$ is zero for inliers and arbitrary for outliers. With no outliers, Horn's/Arun's closed forms solve it — but a single bad outlier breaks them, and real descriptor matches are overwhelmingly wrong. ICP needs a good initial guess, RANSAC degrades sharply as outlier fraction climbs, and earlier certifiable solvers were far too slow for online use. TEASER adopts the Truncated Least Squares (TLS) formulation, assuming only bounded inlier noise $\|\boldsymbol{\epsilon}_i\| \le \beta_i$ (no outlier model):

$$\min_{s>0,\;\mathbf{R}\in SO(3),\;\mathbf{t}\in\mathbb{R}^3} \sum_{i=1}^{N} \min\!\left(\frac{1}{\beta_i^2}\big\lVert \mathbf{b}_i - s\mathbf{R}\mathbf{a}_i - \mathbf{t} \big\rVert^2,\; \bar{c}^2\right),$$

so residuals beyond the threshold contribute a constant and cannot drag the solution — but TLS minimization is NP-hard even over convex domains.

## Method & architecture

- **Invariant measurements decouple the problem into a cascade.** Subtracting pairs of correspondences cancels translation, giving Translation Invariant Measurements $\bar{\mathbf{b}}_{ij} = s\mathbf{R}\bar{\mathbf{a}}_{ij} + \mathbf{o}_{ij} + \boldsymbol{\epsilon}_{ij}$ (TIMs, edges of a graph over correspondences, with noise bound $\delta_{ij} = \beta_i + \beta_j$); taking TIM norm ratios cancels rotation too, giving scalar TRIMs $s_{ij} = s + o^{s}_{ij} + \epsilon^{s}_{ij}$ with $s_{ij} = \lVert\bar{\mathbf{b}}_{ij}\rVert / \lVert\bar{\mathbf{a}}_{ij}\rVert$. TEASER then solves scale, then rotation, then translation, each by TLS.
- **Exact polynomial-time scale and translation: adaptive voting.** Scalar TLS ($\hat{s} = \arg\min_s \sum_k \min\big((s-s_k)^2/\alpha_k^2, \bar{c}^2\big)$) admits at most $2K{-}1$ distinct consensus sets, whose boundaries are the interval endpoints $s_k \pm \alpha_k\bar{c}$ — enumerate them, take the least-cost weighted mean (Theorem 7). Translation is solved component-wise the same way.
- **Max-clique inlier pruning (MCIS).** TRIMs inconsistent with $\hat{s}$ (i.e. $|s_{ij} - \hat{s}| > \bar{c}\,\alpha_{ij}$) are pruned; Theorem 6 shows inlier TIMs form a clique of the remaining graph, so computing the maximum clique isolates a mutually consistent inlier set before rotation estimation.
- **Certifiable rotation via a tight SDP.** The TLS rotation problem is rewritten with unit quaternions and "binary cloning" ($\mathbf{q}_k = \theta_k \mathbf{q}$, $\theta_k \in \{\pm 1\}$ marking inliers/outliers) into a QCQP $\min_{\mathbf{x}} \mathbf{x}^{\mathsf{T}}\mathbf{Q}\mathbf{x}$, then relaxed by dropping the rank-1 constraint on $\mathbf{Z} = \mathbf{x}\mathbf{x}^{\mathsf{T}}$ while adding redundant block-symmetry constraints that make the relaxation tight. Theorem 13: if the SDP solution has rank 1, its factor is the *certified global optimum*; empirically the relaxation stays tight even beyond 95% outliers.
- **TEASER++ = GNC + fast certification.** Solving the SDP is slow (about 1200 s for $K{=}100$ with MOSEK), so TEASER++ solves the rotation subproblem with graduated non-convexity (GNC, reliable below roughly 80% outliers — safe after MCIS pruning) and then *certifies* the estimate via Douglas–Rachford splitting on the dual: Algorithm 3 returns a sub-optimality bound $\eta$ with $(\hat{\mu} - \mu^{\star})/\hat{\mu} \le \eta$, computed from the minimum eigenvalue of the dual certificate, $\eta^{(t)} = |\lambda_1^{(t)}|(K+1)/\hat{\mu}$, converging to zero when the estimate is optimal and the relaxation tight.
- **Estimation contracts.** Theorems 15–17 bound the estimation error — the first such bounds for robust registration: with noiseless inliers and random outliers, exact recovery needs only 3 inliers regardless of outlier count; adversarial outliers require an inlier majority.

## Results

- **Bunny benchmarks (N=100, vs FGR, GORE, RANSAC):** TEASER, TEASER++, GORE, and 60-second RANSAC are robust to 90% outliers (FGR breaks at 70%, RANSAC-1K at 90%); at extreme 95–99% outliers ($N{=}1000$), TEASER/TEASER++/GORE survive to 99%, with TEASER++ more accurate and one order of magnitude faster than GORE. TEASER++ solves high-outlier problems in under 10 ms on a laptop (under 30 ms with unknown scale).
- **Certification:** the DRS certifier validates all correct and rejects all incorrect GNC solutions, taking on average 24 iterations (about 50 ms per iteration in C++); it certifies problems orders of magnitude faster than MOSEK, which runs out of memory beyond 150 TIMs.
- **Correspondence-free registration** (all-to-all hypotheses, about $10^4$ candidate pairs): ICP fails almost always, Go-ICP is trimming-sensitive and takes 16 s on average; TEASER++ recovers the correct pose without any initial guess down to about 10% overlap.
- **Object pose estimation** (RGB-D dataset, FPFH correspondences with inlier ratios typically below 5%): mean rotation error 0.066 rad, mean translation error 0.069 m over eight scenes.
- **3DMatch scan matching** (3DSmoothNet descriptors): TEASER++ matches or beats RANSAC-10K on all scenes except MIT Lab (e.g. Kitchen 98.6% vs 97.2% success) at 0.059 s average runtime; restricting to certified estimates (TEASER++ CERT) raises success further (Kitchen 99.4%) — a natural filter against bad loop closures in SLAM.

## Why it matters for SLAM

Registration with putative correspondences is everywhere in SLAM: LiDAR loop closure, global relocalization, multi-robot map merging, and object pose estimation — all regimes where feature matching can be mostly wrong. TEASER++ made "correspondences are 90%+ garbage" a solvable setting with optimality certificates, and the certified/non-certified distinction gives loop-closure pipelines a principled rejection test. Its open-source C++ library is widely integrated into LiDAR SLAM and multi-robot systems (e.g., Kimera-Multi-style map merging), and it is a pillar of the certifiable-perception line alongside SE-Sync and QUASAR.

## Related

- [SE-Sync](se-sync.md) — certifiable pose graph optimization
- [QUASAR](quasar.md) — the certifiable quaternion-based rotation subsolver
- [GNC](gnc.md) — the fast robust heuristic TEASER++ certifies
- [ICP](../level-04-rgbd-slam/icp.md) — the classical local registration method it hardens against outliers
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot system using robust registration for map merging
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — a key deployment setting for certified registration
