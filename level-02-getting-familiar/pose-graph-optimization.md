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

## How the optimization runs

PGO is nonlinear least squares *on a manifold*. Rotations cannot be updated by plain addition, so each Gauss-Newton/LM iteration works in the tangent space:

1. For every edge, compute the residual $\mathbf{e}_{ij} = \log\!\left(T_{ij}^{-1} T_i^{-1} T_j\right) \in \mathbb{R}^6$ and its Jacobians with respect to small perturbations $\boldsymbol{\delta}_i, \boldsymbol{\delta}_j$ of the two poses.
2. Assemble and solve the normal equations $H \boldsymbol{\delta} = -\mathbf{b}$, where $H = \sum J_{ij}^T \Sigma_{ij}^{-1} J_{ij}$ is sparse: each edge touches only two poses, so $H$'s sparsity pattern *is* the graph's adjacency structure.
3. Update each pose with a retraction $T_i \leftarrow T_i \cdot \mathrm{Exp}(\boldsymbol{\delta}_i)$ and iterate to convergence.

Two structural details matter. First, **gauge freedom**: the cost is invariant to moving all poses rigidly together, so $H$ is singular until you anchor the gauge — fix the first pose (or add a prior factor on it). Second, the **information matrices** $\Sigma_{ij}^{-1}$ are the knobs that decide how correction is distributed: confident odometry edges bend little, uncertain ones absorb most of the loop error. Setting all edges to identity information "works" but distributes drift unrealistically.

## A worked intuition

Imagine a robot driving a large square, with odometry accumulating a bit of heading error at each corner, so the estimated end pose sits noticeably away from the start. Place recognition then matches the final view to the first one, adding one loop edge that says "these two poses coincide". Before PGO, that edge has a huge residual and the odometry edges have none. The optimizer finds the configuration where the error is *shared*: every pose rotates and shifts slightly (weighted by its edge covariances), each odometry edge takes on a small residual, and the loop edge's residual shrinks to the same statistical scale — the trajectory visibly "snaps" into a closed square. Nothing was measured again; the same measurements were simply re-explained consistently. That redistribution-of-error picture is the right mental model for every graph-based SLAM back-end.

## Common pitfalls

- **Forgetting to fix the gauge** — a singular $H$ shows up as solver failures or the whole map drifting freely between iterations.
- **Feeding unverified loop edges** — always geometrically verify (inlier count, consistency checks) before an edge enters the graph; one outlier edge can be catastrophic (see robust PGO).
- **Poor initialization with large loops** — Gauss-Newton converges locally; a trajectory that drifted by 90° of heading may need a robust kernel, better initial guess (e.g. rotation averaging / spanning-tree initialization), or LM with damping to avoid a bad local minimum.
- **Angle handling in 2D** — wrap $\theta$ residuals to $[-\pi, \pi]$; unwrapped angles are a classic source of "exploding" 2D pose graphs.
- **Using $SE(3)$ where $\mathrm{Sim}(3)$ is needed** — monocular loop closure must correct scale drift too; optimizing over $SE(3)$ leaves a scale seam at the loop.

## Why it matters for SLAM

PGO is the workhorse of loop closure — the step that turns a drifting odometry trajectory into a globally consistent map. It is the simplest instance of graph-based SLAM, so it is also the best place to first understand nonlinear least squares on manifolds, sparsity, and information matrices before tackling full bundle adjustment and factor graphs.

## Hands-on

- [Kimera-RPGO hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_17)

## Related

- [Factor graph](factor-graph.md)
- [Robust pose-graph optimization](robust-pose-graph-optimization.md)
- [Lie groups](lie-groups.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
