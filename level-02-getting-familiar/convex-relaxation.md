# Convex Relaxation

Most core estimation problems in SLAM — pose-graph optimization, rotation averaging, point-cloud registration — are **non-convex**: the rotation constraints $R \in SO(3)$ carve a curved, non-convex feasible set, and quadratic objectives over it have multiple local minima. Iterative solvers (Gauss-Newton, Levenberg-Marquardt) only converge to the *nearest* minimum, so with a bad initialization they can silently return a wrong answer. **Convex relaxation** attacks this by replacing the hard problem with a convex one that can be solved to *global* optimality — and, in favorable regimes, provably recovers the global optimum of the original problem, with a certificate.

## The core idea

Given a non-convex problem $\min_{\mathbf{x} \in \mathcal{C}} f(\mathbf{x})$, construct a convex problem whose feasible set contains $\mathcal{C}$ (and whose objective lower-bounds $f$). Because the relaxed feasible set is larger, the relaxed optimum $p^{\ast}_{\text{relax}}$ is a **lower bound** on the true optimum $p^{\ast}$. Two outcomes:

- The relaxed solution happens to be feasible for the original problem. Then the relaxation is **tight**: the solution *is* the global optimum, and you know it.
- Otherwise, the relaxed solution still provides a bound and often a good rounding/initialization for a local solver.

## Shor's SDP relaxation of a QCQP

The workhorse construction. Many geometric problems can be written as a **quadratically constrained quadratic program**:

$$\min_{\mathbf{x}} \ \mathbf{x}^T Q\, \mathbf{x} \qquad \text{s.t.} \quad \mathbf{x}^T A_k\, \mathbf{x} = b_k$$

(e.g., rotation-matrix orthogonality $R^T R = I$ and quaternion unit-norm constraints are quadratic). Introduce the lifted variable $X = \mathbf{x}\, \mathbf{x}^T$. Then $\mathbf{x}^T Q \mathbf{x} = \mathrm{tr}(Q X)$, and the problem becomes *linear* in $X$:

$$\min_{X} \ \mathrm{tr}(Q X) \qquad \text{s.t.} \quad \mathrm{tr}(A_k X) = b_k, \quad X \succeq 0, \quad \mathrm{rank}(X) = 1$$

Everything here is convex **except** the rank-1 constraint. Dropping it yields a **semidefinite program (SDP)** — convex, solvable in polynomial time. If the SDP optimum $X^{\ast}$ turns out to have rank 1, factor it as $X^{\ast} = \mathbf{x}^{\ast} \mathbf{x}^{\ast T}$ and you have the certified global optimum of the original QCQP.

## Certificates and duality

Convex duality supplies the practical tool: any dual-feasible point gives a lower bound on the optimum, and a candidate solution whose cost matches that bound is **certified globally optimal** (zero duality gap). This enables a cheap two-step pattern used by *certifiably correct* SLAM algorithms: solve the non-convex problem with a fast local method, then verify the result by checking a dual certificate (e.g., positive semidefiniteness of a certificate matrix) — getting global-optimality guarantees at local-solver speed whenever verification succeeds.

## Where it shows up in SLAM

- **SE-Sync**: relaxes pose-graph optimization (synchronization over $SE(d)$) to an SDP that is provably tight below a noise threshold, and solves it efficiently via a low-rank Riemannian-optimization "staircase" instead of a generic interior-point SDP solver — certifiably globally optimal pose graphs at practical speeds.
- **Rotation averaging and registration**: QUASAR relaxes quaternion-based rotation search, and TEASER++ certifies robust point-cloud registration, both via SDP relaxations of truncated-least-squares formulations that additionally tolerate large outlier fractions.
- **Verification of standard back-ends**: even when a system runs plain Gauss-Newton/LM, a relaxation-based certifier can flag when a pose-graph solution is *not* globally optimal — e.g., after bad loop closures.

A cousin technique, **graduated non-convexity (GNC)**, pursues the same goal (escaping local minima, robustness to outliers) by a different mechanism: it starts from a convex surrogate of a robust cost and gradually morphs it back into the non-convex original, tracking the solution along the way. It provides no certificate by itself but pairs naturally with the certifiers above.

## Why it matters for SLAM

SLAM back-ends are trusted by safety-critical systems, yet local optimization offers no guarantee that the returned map is even close to optimal — a single bad initialization or outlier loop closure can lock the solver into a badly bent trajectory. Convex relaxation is the theoretical backbone of *certifiable SLAM*: it explains when and why global optimality is achievable (moderate noise, tight relaxations), gives tools to verify solutions cheaply, and underlies robust global solvers (SE-Sync, TEASER++) that succeed with no initial guess at all — something Gauss-Newton fundamentally cannot do.

## Related

- [Pose graph optimization](pose-graph-optimization.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
- [MaxCon](maxcon.md)
- [SE-Sync](se-sync.md)
- [TEASER++](teaserpp.md)
