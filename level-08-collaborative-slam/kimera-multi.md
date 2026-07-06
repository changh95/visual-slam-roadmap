# Kimera-Multi

> Tian 2022 · [Paper](https://arxiv.org/abs/2106.14386)

**One-line summary** — Kimera-Multi is the first multi-robot system that is simultaneously robust to loop-closure outliers, fully distributed with only peer-to-peer communication, and able to build a globally consistent metric-semantic 3D mesh in real time.

## Key ideas

- **Single-robot frontend from Kimera**: each robot runs visual-inertial odometry and builds a local 3D mesh whose faces carry semantic labels, giving a metric-semantic local map rather than just a trajectory.
- **Distributed place recognition and robust PGO**: when robots come into communication range, they run a distributed protocol based on a novel **distributed graduated non-convexity (GNC)** algorithm that optimizes the joint pose graph while automatically down-weighting outlier loop closures caused by perceptual aliasing.
- **Peer-to-peer only**: no central server; all information flows through local robot-to-robot links, yet estimation errors are comparable to a centralized SLAM system with full information.
- **Mesh deformation**: after distributed optimization, each robot corrects its local mesh with mesh deformation techniques so that the reconstruction stays consistent with the improved trajectory instead of tearing at loop closures.
- Demonstrated in photo-realistic simulation, SLAM benchmarks, and outdoor ground-robot experiments with long trajectories (up to roughly 800 m per robot), while remaining parsimonious in communication bandwidth.

## Why it matters for SLAM

Kimera-Multi is the flagship of the MIT SPARK Kimera ecosystem extended to robot teams, and it set the standard for what a modern distributed SLAM system should deliver: robustness (GNC outlier rejection, following the path opened by DOOR-SLAM's PCM), decentralization, and semantically meaningful dense maps usable for downstream planning. Its metric-semantic mesh output also feeds the scene-graph line of work (Kimera, Hydra, Hydra-Multi). If you need multi-robot mapping with semantics today, this is the canonical reference system.

## Related

- [DOOR-SLAM](door-slam.md) — predecessor for robust distributed loop-closure rejection
- [Swarm-SLAM](swarm-slam.md) — competing decentralized C-SLAM framework
- [Kimera-VIO](../level-06-vio-vins/kimera-vio.md) — the single-robot visual-inertial frontend
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md) — the single-robot metric-semantic foundation
- [Hydra-Multi](../level-05-deep-learning/hydra-multi.md) — multi-robot scene graphs built on this lineage

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
