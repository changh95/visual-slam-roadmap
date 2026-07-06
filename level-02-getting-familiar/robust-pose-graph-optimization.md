# Robust pose-graph optimization

Standard pose-graph optimization has a dangerous property: it trusts every edge. Odometry edges are usually reliable, but **loop closure edges come from place recognition, which sometimes lies** — perceptual aliasing (two corridors that look identical) produces false loop closures. Feed a single wrong loop edge into least squares and the optimizer will happily fold your map onto itself, because a quadratic cost lets one bad constraint dominate everything. Robust pose-graph optimization is the family of techniques that make the back-end survive outlier constraints.

The three classical approaches named in the roadmap:

- **Switchable Constraints** (Sunderhauf & Protzel, 2012). Each loop closure edge $(i,j)$ gets an extra optimization variable, a switch $s_{ij} \in [0, 1]$ that scales the edge's information matrix. The optimizer can "turn off" an edge that disagrees with the rest of the graph, paying a penalty term that discourages disabling edges gratuitously:

  $$\min_{\{T_i\}, \{s_{ij}\}} \sum_{\text{odom}} \|\mathbf{e}_{ij}\|^2_{\Sigma^{-1}} + \sum_{\text{loops}} s_{ij}^2\, \|\mathbf{e}_{ij}\|^2_{\Sigma^{-1}} + \lambda (1 - s_{ij})^2$$

- **Dynamic Covariance Scaling (DCS)** (Agarwal et al., 2013). Observes that the optimal switch value can be computed in closed form from the current residual, eliminating the extra variables. Each loop edge's covariance is scaled on the fly — small residual, full trust; large residual, inflated covariance. DCS behaves like a robust M-estimator kernel and converges faster than switchable constraints.

- **Pairwise Consistency Maximization (PCM)** (Mangelson et al., 2018). Instead of softening edges inside the optimizer, PCM filters loop closures *before* optimization: two loop closures are pairwise consistent if the relative motions they imply (composed with the odometry between them) agree within their covariances. Building a consistency graph and finding its maximum clique yields the largest mutually consistent set of loop closures; the rest are rejected. PCM became the standard gatekeeper in multi-robot SLAM (DOOR-SLAM, Kimera-Multi), where inter-robot loop closures are especially unreliable.

These ideas connect to the broader robust-estimation toolbox: M-estimator kernels (Huber, Cauchy) downweight moderate outliers, and Graduated Non-Convexity (GNC) solves strongly non-convex robust costs without initialization. In practice systems layer defenses: geometric verification at the front-end, PCM-style consistency checks, and a robust kernel or DCS in the optimizer as a last line of defense.

## Why it matters for SLAM

One false loop closure can destroy a map that took an hour to build, so robustness at the back-end is not optional in deployed systems. This topic is also the entry point to multi-robot SLAM, where robots must decide whether to trust constraints produced by other robots — the setting PCM was designed for.

## Related

- [Pose graph optimization](pose-graph-optimization.md)
- [GNC](../level-05-deep-learning/gnc.md)
- [DOOR-SLAM](../level-08-collaborative-slam/door-slam.md)
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
