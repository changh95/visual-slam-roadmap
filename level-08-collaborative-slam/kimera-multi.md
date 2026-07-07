# Kimera-Multi

> Tian 2022 · [Paper](https://arxiv.org/abs/2106.14386)

**One-line summary** — Kimera-Multi is the first multi-robot system that is simultaneously robust to loop-closure outliers, fully distributed with only peer-to-peer communication, and able to build a globally consistent metric-semantic 3D mesh in real time.

## Problem

Earlier collaborative SLAM systems either depended on a central server or produced purely geometric maps with no semantic content, and all of them were exposed to perceptual aliasing: visually similar places generate incorrect inter- and intra-robot loop closures that can corrupt the joint estimate. Existing robust techniques either rely too heavily on initialization or use heuristic searches (like PCM's maximum clique) with low recall. Kimera-Multi asks whether a team of robots, communicating only with neighbors when links are available, can build a globally consistent *semantic* 3D mesh in real time while identifying and rejecting spurious loop closures.

## Method & architecture

**Per-robot frontend.** Each robot runs Kimera: Kimera-VIO for visual-inertial odometry and a local 3D mesh whose faces carry semantic labels. When robots come into communication range, distributed place recognition exchanges bag-of-words vectors; matches trigger geometric verification, which transmits keypoints and feature descriptors to compute putative inter-robot loop closures.

**Stage 1 — robust initialization.** A loop closure between pose $i$ of robot $\alpha$ (frame $A$) and pose $j$ of robot $\beta$ (frame $B$) yields a candidate frame alignment

$$\widehat{X}^{A}_{B_{ij}} \triangleq \widehat{X}^{A}_{\alpha_i}\, \widetilde{X}^{\alpha_i}_{\beta_j}\, \big(\widehat{X}^{B}_{\beta_j}\big)^{-1},$$

where $\widehat{X}$ are odometric pose estimates and $\widetilde{X}^{\alpha_i}_{\beta_j}$ the measured loop closure. Inlier alignments mutually agree, so the relative frame transform is found by robust pose averaging, $\widehat{X}^{A}_{B} \in \arg\min_{X \in \mathrm{SE}(3)} \sum_{(i,j) \in L_{\alpha,\beta}} \rho(r_{ij}(X))$ with $\rho$ the truncated least squares (TLS) cost, solved locally with GNC (GTSAM). A spanning tree of the robot-level dependency graph propagates one robot's frame to the whole team.

**Stage 2 — distributed graduated non-convexity (D-GNC).** All trajectories are refined by robust PGO over odometry (quadratic) and loop closures (TLS), with residuals measured by the chordal distance. GNC uses the Black–Rangarajan duality to rewrite robust estimation as

$$\min_{x\in\mathcal{X},\, w_i\in[0,1]}\; \sum_i \big[\, w_i\, r_i^2(x) + \Phi_{\rho_\mu}(w_i) \,\big],$$

where $w_i$ is a confidence weight per measurement, $\Phi_{\rho_\mu}$ an outlier-process penalty, and the control parameter $\mu$ anneals the surrogate cost from convex toward the true TLS cost. D-GNC alternates two fully distributed steps: (i) a *variable update* — weighted PGO solved with the Riemannian block-coordinate descent (RBCD) solver on a rank-restricted relaxation (rank 5, 15 iterations per update by default), where each robot updates only its own trajectory and exchanges only "public poses" with neighbors; and (ii) a *weight update* — the TLS closed form, computed independently per loop closure:

$$w_i \leftarrow \begin{cases} 0, & \widehat{r}_i^{\,2} \in \big[\tfrac{\mu+1}{\mu}\bar{c}^2,\, +\infty\big], \\ \frac{\bar{c}}{\widehat{r}_i}\sqrt{\mu(\mu+1)} - \mu, & \widehat{r}_i^{\,2} \in \big[\tfrac{\mu}{\mu+1}\bar{c}^2,\, \tfrac{\mu+1}{\mu}\bar{c}^2\big], \\ 1, & \widehat{r}_i^{\,2} \in \big[0,\, \tfrac{\mu}{\mu+1}\bar{c}^2\big], \end{cases}$$

with $\widehat{r}_i$ the current residual and $\bar{c}$ the TLS threshold — outlier weights are driven to 0 as $\mu$ anneals. Finally, each robot corrects its local semantic mesh with mesh deformation so the reconstruction stays consistent with the optimized trajectory.

## Results

- **Simulation + EuRoC (Table I, ATE in m):** on the photo-realistic Medfield scene (2396 m total trajectory), D-GNC reaches 3.92 m vs 64.2 m for naive least squares, 12.5 m for PCM, and 3.88 m for *centralized* GNC; on EuRoC Machine Hall (five sequences as five robots, 466 m), 0.41 m vs 1.76 m for PCM and 0.52 m centralized. PCM followed by GNC is consistently worse than D-GNC alone due to PCM's low recall.
- **Communication (Table II):** on Medfield, the full distributed pipeline uses 65.9 MB (22.6 place recognition + 41.5 geometric verification + 1.8 DPGO) vs 2113 MB for centralizing raw images (141 MB for keypoints only).
- **Real outdoor datasets (Jackal UGV, RealSense D435i):** on Medfield (robots of 600/860/728 m), end-to-end errors drop from 18.74/14.84/24.55 m (Kimera-VIO) to 0.01/0.13/0.09 m — identical to the centralized solver; 100 RBCD iterations take 53 s on a 15650-pose graph. On the harder MIT Stata dataset (few inter-robot loop closures), errors are 0.03/33.13/1.26 m vs 0.01/21.56/1.17 m centralized, requiring full variable updates (2000 RBCD iterations, 14 min). D-GNC rejects heavy outlier contamination, e.g. accepting 340 of 707 putative robot 1–robot 2 loop closures on Medfield.

## Why it matters for SLAM

Kimera-Multi is the flagship of the MIT SPARK Kimera ecosystem extended to robot teams, and it set the standard for what a modern distributed SLAM system should deliver: robustness (GNC outlier rejection, following the path opened by DOOR-SLAM's PCM), decentralization with centralized-level accuracy, and semantically meaningful dense maps usable for downstream planning. Its metric-semantic mesh output also feeds the scene-graph line of work (Kimera, Hydra, Hydra-Multi). If you need multi-robot mapping with semantics today, this is the canonical reference system.

## Related

- [DOOR-SLAM](door-slam.md) — predecessor for robust distributed loop-closure rejection
- [Swarm-SLAM](swarm-slam.md) — competing decentralized C-SLAM framework
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — the single-robot visual-inertial frontend
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — the single-robot metric-semantic foundation
- [Hydra-Multi](../level-05-deep-learning/hydra-multi.md) — multi-robot scene graphs built on this lineage
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — GNC in its single-robot form
