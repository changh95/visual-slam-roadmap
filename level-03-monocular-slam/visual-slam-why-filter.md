# Visual-SLAM why filter?

> Strasdat 2012 · [Paper](https://doi.org/10.1016/j.imavis.2012.02.009)

**One-line summary** — Rigorously showed that keyframe-based bundle adjustment gives more accuracy per unit of computing time than filtering, formalizing visual SLAM's paradigm shift from filtering to optimization.

## Problem

By 2012 the field had two working recipes for real-time monocular SLAM: MonoSLAM (2007) jointly estimated camera pose and landmarks with an EKF, while PTAM (2007) introduced keyframe-based bundle adjustment. Both ran in real time, but the community lacked a principled comparison. The two paradigms make opposite structural choices on the SLAM graph: filtering *marginalises out* all past poses, leaving a dense joint distribution over the current pose and all landmarks, while keyframe BA simply *discards* non-keyframe poses and their measurements, keeping the problem sparse. Strasdat, Montiel, and Davison asked: for the same computational budget, which choice buys more accuracy?

## Method & architecture

**Two carefully matched pipelines**, both implemented and run in Monte Carlo simulation.

*BA-SLAM*: at each keyframe, initialise replacement points where features left the view, estimate the pose by motion-only BA, refine points by structure-only BA, then jointly optimise everything (g2o, Levenberg–Marquardt with Schur complement):

$$
\chi^2(\mathbf{y}) = \sum_{\mathbf{z}_{i,j} \in Z_{0:i}} \big(\mathbf{z}_{i,j} - \hat{\mathbf{z}}(\mathbf{T}_i, \mathbf{x}_j)\big)^2, \qquad
\chi^2(\mathbf{T}_i) = \sum_{\mathbf{z}_j \in Z_i} \big(\mathbf{z}_j - \hat{\mathbf{z}}(\mathbf{T}_i, \mathbf{x}_j)\big)^2,
$$

over $\mathbf{y} = (\mathbf{T}_1, ..., \mathbf{T}_i, \mathcal{X})^\top$ with the first frame fixed as gauge.

*Filter-SLAM*: a state-of-the-art Gauss–Newton information filter, deliberately built to be the best case for filtering: points use anchored inverse-depth coordinates $\boldsymbol{\psi}_j := \mathrm{inv\_d}(A_{a(j)}\, \mathbf{x}_j)$ with $\mathrm{inv\_d}(\mathbf{a}) = \frac{1}{a_3}(a_1, a_2, 1)^\top$, and each update minimises measurement residuals against the Gaussian map prior:

$$
\chi^2(\Phi_i, \mathbf{T}_i) = (\Phi_i \boxminus \Phi_{i-1})^\top \Lambda_{\Phi_{i-1}} (\Phi_i \boxminus \Phi_{i-1}) + \sum_{\mathbf{z}_j \in Z_i} \mathbf{d}_j^\top \Lambda_z \mathbf{d}_j,
$$

followed by the information-matrix update $\Lambda_i = \Lambda_{i-1} + D^\top \mathrm{diag}(\Sigma_z^{-1}, \ldots)\, D$, where $D$ is the stacked reprojection Jacobian. The defining filter property: the linearisation point of absorbed measurements is fixed forever, whereas BA relinearises everything each iteration.

**Metrics.** Accuracy is the end-pose translation error, measured as RMSE and as *entropy reduction* in bits relative to the weakest configuration,

$$
E = \frac{1}{2} \log_2 \frac{\det(\Sigma_{\langle M_{\min},\,15 \rangle})}{\det(\Sigma_{\langle M,N \rangle})},
$$

for varying numbers of intermediate frames $M$ and points $N$; efficiency is entropy reduction per second of compute ($E/c$, bits per second). Asymptotics: BA costs $O(NM^2 + M^3)$ (Schur complement + reduced camera system), filtering costs $O(MN^3)$ — linear vs cubic in the number of points. Four camera motions are tested (sideways with full scene overlap; sideways with partial overlap; sideways + 30° rotation; sharp forward turn), each monocular and stereo, with $\sigma_z = \frac{1}{2}$ pixel measurement noise.

## Results

- **Landmarks beat frames** — the paper's self-declared "single most important result": increasing the number of points $N$ significantly reduces entropy in every configuration, while increasing the number of frames $M$ has only a minor accuracy effect (its real role is robustness, e.g. against monocular initialisation failures at $M=2$).
- The well-parametrised filter *matches* BA accuracy in the three moderate settings — the difference is cost: since BA is linear in $N$ and filtering cubic, only BA can afford the many landmarks that accuracy demands.
- In the sharp-forward-turn monocular setting, filter accuracy degrades *below* BA because measurement Jacobians are never relinearised — the classic Gaussian-filter consistency problem.
- In combined accuracy/cost (bits per second), BA is more efficient in general; filtering is competitive only for low accuracy demands (small $M$ and small $N$).
- Conclusion, verbatim in spirit: keyframe BA outperforms filtering because it gives the most accuracy per unit of computing time.

## Why it matters for SLAM

This paper provided the theoretical justification for the shift that PTAM demonstrated empirically, cementing keyframe-based bundle adjustment as the standard visual SLAM backend. ORB-SLAM, LSD-SLAM, DSO, and essentially all subsequent systems are built on its conclusion, and its accuracy-versus-budget methodology became a standard way to argue SLAM design choices. Note the nuance that matters today: the argument is about vision-only SLAM with many landmarks — tightly-coupled VIO systems still use filters (e.g. MSCKF) where the trade-offs differ, and the authors themselves scoped the claim to local SLAM with loop closure left to appearance-based methods.

## Related

- [MonoSLAM](monoslam.md) — the filtering side of the comparison
- [PTAM](ptam.md) — the keyframe-BA side of the comparison
- [ORB-SLAM](orb-slam.md) — the archetypal system built on this conclusion
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md) — how the trade-off plays out in VIO
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md) — why BA scales so well
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — the estimation view underlying the whole argument
