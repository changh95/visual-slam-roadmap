# Incremental smoothing

SLAM is a *growing* estimation problem: every new keyframe adds variables and factors to the factor graph. Solving the whole nonlinear least-squares problem from scratch at every step (batch optimization) gets more expensive as the trajectory grows — yet each new measurement usually affects only a small, recent part of the graph. **Incremental smoothing** exploits this: update the previous solution with just the new information, instead of recomputing everything.

## The linear-algebra view

Solving the linearized least-squares system means factorizing either the measurement Jacobian ($J = QR$, then back-substituting $R\,\Delta\mathbf{x} = \mathbf{d}$) or the information matrix ($H = J^TJ$ via Cholesky). A new measurement appends new rows to $J$. The key observation of **iSAM** (incremental Smoothing and Mapping, Kaess et al.): the existing triangular factor $R$ can be *updated* for those new rows with a sequence of Givens rotations — a low-rank modification — rather than rebuilt from scratch. Because the update only fills in entries connected to the new measurement's variables, most of $R$ is untouched. iSAM still needed periodic batch steps to re-linearize and reorder variables, since both linearization points and the variable ordering (which controls fill-in) go stale as the estimate evolves.

## iSAM2 and the Bayes tree

**iSAM2** removed the periodic-batch crutch by introducing the **Bayes tree**, a tree-structured data structure derived from variable elimination on the factor graph: running elimination to completion yields a Bayes net whose cliques organize into a directed tree. The Bayes tree encodes exactly which variables' solutions depend on which others — each clique's solution depends only on its ancestors toward the root.

When a new factor arrives:

- Only the cliques on the paths from the affected variables to the root are re-eliminated — the rest of the tree, typically the vast majority, is untouched.
- **Fluid relinearization**: a variable is re-linearized only when its estimate has moved beyond a threshold since its last linearization point, so nonlinearity is handled where (and only where) it matters.
- **Partial state updates**: solution updates propagate down from the modified cliques and stop where the change falls below a threshold, so only estimates that actually moved are recomputed.

The result is near-constant-time updates for exploration-style trajectories, while remaining exact up to the linearization thresholds — this is not a fixed-lag approximation that throws information away; the full smoothing problem over all variables is maintained. Large loop closures still touch a large part of the tree (correctly so — they genuinely affect everything), which shows up as an occasional latency spike in profiling.

## Choosing a back-end style

| | Batch smoothing | Incremental (iSAM2) | Fixed-lag + marginalization |
|---|---|---|---|
| Variables kept | all | all | recent window only |
| Cost per update | grows with trajectory | ~constant while exploring; spikes at loop closures | strictly bounded |
| Information | exact | full history, exact up to relinearization thresholds | old states summarized in a frozen linearized prior |
| Typical use | offline mapping, SfM | online SLAM with loop closures | embedded VIO |

iSAM2 is implemented in **GTSAM** and is the back-end of choice when you want full-history smoothing at real-time rates: Kimera-VIO, for example, runs GTSAM's iSAM2 with structureless "smart" projection factors for incremental visual-inertial estimation, and LIO-SAM feeds its LiDAR-inertial factor graph to the same solver. The main alternative back-end style — a fixed-lag sliding window with marginalization — bounds cost by discarding old variables instead; incremental smoothing bounds cost by updating cleverly while keeping them.

## Practical notes

- The relinearization threshold trades speed for exactness; a too-loose threshold quietly degrades accuracy in high-curvature (fast-rotation) segments.
- Structureless/"smart" factors (which eliminate landmarks analytically inside the factor) keep the Bayes tree small for vision problems with many short-lived landmarks.
- If your platform cannot tolerate the loop-closure latency spike, the common architecture is a fast fixed-lag odometry front-end plus an iSAM2 (or pose-graph) smoother running behind it.

## Why it matters for SLAM

Incremental smoothing is what makes the "smoothing beats filtering" insight practical at real-time rates: you get the accuracy of full nonlinear optimization over the whole trajectory without paying batch cost at every frame. When you see a system described as "GTSAM/iSAM2-based," you now know its computational story: Bayes-tree updates, fluid relinearization, and exact full-history MAP inference. It is the standard back-end for VIO and LiDAR-inertial systems that need loop closures folded in seamlessly (e.g., LIO-SAM, Kimera).

## Related

- [Factor graph](factor-graph.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Marginalization](marginalization.md)
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md)
- [LIO-SAM](../level-09-lidar-visual-lidar-slam/lio-sam.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
