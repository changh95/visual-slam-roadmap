# Marginalization

A real-time SLAM estimator cannot keep every past pose and landmark as an active variable — the problem would grow without bound. **Marginalization** is the probabilistically correct way to remove old variables: instead of simply deleting them (which throws away their information), you integrate them out of the joint distribution, leaving behind a *prior* on the remaining variables that summarizes what the removed variables contributed.

Algebraically, marginalization is the Schur complement. Partition the linearized system into variables to keep ($\mathbf{k}$) and variables to marginalize ($\mathbf{m}$):

$$
\begin{bmatrix} H_{kk} & H_{km} \\ H_{mk} & H_{mm} \end{bmatrix}
\begin{bmatrix} \Delta\mathbf{x}_k \\ \Delta\mathbf{x}_m \end{bmatrix}
=
\begin{bmatrix} \mathbf{b}_k \\ \mathbf{b}_m \end{bmatrix}
$$

Eliminating $\mathbf{m}$ gives the reduced system:

$$
H_{\text{prior}} = H_{kk} - H_{km} H_{mm}^{-1} H_{mk}, \qquad
\mathbf{b}_{\text{prior}} = \mathbf{b}_k - H_{km} H_{mm}^{-1} \mathbf{b}_m
$$

$(H_{\text{prior}}, \mathbf{b}_{\text{prior}})$ then acts as a dense prior factor on the kept variables in all future optimizations. Note the trade: information is preserved, but sparsity is not — marginalization *densifies* the connections among the variables the removed ones touched. This is why systems marginalize carefully chosen variables (old keyframes, their landmarks) rather than arbitrary ones.

**Fixed-lag smoothing** is the estimator architecture built on this operation: keep a sliding window of the most recent states as active nonlinear variables; when the window is full, marginalize the oldest state out into the prior. This bounds computation per frame while retaining (a linearized summary of) all past information — the standard design of optimization-based VIO from OKVIS onward. VINS-Mono, for instance, marginalizes either the oldest frame or the second-newest frame depending on whether the incoming frame is a keyframe.

The catch is **consistency**. The prior is linearized at the estimates that held *at the time of marginalization*, and it cannot be re-linearized later (the marginalized variables are gone). If the remaining variables' linearization points drift while the frozen prior stays put, the estimator mixes Jacobians from different linearization points and gains spurious information — the "FEJ problem." Standard mitigations: **First-Estimate Jacobians** (evaluate Jacobians of prior-connected variables at their first estimates), square-root/Cholesky-form priors for numerical stability (Basalt), delayed marginalization (DM-VIO), or recovering nonlinear factors instead of keeping the linear prior (Basalt's nonlinear factor recovery).

Contrast with the alternative back-end style: incremental smoothing (iSAM2) keeps all variables and updates cleverly, avoiding the frozen-prior problem at the cost of a growing (if efficiently maintained) problem. Fixed-lag + marginalization buys strictly bounded cost — the right trade for embedded VIO.

## Why it matters for SLAM

Marginalization is the workhorse that makes real-time, bounded-memory visual-inertial odometry possible; the sliding window + Schur-complement-prior + FEJ pattern is the literal architecture of OKVIS, VINS-Mono, Basalt, and DM-VIO. It is also where the theory bites hardest in practice: mishandled marginalization is the classic cause of overconfident, inconsistent estimators, which is why this concept links tightly to consistency and observability.

## Related

- [Schur complement / Sparsity](schur-complement-sparsity.md)
- [Consistency](consistency.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [OKVIS](../level-06-vio-vins/okvis.md)
- [DM-VIO](../level-06-vio-vins/dm-vio.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
