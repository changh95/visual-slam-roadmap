# Visual-SLAM why filter?

> Strasdat 2012 · [Paper](https://doi.org/10.1016/j.imavis.2012.02.009)

**One-line summary** — Rigorously showed that keyframe-based bundle adjustment outperforms EKF filtering for the same computational budget, formalizing visual SLAM's paradigm shift from filtering to optimization.

## Problem

By 2012 the field had two working recipes for real-time monocular SLAM: MonoSLAM (2007) jointly estimated camera pose and landmarks with an Extended Kalman Filter, while PTAM (2007) introduced keyframe-based bundle adjustment. Both ran in real time, but the community lacked a principled comparison — filtering processes *every* frame and maintains a dense covariance, while keyframe BA selects informative frames and re-optimizes geometry, so raw accuracy numbers alone could not settle which use of a fixed compute budget is better. Strasdat, Montiel, and Davison posed exactly that question: for the same computational budget, which paradigm buys more accuracy?

## Key ideas

- **Entropy-based accuracy metric**: accuracy is measured as the Shannon entropy of the posterior distribution over poses and landmarks — an information-theoretic measure that permits fair comparison between estimators with different state dimensions.
- **Accuracy per unit of compute**: for a fixed budget, filtering can process $N_f$ frames at $O(N_f M^2)$ cost in the number of landmarks $M$ (dense covariance updates), while keyframe BA spends the same budget on $K$ informative keyframes and many more landmarks, with the Schur complement exploiting the sparse structure. The analysis shows BA reaches lower entropy (higher accuracy) for equivalent budgets.
- **Landmarks beat frames**: a central practical conclusion — increasing the *number of landmarks* improves accuracy far more than increasing the number of processed frames, and BA is precisely the paradigm that can afford many landmarks.
- **Linearization matters**: the EKF fixes its linearization point when a measurement is absorbed and can never revisit it, so errors from linearizing at suboptimal estimates accumulate as information loss; BA relinearizes all residuals around the current best estimate at every iteration.
- **One machinery, many modes**: the same optimization framework covers full BA, motion-only BA (tracking against a fixed map), and scale-drift-aware BA on $\mathrm{Sim}(3)$ used for monocular loop closure — the toolkit modern keyframe SLAM is assembled from.

## Results & impact

On simulated and real sequences, keyframe BA achieved 2–10× lower pose error than the EKF for the same computational budget, with the advantage growing with scene size as the EKF's $O(N^2)$ covariance update becomes increasingly wasteful. The paper provided the theoretical justification for the filtering-to-optimization shift PTAM had demonstrated empirically, cemented keyframe BA as the standard visual SLAM backend, and directly motivated the designs of ORB-SLAM, LSD-SLAM, DSO, and virtually all subsequent systems. Its accuracy-versus-budget methodology itself became a standard way to evaluate SLAM design choices.

## Why it matters for SLAM

This paper provided the theoretical justification for the shift that PTAM demonstrated empirically, cementing keyframe-based bundle adjustment as the standard visual SLAM backend. ORB-SLAM, LSD-SLAM, DSO, and essentially all subsequent systems are built on its conclusion. Note the nuance that matters today: the argument is about vision-only SLAM with many landmarks — tightly-coupled VIO systems still use filters (e.g. MSCKF) where the trade-offs differ.

## Related

- [MonoSLAM](monoslam.md) — the EKF-based side of the comparison
- [PTAM](ptam.md) — the keyframe-BA side of the comparison
- [ORB-SLAM](orb-slam.md) — the archetypal system built on this conclusion
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md) — how the trade-off plays out in VIO
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — why BA scales so well

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
