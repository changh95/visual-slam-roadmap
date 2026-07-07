# SE-Sync

> Rosen 2019 · [Paper](https://arxiv.org/abs/1611.00128)

**One-line summary** — First certifiably correct algorithm for pose graph optimization: an SDP relaxation solved via Riemannian optimization that recovers the globally optimal solution with a proof of optimality (arXiv 2016, IJRR 2019).

## Problem

$SE(d)$ synchronization — estimate $n$ unknown poses $x_1,\dots,x_n \in SE(d)$ from noisy measurements of $m$ of their pairwise relative transforms $x_{ij} = x_i^{-1}x_j$ — is the standard SLAM backend problem (pose-graph SLAM, camera pose estimation). Under the paper's generative model (Gaussian translation noise with precision $\tau_{ij}$, isotropic Langevin rotation noise with concentration $\kappa_{ij}$), the maximum-likelihood estimate minimizes

$$p^{*}_{\mathrm{MLE}} = \min_{t_i \in \mathbb{R}^d,\; R_i \in SO(d)} \sum_{(i,j)\in\vec{\mathcal{E}}} \kappa_{ij}\big\lVert R_j - R_i\tilde{R}_{ij}\big\rVert_F^2 + \tau_{ij}\big\lVert t_j - t_i - R_i\tilde{t}_{ij}\big\rVert_2^2 .$$

This is a high-dimensional non-convex nonlinear program, computationally hard in general: local solvers (g2o, GTSAM, Ceres) can silently converge to local minima far from the true solution, with no way to *know* whether a returned answer is globally optimal — unacceptable for safety-critical autonomy.

## Method & architecture

- **Eliminate translations.** For fixed rotations the problem is an unconstrained quadratic in $t$, solved in closed form via a generalized Schur complement. This reduces the MLE to pure rotation synchronization, $p^{*}_{\mathrm{MLE}} = \min_{R \in SO(d)^n} \operatorname{tr}(\tilde{Q} R^{\mathsf{T}} R)$, where the data matrix $\tilde{Q} = L(\tilde{G}^{\rho}) + \tilde{T}^{\mathsf{T}} \Omega^{1/2} \Pi\, \Omega^{1/2} \tilde{T}$ combines the rotation connection Laplacian $L(\tilde{G}^{\rho})$ with a translational data term; $\Pi$ (an orthogonal projection) admits a sparse decomposition via a thin LQ factorization of the weighted incidence matrix, so products with $\tilde{Q}$ never form a dense matrix. Optimal translations are recovered afterwards as $t^{*} = -\operatorname{vec}\big(R^{*}\tilde{V}^{\mathsf{T}} L(W^{\tau})^{\dagger}\big)$.
- **SDP relaxation, provably tight.** Relaxing $SO(d)$ to $O(d)$ makes the problem a QCQP whose Lagrangian dual is the semidefinite program

$$p^{*}_{\mathrm{SDP}} = \min_{Z \succeq 0}\; \operatorname{tr}(\tilde{Q} Z) \quad \text{s.t.} \quad \mathrm{BlockDiag}_{d\times d}(Z) = \mathrm{Diag}(I_d,\dots,I_d),$$

  so $p^{*}_{\mathrm{SDP}} \le p^{*}_{\mathrm{MLE}}$. **Proposition 1**: there exists $\beta > 0$ such that if $\lVert \tilde{Q} - \bar{Q} \rVert_2 < \beta$ (with $\bar{Q}$ the data matrix of the true latent transforms — i.e. noise below a critical threshold), the SDP has a *unique* solution $Z^{*} = R^{*\mathsf{T}}R^{*}$ with $R^{*} \in SO(d)^n$ the exact MLE. Whenever the rounded estimate attains the SDP lower bound, that equality is a *computational certificate* of global optimality.
- **Riemannian staircase.** Instead of interior-point SDP solvers (intractable beyond a few thousand variables), SE-Sync uses the Burer–Monteiro factorization $Z = Y^{\mathsf{T}}Y$ with $Y \in \mathbb{R}^{r\times dn}$, $r \ll dn$; the block constraints then say each $Y_i$ is an orthonormal frame, giving an unconstrained problem on a product of Stiefel manifolds:

$$p^{*}_{\mathrm{SDPLR}} = \min_{Y \in \mathrm{St}(d,r)^n} \operatorname{tr}(\tilde{Q}\, Y^{\mathsf{T}} Y).$$

  **Proposition 2** (after Boumal et al.): any rank-deficient second-order critical point of this problem is a *global* minimizer and yields the SDP solution — so one climbs the rank hierarchy ("Riemannian staircase") until a rank-deficient critical point appears.
- **Fast second-order local search.** On the manifold, $\nabla F(Y) = 2Y\tilde{Q}$ and Hessian-vector products are projections of ambient derivatives ($\operatorname{grad} F(Y) = \operatorname{Proj}_Y \nabla F(Y)$), all computed with sparse matrix products and triangular solves; a truncated-Newton Riemannian trust-region (RTR) method finds high-precision critical points.
- **Rounding.** A rank-$d$ thin SVD of $Y^{*}$ gives $\hat{R} = \Xi_d V_d^{\mathsf{T}}$; flip orientation if most blocks have negative determinant, then project each block to the nearest rotation matrix — exact when the relaxation is tight, a feasible approximation otherwise.

## Results

(MATLAB implementation on Manopt, staircase fixed at $r=5$, initialized from a *random* point on $\mathrm{St}(3,5)^n$; baselines: Gauss–Newton with odometric init, GN with chordal init, and GN-chordal plus a posteriori verification.)

- **Simulated cube worlds** ($s^3$ lattice, loop-closure probability $p_{LC}$, noise $\sigma_T$, $\sigma_R$; 30 runs per setting): SE-Sync converges to a *certifiably globally optimal* solution from random initialization in time comparable to — in these tests often faster than — GN with state-of-the-art chordal initialization, and much faster than GN + separate verification. The exception is the high-rotational-noise regime, where the relaxation's exactness breaks down.
- **Large-scale real/standard 3D SLAM datasets** — sphere (2500 nodes/4949 edges), sphere-a (2200/8647), torus (5000/9048), cube (8000/22236), garage (1661/6275), cubicle (5750/16869): SE-Sync attains the certified global optimum on *all* of them (e.g. objective $1.249\times 10^{6}$ on sphere-a vs $3.041\times 10^{6}$ for odometry-initialized GN), in 3.6–203 s, confirming the relaxation stays exact on challenging real-world instances.
- Per the abstract, global optimality is recovered under noise "up to an order of magnitude greater than that typically encountered in robotics applications," at a cost scaling comparably with direct Newton-type local search.

## Why it matters for SLAM

SE-Sync answered a foundational question: despite PGO's non-convexity, the instances arising in practical SLAM are globally solvable, and you can *know* when you have the global optimum. This launched the certifiable-perception research program (TEASER++ for registration, QUASAR for rotation search) and gave SLAM backends a verification tool — e.g., checking whether a local solver's answer is actually optimal after potentially corrupted loop closures.

## Related

- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the problem being certified
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — the MLE formulation being relaxed
- [TEASER++](teaserpp.md) — certifiable point cloud registration
- [QUASAR](quasar.md) — certifiable rotation search
- [GNC](gnc.md) — robust estimation companion for outlier-contaminated graphs
