# OKVIS2

> Leutenegger 2022 · [Paper](https://arxiv.org/abs/2202.09199)

**One-line summary** — OKVIS2 upgrades the classic OKVIS sliding-window VIO into a real-time, scalable visual-inertial *SLAM* system by marginalizing common observations into pose-graph edges that can be fluidly turned back into landmarks and observations upon loop closure.

## Problem

Sliding-window VIO systems bound computation by marginalizing or fixing old states, but classic marginalization is a one-way street: tight integration of loop closure and large-scale map management "constitutes an inherent challenge to schemes that employ marginalisation of old states and landmarks." ORB-SLAM3 instead simply *fixes* old states — simpler but "inherently not a conservative approximation, as it effectively ignores past estimation uncertainties." OKVIS2 targets robust, accurate estimation for robotics and AR/VR with particular attention to *long* and *repeated* loop closures, using one bounded factor graph that behaves like odometry and full SLAM at once.

## Method & architecture

The system splits into a **frontend** (state initialization, BRISK keypoint matching, stereo triangulation, segmentation CNN, place recognition/relocalization) and a **realtime estimator** running synchronously per multi-frame, plus an **asynchronous full-graph loop optimization**. The estimator minimizes (Ceres, Cauchy-robustified observations):

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i}\sum_{k\in\mathcal{K}}\sum_{j\in\mathcal{J}(i,k)} \rho\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}}\, \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k\in\mathcal{P}\cup\mathcal{K}\setminus f} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k}\, \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r\in\mathcal{P}}\sum_{c\in\mathcal{C}(r)} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c}\, \mathbf{e}_{\mathrm{p}}^{r,c},$$

over reprojection errors $\mathbf{e}_{\mathrm{r}}^{i,j,k} = \tilde{\mathbf{z}}^{i,j,k} - \mathbf{h}\big(\mathbf{T}_{SC_i}^{-1}\, \mathbf{T}_{S^k W}\, {}_{W}\mathbf{l}^{j}\big)$, preintegrated IMU errors $\mathbf{e}_{\mathrm{s}}^{k} = \hat{\mathbf{x}}^{n}(\mathbf{x}^{k}, \tilde{\mathbf{z}}_{\mathrm{s}}^{k,n}) \boxminus \mathbf{x}^{n} \in \mathbb{R}^{15}$, and relative pose (pose-graph) errors. $\mathcal{K}$ holds the $T$ most recent frames plus $M$ keyframes with live observations; $\mathcal{P}$ holds pose-graph frames reaching much further into the past.

- **Posegraph creation (the key contribution)**: when $|\mathcal{K}|$ exceeds a bound $K$, the keyframe with least co-visibility is converted to a pose-graph node. Its joint observations with a connected frame are compressed into a relative pose factor
  $$\mathbf{e}_{\mathrm{p}}^{r,c} = \mathbf{e}_{\mathrm{p},0}^{r,c} + \begin{bmatrix} {}_{S^r}\mathbf{r}_{S^c} - {}_{S^r}\tilde{\mathbf{r}}_{S^c} \\ \mathbf{q}_{S^rS^c} \boxminus \tilde{\mathbf{q}}_{S^rS^c} \end{bmatrix},$$
  whose weight comes from actually marginalizing the co-observed landmarks with the Schur complement, $\mathbf{H}^{*} = \mathbf{H}_{\mathrm{p},\mathrm{p}} - \sum_j \mathbf{H}_{\mathrm{p},j}\mathbf{H}_{jj}^{+}\mathbf{H}_{\mathrm{p},j}^{T}$, giving $\mathbf{W}_{\mathrm{p}}^{r,c} = \mathbf{H}^{*}$ and $\mathbf{e}_{\mathrm{p},0}^{r,c} = -\mathbf{H}^{*+}\mathbf{b}^{*}$ — a principled alternative to the de-facto standard identity-weight pose-graph edges.
- **Edge selection**: a Maximum Spanning Tree over co-observation counts decides which edges to create, keeping the graph sparse; the oldest keyframe is retained while it still shares observations with the present, preserving long-term directional accuracy.
- **Loop closure with landmark revival**: a DBoW2 query plus 3D-2D RANSAC verification re-aligns the active window to the matched pose; pose-graph edges connecting it are "revived" back into landmarks and observations, landmarks are merged, the loop error is distributed by rotation averaging, and a background full-graph optimization (IMU factors included, states inside the loop variable) is later synchronized into the realtime graph.
- **Bounded realtime problem**: only the $A = \max(A_{\min}, A_{\Delta T})$ most recent states stay variable; experiments use $T{=}3$, $K{=}5$, $L{=}5$ loop-closure frames, $A_{\min}{=}12$, $\Delta T{=}2$ s.
- **Dynamic-content removal**: a light-weight Fast-SCNN segmentation CNN runs asynchronously on the CPU on keyframes only, removing observations into sky/cloud regions that the Cauchy robustifier alone does not reject.

## Results

Evaluated on EuRoC and TUM-VI (ATE after position + yaw alignment, causal vs. non-causal reported separately):

- **EuRoC** average ATE: OKVIS2 non-causal **0.031 m** vs. ORB-SLAM3 0.035, causal 0.048, VIO-mode 0.071; original OKVIS 0.089, Kimera 0.119, VINS-Fusion 0.138.
- **TUM-VI**: on-par with ORB-SLAM3 on short corridor/room sequences (room avg 0.01 m), clearly best on long ones — magistrale avg 0.28 m vs. ORB-SLAM3 0.81 m, outdoors avg 11.60 m vs. 17.87 m, slides avg 0.54 m vs. 0.45 m — and it achieves loop closures on sequences where ORB-SLAM3 reports none.
- Per-frame timings (i7-11700K): detect & describe 7.1 ms, match & triangulate 26.6 ms, loop-closure attempts 17.7 ms, realtime graph optimization 33.2 ms, posegraph edge handling 14.0 ms; background loop optimizations take tens of ms up to ~1 s for very long loops.

## Why it matters for SLAM

OKVIS (2015) defined the sliding-window optimization + marginalization architecture for VIO, but could not undo marginalization when a loop was found. OKVIS2's marginalization-derived pose-graph edges are a principled middle ground between Schur-complement priors and full landmark retention — the estimator moves fluidly between odometry and full SLAM without a map reset. It is the direct foundation of OKVIS2-X, which extends the same factor graph with depth, LiDAR, and GNSS.

## Related

- [OKVIS](okvis.md)
- [OKVIS2-X](okvis2-x.md)
- [IMU preintegration](imu-preintegration.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [VINS-Mono](vins-mono.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
