# Hydra-Multi

> Chang 2023 · [Paper](https://arxiv.org/abs/2304.13487)

**One-line summary** — First multi-robot spatial perception system: each robot runs Hydra to build a local 3D scene graph online, and a central station aligns, optimizes, and reconciles them into a single globally consistent hierarchical map.

## Problem

3D scene graphs proved to be an expressive high-level map representation, but Hydra could only build one from a single robot's viewpoint — and large environments are impractical for one robot to cover quickly. Multi-robot SLAM systems, meanwhile, produced metric maps without hierarchical semantics. Building a multi-robot scene graph online requires solving three coupled problems: estimating the relative transforms between robot frames (with no initial calibration), detecting inter-robot loop closures despite heavy perceptual aliasing, and reconciling duplicate scene-graph nodes contributed by different robots.

## Method & architecture

**Frontend (control station).** Each robot runs a local Hydra instance and periodically transmits its whole scene graph. A scene graph processor accumulates these into a single *un-optimized, un-reconciled* frontend graph with careful per-node reference-frame bookkeeping. Inter-robot loop closures are found with Hydra's hierarchical detector — top-down descriptor comparison (places → objects → visual appearance) followed by bottom-up geometric verification with RANSAC (visual keypoints) or TEASER++ (objects).

**Backend: align — optimize — reconcile.**

1. *Initial alignment.* Each inter-robot loop closure $(\alpha_{i},\beta_{j})$ between robots $A$ and $B$ gives a noisy estimate of $B$'s frame in $A$'s frame:

$$\widehat{\mathbf{X}}^{A}_{B,ij}=\widehat{\mathbf{X}}^{A}_{\alpha_{i}}\,\widetilde{\mathbf{X}}^{\alpha_{i}}_{\beta_{j}}\big(\widehat{\mathbf{X}}^{B}_{\beta_{j}}\big)^{-1}$$

   where $\widehat{\mathbf{X}}$ are odometric pose estimates and $\widetilde{\mathbf{X}}^{\alpha_{i}}_{\beta_{j}}$ the loop-closure measurement. These estimates are fused by robust pose averaging with a truncated-least-squares cost $\rho$:

$$\widehat{\mathbf{X}}^{A}_{B}\in\arg\min_{\mathbf{X}\in\mathrm{SE}(3)}\;\sum_{(i,j)\in L_{A,B}}\rho\left(\big\|\mathbf{X}\boxminus\widehat{\mathbf{X}}^{A}_{B,ij}\big\|_{\Sigma}\right)$$

   solved with Graduated Non-Convexity (GNC) in GTSAM; a robot counts as initialized once $k=5$ inliers survive, and transforms are chained along a spanning tree of the robot-level dependence graph.
2. *Reconciliation proposal.* After alignment, merge candidates are proposed: place pairs that overlap (distance $\leq 0.01$ m, similar radii) and object pairs with the same semantic label and overlapping bounding boxes (transform from ICP on their mesh vertices).
3. *Robust scene graph optimization.* Agent pose graphs, places, merge-candidate objects, and subsampled mesh control points form an embedded deformation graph, optimized as pose-graph optimization

$$\arg\min_{\mathbf{T}_{1},\ldots,\mathbf{T}_{n}\in\mathrm{SE}(3)}\;\sum_{\mathbf{E}_{ij}}\big\|\mathbf{T}_{i}^{-1}\mathbf{T}_{j}\boxminus\mathbf{E}_{ij}\big\|^{2}_{\mathbf{\Omega}_{ij}}$$

   where edges $\mathbf{E}_{ij}$ are odometry, loop closures, mesh-rigidity, and reconciliation factors; GNC rejects spurious loop closures and wrong merges as outliers.
4. *Node reconciliation.* GNC-inlier merges are executed, the mesh re-interpolated, object centroids/boxes recomputed; if fewer than half the proposed merges are valid, all are undone, and rooms are re-segmented from the merged places.

**Heterogeneous teams.** Any robot whose map is compatible with at least one layer can contribute: an object-based SLAM robot feeds the object layer; a LIDAR robot with a semantics-free mesh still contributes mesh and places — the layered structure is what makes heterogeneous maps fusable.

## Results

- Datasets: simulated uHumans2 office (3 robots), real SidPac (SP, two ~400 m multi-floor recordings as two robots, starting on different floors), and Simmons (SM1/SM2, two Clearpath Jackals with RealSense D455 + LIDAR, ~500 m traversals, where perceptual aliasing yields **80–90% outlier loop closures**).
- **ATE (m)**: Hydra-Multi 0.25 (uH2), 3.92 (SP), 0.99 (SM1), 0.79 (SM2) vs centralized Kimera-Multi 0.59 / 4.99 / 2.0 / 0.87; close to the LIDAR-based LAMP 2.0 (0.73 / 0.58 on SM1/SM2) despite using vision.
- Scene-graph accuracy matches single-robot Hydra with ground-truth frame alignment, and on uH2/SP even slightly exceeds it thanks to inter-robot loop closures.
- Ablation (objects "% Found"): full system 92.9% (uH2) and 59.3% (SM1) vs 80.8% / 23.8% without initial alignment and 91.1% / 37.3% without reconciliation.
- Two robots reconstruct a complete dormitory floor in ~30 minutes vs ~50 minutes for a single robot covering the same area; the frontend stays around 100 ms per iteration, and per-robot loop-closure and deformation-graph traffic stays below 1 MB (raw mesh/scene-graph streaming dominates bandwidth).

## Why it matters for SLAM

Hydra-Multi was the first system to build 3D scene graphs collaboratively across a robot team, extending the Kimera/Hydra line from single-robot to fleet-scale semantic mapping. Its align-optimize-reconcile backend shows that the same robust machinery (GNC over a deformation graph) that corrects loop closures can also arbitrate node merges across robots, and its heterogeneous-team result makes an architectural point: the scene-graph hierarchy itself is the interoperability layer that lets LIDAR-only and vision-based robots share one world model — relevant to search-and-rescue, warehouses, and any multi-robot deployment.

## Related

- [Hydra](hydra.md) — the single-robot scene-graph system each robot runs
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot metric-semantic SLAM from the same lab
- [GNC](gnc.md) — the robust solver behind alignment, optimization, and merge validation
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — the key mechanism for aligning robot maps
- [Map merging](../level-08-collaborative-slam/map-merging.md) — the general problem Hydra-Multi solves at scene-graph level
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md) — Hydra-Multi takes the centralized route
