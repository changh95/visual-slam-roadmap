# Incremental smoothing

SLAM is a *growing* estimation problem: every new keyframe adds variables and factors to the factor graph. Solving the whole nonlinear least-squares problem from scratch at every step (batch optimization) gets more expensive as the trajectory grows — yet each new measurement usually affects only a small, recent part of the graph. **Incremental smoothing** exploits this: update the previous solution with just the new information, instead of recomputing everything.

**iSAM** (incremental Smoothing and Mapping, Kaess et al.) made this concrete for SLAM. Solving the linearized least-squares system amounts to factorizing the measurement Jacobian (QR) or the information matrix (Cholesky). iSAM's observation: when a new measurement arrives, the existing factorization can be *updated* with low-rank modifications rather than rebuilt, with periodic batch steps to re-linearize and reorder variables.

**iSAM2** removed the periodic-batch crutch by introducing the **Bayes tree**, a tree-structured data structure derived from variable elimination on the factor graph. The Bayes tree encodes which variables' solutions depend on which others. When a new factor arrives:

- Only the affected branch of the tree is re-factorized — variables far from the new measurement are untouched.
- **Fluid relinearization**: a variable is re-linearized only when its estimate has moved beyond a threshold since its last linearization point, so nonlinearity is handled where (and only where) it matters.
- **Partial state updates**: only estimates that actually changed are recomputed.

The result is near-constant-time updates for exploration-style trajectories, while remaining exact up to the linearization thresholds — this is not a fixed-lag approximation that throws information away; the full smoothing problem over all variables is maintained. Large loop closures still touch a large part of the tree (correctly so — they genuinely affect everything).

iSAM2 is implemented in **GTSAM** and is the back-end of choice when you want full-history smoothing at real-time rates: Kimera-VIO, for example, runs GTSAM's iSAM2 with structureless "smart" projection factors for incremental visual-inertial estimation. The main alternative back-end style — a fixed-lag sliding window with marginalization — bounds cost by discarding old variables instead; incremental smoothing bounds cost by updating cleverly while keeping them.

## Why it matters for SLAM

Incremental smoothing is what makes the "smoothing beats filtering" insight practical at real-time rates: you get the accuracy of full nonlinear optimization over the whole trajectory without paying batch cost at every frame. When you see a system described as "GTSAM/iSAM2-based," you now know its computational story: Bayes-tree updates, fluid relinearization, and exact full-history MAP inference. It is the standard back-end for VIO and LiDAR-inertial systems that need loop closures folded in seamlessly (e.g., LIO-SAM, Kimera).

## Related

- [Factor graph](factor-graph.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Marginalization](marginalization.md)
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md)
- [LIO-SAM](../level-09-lidar-visual-lidar-slam/lio-sam.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
