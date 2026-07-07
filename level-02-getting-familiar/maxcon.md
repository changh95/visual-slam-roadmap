# MaxCon (Maximum Consensus)

**Maximum consensus** is the optimization problem that RANSAC only *approximately* solves. Given measurements with residual functions $r_i(\theta)$ and an inlier threshold $\epsilon$, find the model that agrees with as many measurements as possible:

$$
\theta^* = \arg\max_{\theta}\; \bigl|\{\, i : |r_i(\theta)| \leq \epsilon \,\}\bigr|
$$

The set being maximized is the **consensus set** (inlier set). Fitting a fundamental matrix, a homography, a camera pose, or a point-cloud registration "with the most inliers" are all instances of this one problem.

## Why RANSAC is not the end of the story

[RANSAC](ransac.md) attacks maximum consensus by random minimal sampling: it returns a *good* consensus set with high probability, but

- it is **randomized** — two runs on the same data can return different answers;
- it carries **no optimality guarantee** — the returned consensus set can be smaller than the true maximum, especially at high outlier ratios where the number of required samples explodes;
- the model it returns is fit to a **minimal sample**, so it is noise-sensitive until refined.

Studying maximum consensus as a proper optimization problem asks: what would it take to find the *exact* maximizer, deterministically?

## Hardness and exact algorithms

The bad news is fundamental: maximum consensus is **NP-hard** in general — it is a combinatorial problem over which subset of measurements to trust, and no algorithm can solve all instances efficiently unless P = NP. The consensus objective is also nasty analytically: it is a piecewise-constant counting function of $\theta$, with zero gradient almost everywhere, so ordinary [non-linear optimization](non-linear-optimization.md) cannot touch it directly.

Exact (globally optimal) methods therefore pay exponential worst-case cost, but can be practical for small problems:

- **Branch-and-bound (BnB)**: recursively partition the parameter space (e.g. the rotation/translation space) and prune branches whose upper bound on the achievable consensus is worse than the best solution found so far. Guaranteed global optimum on termination.
- **Tree search over active sets**: exploit the fact that the optimum of such problems is characterized by a small *basis* of constraints, and search over bases with best-first (A*-style) strategies.
- **Mixed-integer programming**: introduce a binary variable $z_i \in \{0, 1\}$ per measurement and solve

$$
\max_{\theta,\, z} \sum_i z_i \quad \text{s.t.} \quad |r_i(\theta)| \leq \epsilon + M(1 - z_i)
$$

  with a big constant $M$, handing the problem to an off-the-shelf MIP solver.

A useful reformulation: maximizing consensus is equivalent to **minimizing the number of violated constraints** — an $\ell_0$-type objective. This viewpoint connects MaxCon to its tractable surrogates: relaxing $\ell_0$ toward $\ell_1$ or other convex losses gives [convex relaxation](convex-relaxation.md) approaches, and gradually deforming a robust kernel from convex to redescending gives graduated non-convexity (GNC). These give up exactness for polynomial runtime, sometimes with a-posteriori optimality certificates.

## The practical landscape

| Approach | Guarantee | Cost | Typical use |
|---|---|---|---|
| RANSAC / PROSAC | probabilistic | low | real-time front-ends |
| Local/deterministic refinement | local optimum | low-medium | polishing a RANSAC result |
| Convex relaxation / GNC | none or certifiable | medium | robust registration, pose graphs |
| BnB / tree search / MIP | global optimum | exponential worst case | offline, safety-critical, small problems |

## Why it matters for SLAM

Every geometric estimation step in SLAM — essential matrix, PnP, loop-closure verification, point-cloud registration — is a consensus maximization problem under the hood. Real-time front-ends will keep using RANSAC-family heuristics, but knowing the exact problem clarifies what is being traded away: a randomized front-end can silently accept a suboptimal consensus set, and a single wrong loop closure built on it can bend the whole map. This motivates the certifiable robust estimation line of work (globally optimal rotation search, TEASER-style registration, GNC back-ends) that increasingly appears in SLAM systems where wrong answers are expensive.

## Related

- [RANSAC](ransac.md)
- [PROSAC](prosac.md)
- [Convex relaxation](convex-relaxation.md)
- [M-Estimator](m-estimator.md)
- [TEASER++](../level-05-deep-learning/teaserpp.md)
