# LDSO

> Gao 2018 · [Paper](https://arxiv.org/abs/1808.01111)

**One-line summary** — Extended DSO into a full SLAM system by adding BoW-based loop closure and Sim(3) pose-graph optimisation, fixing DSO's main weakness (unbounded drift) while keeping its photometric tracking core.

## Key ideas

- **Corner-favouring point selection**: DSO picks any high-gradient pixels, which are not repeatable enough for place recognition. LDSO biases point selection toward corner features (Shi-Tomasi) — while still keeping gradient points — and assigns ORB descriptors to the corners.
- **BoW loop detection**: with ORB descriptors available, a DBoW2 bag-of-words vocabulary retrieves loop-closure candidates efficiently, exactly as in ORB-SLAM.
- **Sim(3) loop constraints**: because monocular odometry drifts in scale, loop closures are estimated as 7-DoF Sim(3) transforms by jointly minimising 2D reprojection and 3D geometric error, then fused with relative-pose constraints from DSO's sliding window in a pose graph.
- **Unchanged photometric frontend**: DSO's direct tracking and windowed photometric bundle adjustment are preserved, so local accuracy and robustness in low-texture scenes are retained.

## Why it matters for SLAM

LDSO answered the question of how a *direct* method — which by design has no repeatable feature descriptors — can do place recognition: keep the photometric core, but make a subset of points feature-like. On sequences with loops it dramatically reduces accumulated rotation, translation, and scale drift, making DSO's accuracy competitive with feature-based SLAM systems end to end. It is the standard reference design for adding loop closure to direct odometry.

## Related

- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [ORB-SLAM](orb-slam.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
