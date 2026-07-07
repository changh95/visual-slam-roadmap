# Robust pose-graph optimization

Standard pose-graph optimization has a dangerous property: it trusts every edge. Odometry edges are usually reliable, but **loop closure edges come from place recognition, which sometimes lies** — perceptual aliasing (two corridors that look identical) produces false loop closures. Feed a single wrong loop edge into least squares and the optimizer will happily fold your map onto itself, because a quadratic cost lets one bad constraint dominate everything. Robust pose-graph optimization is the family of techniques that make the back-end survive outlier constraints.

The three classical approaches named in the roadmap:

- **Switchable Constraints** (Sunderhauf & Protzel, 2012). Each loop closure edge $(i,j)$ gets an extra optimization variable, a switch $s_{ij} \in [0, 1]$ that scales the edge's information matrix. The optimizer can "turn off" an edge that disagrees with the rest of the graph, paying a penalty term that discourages disabling edges gratuitously:

  $$\min_{\{T_i\}, \{s_{ij}\}} \sum_{\text{odom}} \|\mathbf{e}_{ij}\|^2_{\Sigma^{-1}} + \sum_{\text{loops}} s_{ij}^2\, \|\mathbf{e}_{ij}\|^2_{\Sigma^{-1}} + \lambda (1 - s_{ij})^2$$

- **Dynamic Covariance Scaling (DCS)** (Agarwal et al., 2013). Observes that the optimal switch value can be computed in closed form from the current residual, eliminating the extra variables. Each loop edge's covariance is scaled on the fly — small residual, full trust; large residual, inflated covariance. DCS behaves like a robust M-estimator kernel and converges faster than switchable constraints.

- **Pairwise Consistency Maximization (PCM)** (Mangelson et al., 2018). Instead of softening edges inside the optimizer, PCM filters loop closures *before* optimization: two loop closures are pairwise consistent if the relative motions they imply (composed with the odometry between them) agree within their covariances. Building a consistency graph and finding its maximum clique yields the largest mutually consistent set of loop closures; the rest are rejected. PCM became the standard gatekeeper in multi-robot SLAM (DOOR-SLAM, Kimera-Multi), where inter-robot loop closures are especially unreliable.

These ideas connect to the broader robust-estimation toolbox: M-estimator kernels (Huber, Cauchy) downweight moderate outliers, and Graduated Non-Convexity (GNC) solves strongly non-convex robust costs without initialization. In practice systems layer defenses: geometric verification at the front-end, PCM-style consistency checks, and a robust kernel or DCS in the optimizer as a last line of defense.

## The M-estimator view

All the soft methods are variations on one move: replace the quadratic cost with a **robust kernel** $\rho$,

$$\min_{\{T_i\}} \sum_{(i,j)} \rho\left(\|\mathbf{e}_{ij}\|_{\Sigma_{ij}^{-1}}\right),$$

chosen so that the cost's *influence* (its derivative) stops growing — or shrinks — for large residuals. Under a quadratic, an edge with residual $10\sigma$ pulls 100 times harder than one at $1\sigma$; under Huber it pulls only linearly harder; under Cauchy or Geman-McClure its pull *fades* as the residual grows. In implementation terms this becomes **iteratively reweighted least squares**: each Gauss-Newton iteration multiplies every edge's information matrix by a weight $w(\|\mathbf{e}\|)$ computed from the current residual — which is precisely what DCS does with a specific closed-form weight, and what switchable constraints achieve with explicit switch variables. The trade-off: redescending kernels (Cauchy and stronger) can reject gross outliers completely, but they make the cost non-convex, so a bad initialization can lock good edges out — the problem GNC addresses by starting from a convex surrogate and gradually sharpening it.

A complementary *hard* check on the front-end side is **chi-square gating**: before an edge is accepted, test whether its residual is statistically plausible under the current estimate, $\mathbf{e}^T \Sigma^{-1} \mathbf{e} < \chi^2_{d,\,0.95}$ (6 DoF for an $SE(3)$ edge). Gating catches blatant outliers cheaply, but it trusts the current estimate — under heavy drift, a *correct* loop closure also looks implausible, which is exactly the case PCM's pairwise-consistency logic handles better.

## Common pitfalls

- **Robustifying the wrong edges** — odometry edges are rarely outliers; wrapping them in aggressive kernels lets the optimizer "explain away" genuine drift and can split the trajectory into disconnected islands. Robustify loop closures, keep odometry (near-)quadratic.
- **Assuming robustness replaces verification** — kernels and switches survive *some* fraction of outliers; a front-end that emits 40% false loops will still corrupt the map. Layer the defenses.
- **Tuning blindness** — $\lambda$ in switchable constraints, the DCS $\Phi$ parameter, and kernel widths all encode "how big can a residual be before I doubt the edge"; they must be set relative to realistic edge covariances, which are themselves often guessed.
- **Redescending kernels + bad initialization** — with large drift, correct loop closures start with huge residuals and get switched off immediately; GNC-style continuation or PCM pre-filtering avoids this failure.
- **Perceptual aliasing produces *consistent* lies in structured environments** — several false matches from identical-looking corridor segments can agree with each other; consistency maximization raises the bar but is not a proof.

## Why it matters for SLAM

One false loop closure can destroy a map that took an hour to build, so robustness at the back-end is not optional in deployed systems. This topic is also the entry point to multi-robot SLAM, where robots must decide whether to trust constraints produced by other robots — the setting PCM was designed for.

## Hands-on

- [Kimera-RPGO hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_17)

## Related

- [Pose graph optimization](pose-graph-optimization.md)
- [GNC](gnc.md)
- [DOOR-SLAM](../level-08-collaborative-slam/door-slam.md)
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
