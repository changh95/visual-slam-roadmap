# Kimera-Multi

> Tian 2022 · [Paper](https://arxiv.org/abs/2106.14386)

**One-line summary** — Kimera-Multi is the first multi-robot system that is simultaneously robust to loop-closure outliers, fully distributed with only peer-to-peer communication, and able to build a globally consistent metric-semantic 3D mesh in real time.

## Problem

Earlier collaborative SLAM systems either depended on a central server or produced purely geometric maps with no semantic content, and all of them were exposed to perceptual aliasing: visually similar places generate incorrect inter- and intra-robot loop closures that can corrupt the joint estimate. Kimera-Multi asks whether a team of robots, communicating only with neighbors when links are available, can build a globally consistent *semantic* 3D mesh in real time while identifying and rejecting those spurious loop closures.

## Key ideas

- **Single-robot frontend from Kimera**: each robot runs visual-inertial odometry and builds a local 3D mesh whose faces carry semantic labels, giving a metric-semantic local map rather than just a trajectory.
- **Distributed place recognition and robust PGO**: when communication is available, robots initiate a distributed place-recognition and robust pose-graph-optimization protocol based on a novel **distributed graduated non-convexity (GNC)** algorithm that improves local trajectory estimates using inter-robot loop closures while staying robust to outliers.
- **GNC instead of max-clique**: rather than solving PCM's NP-hard maximum-clique problem, GNC gradually tightens a robust cost. Each loop closure $(i,j)$ carries an adaptive weight in the pose-graph objective

  $$\min_{\{\mathbf{T}_k\}} \sum_{(i,j)\in\mathcal{E}} w_{ij} \, d\big(\mathbf{T}_i^{-1}\mathbf{T}_j,\, \tilde{\mathbf{T}}_{ij}\big)^2, \qquad w_{ij}^{(t+1)} = \frac{\mu^2}{(\mu + r_{ij}^{(t)})^2},$$

  where $r_{ij}$ is the constraint residual and the control parameter $\mu$ decreases over iterations: weights start near 1 and are driven toward 0 for outliers as the surrogate cost anneals — making robust distributed PGO tractable at scale.
- **Peer-to-peer only**: no central server; all information flows through local robot-to-robot links, yet estimation errors are comparable to a centralized SLAM system with full information.
- **Mesh deformation**: after distributed optimization, each robot corrects its local mesh with mesh deformation techniques so that the reconstruction stays consistent with the improved trajectory instead of tearing at loop closures.
- **Modular by design**: the same machinery can be used for standard 3D reconstruction without semantic labels, or for trajectory estimation without building a mesh at all.

## Results & impact

Demonstrated in photo-realistic simulations, SLAM benchmarking datasets, and challenging outdoor datasets collected with ground robots, involving long trajectories of up to 800 meters per robot. The experiments show that Kimera-Multi (i) outperforms the state of the art in robustness and accuracy, (ii) achieves estimation errors comparable to a centralized SLAM system while being fully distributed, (iii) is parsimonious in communication bandwidth, and (iv) produces accurate metric-semantic 3D meshes. It became the reference point that later distributed systems (e.g., Swarm-SLAM) compare against.

## Why it matters for SLAM

Kimera-Multi is the flagship of the MIT SPARK Kimera ecosystem extended to robot teams, and it set the standard for what a modern distributed SLAM system should deliver: robustness (GNC outlier rejection, following the path opened by DOOR-SLAM's PCM), decentralization, and semantically meaningful dense maps usable for downstream planning. Its metric-semantic mesh output also feeds the scene-graph line of work (Kimera, Hydra, Hydra-Multi). If you need multi-robot mapping with semantics today, this is the canonical reference system.

## Related

- [DOOR-SLAM](door-slam.md) — predecessor for robust distributed loop-closure rejection
- [Swarm-SLAM](swarm-slam.md) — competing decentralized C-SLAM framework
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — the single-robot visual-inertial frontend
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — the single-robot metric-semantic foundation
- [Hydra-Multi](../level-05-deep-learning/hydra-multi.md) — multi-robot scene graphs built on this lineage
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — GNC in its single-robot form

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
