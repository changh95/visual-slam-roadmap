# QUASAR

> Yang 2019 · [Paper](https://arxiv.org/abs/1905.12536)

**One-line summary** — First polynomial-time certifiably optimal solver for the Wahba problem (rotation search) with outliers: a Truncated Least Squares cost, rewritten via unit quaternions and "binary cloning" as a QCQP, then solved by a tight SDP relaxation.

## Problem

The Wahba problem — find the rotation that best aligns two sets of vector observations given putative correspondences — is a fundamental routine in point cloud registration, image stitching, motion estimation, and satellite attitude determination. The outlier-free version, $\min_{\mathbf{R}\in\mathrm{SO}(3)}\sum_i w_i^2\Vert\mathbf{b}_i-\mathbf{R}\mathbf{a}_i\Vert^2$, has closed-form solutions, but real correspondences from feature matching can be 95% outliers (e.g., FPFH matches). RANSAC's runtime grows exponentially with the outlier ratio and degrades with noise, robust local optimization (e.g., FGR) can stall in local minima, and Branch-and-Bound is globally optimal but worst-case exponential. Before QUASAR there was no polynomial-time *certifiably optimal* approach to rotation search with many outliers.

## Method & architecture

**TLS formulation.** Each measurement contributes a least-squares term only while its residual is small; beyond a threshold it saturates and stops influencing the estimate:

$$\min_{\mathbf{R}\in\mathrm{SO}(3)} \sum_{i=1}^{N} \min\left( \frac{1}{\sigma_i^2}\Vert\mathbf{b}_i - \mathbf{R}\mathbf{a}_i\Vert^2,\ \bar{c}^2 \right),$$

where $\sigma_i$ is the inlier noise standard deviation and $\bar{c}^2$ is chosen as the $\chi^2(3)$ quantile at probability $p$ (e.g., $p=0.99$), so $\sigma_i^2\bar{c}^2$ is the largest squared residual tolerated for an inlier.

**Quaternion rewriting.** Representing $\mathbf{R}$ by a unit quaternion $\mathbf{q}\in\mathcal{S}^3$ replaces the constraint set $\mathrm{SO}(3)$ by the unit sphere, with $\mathbf{R}\mathbf{a}$ expressed through quaternion products $\mathbf{q}\otimes\hat{\mathbf{a}}\otimes\mathbf{q}^{-1}$.

**Binary cloning to a QCQP.** Using $\min(x,y)=\min_{\theta\in\{\pm 1\}} \frac{1+\theta}{2}x+\frac{1-\theta}{2}y$, the TLS cost becomes a mixed-integer program where $\theta_i=+1$ declares measurement $i$ an inlier and $\theta_i=-1$ an outlier — so outlier classification lives *inside* the optimization. Defining clone quaternions $\mathbf{q}_i = \theta_i\mathbf{q}$ removes the integers, and stacking $\mathbf{x}=\left[\mathbf{q}^{\mathsf{T}}\ \mathbf{q}_1^{\mathsf{T}}\ \dots\ \mathbf{q}_N^{\mathsf{T}}\right]^{\mathsf{T}}$ yields an exactly equivalent Quadratically Constrained Quadratic Program:

$$\min_{\mathbf{x}\in\mathbb{R}^{4(N+1)}} \sum_{i=1}^{N}\mathbf{x}^{\mathsf{T}}\mathbf{Q}_i\mathbf{x} \quad \text{s.t.} \quad \mathbf{x}_q^{\mathsf{T}}\mathbf{x}_q = 1,\quad \mathbf{x}_{q_i}\mathbf{x}_{q_i}^{\mathsf{T}} = \mathbf{x}_q\mathbf{x}_q^{\mathsf{T}}\ \forall i,$$

with known symmetric matrices $\mathbf{Q}_i$ built from $\mathbf{a}_i,\mathbf{b}_i$.

**Tight SDP relaxation.** Lifting to $\mathbf{Z}=\mathbf{x}\mathbf{x}^{\mathsf{T}}\succeq 0$ and dropping the rank-1 constraint gives a convex SDP over $\mathrm{tr}(\mathbf{Q}\mathbf{Z})$. The *naive* relaxation (only the block-diagonal constraints) is provably tight with no noise and no outliers (Theorem 7) but breaks in practice with outliers. QUASAR adds redundant symmetry constraints on the off-diagonal blocks, $[\mathbf{Z}]_{qq_i}=[\mathbf{Z}]_{qq_i}^{\mathsf{T}}$ and $[\mathbf{Z}]_{q_iq_j}=[\mathbf{Z}]_{q_iq_j}^{\mathsf{T}}$, which make the relaxation empirically tight under large noise and extreme outlier rates. When the solution has rank 1 (zero relaxation gap), the recovered rotation is *certified* globally optimal for the original non-convex TLS problem.

## Results

- **Naive vs. tight relaxation** (synthetic, $N=40$, noiseless): the naive SDP starts going loose at 10–40% outliers and completely breaks above 40%, while QUASAR returns a certifiably optimal rank-1 solution even with 90% outliers.
- **Synthetic benchmark** ($\sigma_i=0.01$): closed-form Wahba only works outlier-free; FGR is robust to 70% but breaks by 90%; RANSAC, GORE, and QUASAR are robust to 90% outliers with QUASAR slightly more accurate. At extreme 91–96% outliers ($N=100$), Wahba/FGR/RANSAC break, GORE fails once at 96%, QUASAR is highly accurate in all tests. With high noise ($\sigma_i=0.1$), QUASAR still tolerates 80% outliers where all other methods fail.
- **Point cloud registration** (Bunny, $N=40$, rotation subproblem via invariant measurements): QUASAR dominates all compared techniques in both noise regimes.
- **Image stitching** (PASSTA Lunch Room): 46 of 70 SURF correspondences (66%) are outliers; QUASAR (with $\sigma^2\bar{c}^2=0.001$) stitches correctly where Matlab's MSAC fails.
- **Tightness metrics**: relaxation gap and rank/stable-rank confirm exactness across the synthetic and Bunny tests. Main limitation: general-purpose SDP solvers scale poorly — about 1200 s with MOSEK (500 s with SDPNAL+) for $N=100$ correspondences.

## Why it matters for SLAM

Rotation estimation sits inside many SLAM subproblems: point cloud registration, map merging, rotation averaging, and extrinsic calibration. QUASAR is part of the "certifiable perception" line of work (with SE-Sync and TEASER++, largely from the same group) showing that key geometric problems in robotics can be solved to *provable* global optimality even with heavy outlier contamination. Its ingredients — the TLS cost, binary cloning, and the redundant-constraint SDP — became the rotation subsolver machinery inside TEASER/TEASER++.

## Related

- [SE-Sync](se-sync.md) — certifiable pose graph optimization via SDP relaxation
- [TEASER++](teaserpp.md) — certifiable point cloud registration using the same rotation machinery
- [GNC](gnc.md) — general graduated non-convexity approach to robust estimation with the same TLS cost
