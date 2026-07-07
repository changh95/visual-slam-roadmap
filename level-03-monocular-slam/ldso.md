# LDSO

> Gao 2018 · [Paper](https://arxiv.org/abs/1808.01111)

**One-line summary** — Extended DSO into a full SLAM system by adding BoW-based loop closure and Sim(3) pose-graph optimisation, fixing DSO's main weakness (unbounded drift) while keeping its photometric tracking core.

## Problem

DSO achieves excellent local accuracy through sliding-window photometric bundle adjustment, but it is pure odometry: no place recognition, no loop closure, no global optimisation, so drift grows without bound on long trajectories. Adding loop closure to a direct method is non-trivial because direct methods select pixels by gradient, not repeatability — there are no descriptors to feed a bag-of-words place-recognition database. LDSO bridges this gap without giving up DSO's photometric core.

## Key ideas

- **Corner-favouring point selection**: DSO picks any high-gradient pixels, which are not repeatable enough for place recognition. LDSO biases point selection toward corner features (Shi-Tomasi) while still keeping ordinary gradient points, and assigns ORB descriptors to the corners. The abstract stresses that this "retains the tracking accuracy and robustness" of DSO while "ensuring repeatability of some of these points".
- **BoW loop detection**: with ORB descriptors available, a DBoW2 bag-of-words vocabulary retrieves loop-closure candidates efficiently, exactly as in ORB-SLAM — direct tracking and feature-based place recognition coexist in one system.
- **Sim(3) loop constraints**: because monocular odometry drifts in *scale* as well as pose, loop closures are estimated as 7-DoF $\mathrm{Sim}(3)$ relative transforms, computed by jointly minimising 2D reprojection and 3D geometric error terms between the loop candidate frames, after geometric verification.
- **Fusion with the odometry graph**: loop constraints are fused with a covisibility graph of relative $\mathrm{SE}(3)$ poses extracted from DSO's sliding-window optimisation, and the whole pose graph is optimised — the photometric window handles local accuracy, the graph handles global consistency.
- **Unchanged photometric frontend**: DSO's direct tracking and windowed photometric bundle adjustment are preserved untouched, so robustness in featureless and low-texture areas — the reason to use a direct method at all — is retained.

## Results & impact

- The abstract: pose-graph optimisation "significantly reduces the accumulated rotation-, translation- and scale-drift, resulting in an overall performance comparable to state-of-the-art feature-based systems, even without global bundle adjustment."
- Evaluated on public datasets (TUM monoVO, KITTI, and EuRoC), showing that the modified point selection does not hurt odometric accuracy while loop closure removes most accumulated error on loopy sequences.
- Became the standard reference design for adding loop closure to direct odometry, and a common baseline in later direct/hybrid SLAM papers.

## Why it matters for SLAM

LDSO answered the question of how a *direct* method — which by design has no repeatable feature descriptors — can do place recognition: keep the photometric core, but make a subset of points feature-like. It is also a clean case study in SLAM architecture: frontend odometry (DSO) plus backend pose graph with $\mathrm{Sim}(3)$ loop constraints, the same drift-correction pattern as LSD-SLAM and ORB-SLAM, showing that the two paradigm "camps" (direct vs feature-based) are complementary rather than exclusive.

## Related

- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [ORB-SLAM](orb-slam.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Scale ambiguity](scale-ambiguity.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
