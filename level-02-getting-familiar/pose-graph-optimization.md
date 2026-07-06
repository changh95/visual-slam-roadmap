# Pose graph optimization

**Pose graph optimization (PGO)** is a reduced form of the SLAM back-end in which the variables are only the robot/camera poses $\{T_i\} \subset SE(3)$ — no 3D map points. The graph has:

- **Nodes**: poses $T_i$ (typically keyframe poses).
- **Edges**: relative pose constraints $T_{ij}$ with uncertainty $\Sigma_{ij}$, coming from odometry (consecutive poses) and from loop closures (non-consecutive poses recognised as the same place).

Each edge says "from node $i$, node $j$ should appear at relative pose $T_{ij}$". The optimization finds the pose configuration that best satisfies all constraints simultaneously:

$$\min_{\{T_i\}} \sum_{(i,j) \in \mathcal{E}} \left\| \log\!\left(T_{ij}^{-1}\, T_i^{-1} T_j\right) \right\|^2_{\Sigma_{ij}^{-1}}$$

The residual is computed with the $SE(3)$ logarithm map, so the error lives in the 6-DoF tangent space; the problem is solved with Gauss-Newton or Levenberg-Marquardt on the manifold, exactly as in bundle adjustment but with far fewer variables.

The typical usage pattern in a visual SLAM system:

1. The front-end tracks the camera and builds odometry edges; drift accumulates.
2. Place recognition detects a loop closure and geometric verification produces a relative pose edge between two distant-in-time keyframes.
3. PGO redistributes the accumulated drift over the whole trajectory, "snapping" the loop shut.
4. Optionally, a full bundle adjustment refines poses and points afterwards.

Because it drops the (many) landmark variables, PGO is much faster than full bundle adjustment and is the standard tool for global trajectory correction after loop closure — this is what ORB-SLAM's essential-graph optimization and most LiDAR SLAM back-ends (e.g. via GTSAM or g2o) run. In monocular SLAM the graph is often optimized over $\mathrm{Sim}(3)$ instead of $SE(3)$ so that scale drift can also be corrected.

One caution: PGO trusts its edges. A single false loop closure edge can fold the whole map onto itself, which motivates robust pose-graph optimization techniques.

## Why it matters for SLAM

PGO is the workhorse of loop closure — the step that turns a drifting odometry trajectory into a globally consistent map. It is the simplest instance of graph-based SLAM, so it is also the best place to first understand nonlinear least squares on manifolds, sparsity, and information matrices before tackling full bundle adjustment and factor graphs.

## Related

- [Factor graph](factor-graph.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
- [Lie groups](lie-groups.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
