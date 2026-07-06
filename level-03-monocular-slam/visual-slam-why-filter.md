# Visual-SLAM why filter?

> Strasdat 2012 · [Paper](https://doi.org/10.1016/j.imavis.2012.02.009)

**One-line summary** — Rigorously showed that keyframe-based bundle adjustment outperforms EKF filtering for the same computational budget, formalizing visual SLAM's paradigm shift from filtering to optimization.

## Key ideas

- **The question**: MonoSLAM (EKF filtering) and PTAM (keyframe bundle adjustment) both ran in real time, but the community lacked a principled comparison of the two paradigms.
- **Accuracy per unit of compute**: the analysis compares approaches at a fixed computational budget, using the entropy of the posterior over poses and landmarks as an information-theoretic accuracy measure.
- **Why BA wins**: filtering spends its budget processing every frame and maintaining a dense covariance with $O(N^2)$ cost in map size, while keyframe BA spends it on informative frames and many landmarks, exploiting sparsity via the Schur complement.
- **Linearization matters**: the EKF fixes linearization points at the prior and cannot revisit them, losing information; BA relinearizes at each iteration around the current best estimate.
- **Scale-aware and motion-only BA**: the same optimization machinery covers full BA, motion-only BA (tracking against a fixed map), and scale-drift-aware variants used in monocular SLAM.

## Why it matters for SLAM

This paper provided the theoretical justification for the shift that PTAM demonstrated empirically, cementing keyframe-based bundle adjustment as the standard visual SLAM backend. ORB-SLAM, LSD-SLAM, DSO, and essentially all subsequent systems are built on its conclusion. Note the nuance that matters today: the argument is about vision-only SLAM with many landmarks — tightly-coupled VIO systems still use filters (e.g. MSCKF) where the trade-offs differ.

## Related

- [MonoSLAM](monoslam.md) — the EKF-based side of the comparison
- [PTAM](ptam.md) — the keyframe-BA side of the comparison
- [ORB-SLAM](orb-slam.md) — the archetypal system built on this conclusion
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md) — how the trade-off plays out in VIO
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — why BA scales so well

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
