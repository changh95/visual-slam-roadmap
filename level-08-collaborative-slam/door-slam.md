# DOOR-SLAM

> Lajoie 2020 · [Paper](https://arxiv.org/abs/1909.12198)

**One-line summary** — DOOR-SLAM is a fully distributed, peer-to-peer SLAM system whose pairwise-consistency-based outlier rejection lets robot teams accept aggressive place-recognition matches while safely filtering out spurious inter-robot loop closures.

## Key ideas

- **Distributed, online, outlier-resilient**: each robot maintains its own pose graph and communicates peer-to-peer; no central server and no full connectivity among robots is required.
- Previous distributed SLAM systems used very conservative place-recognition thresholds to avoid false loop closures, discarding many valid ones. DOOR-SLAM **decouples detection from validation**: it can afford less conservative parameters because a dedicated rejection step filters the outliers.
- **Pairwise Consistency Maximization (PCM)**: candidate inter-robot loop closures are checked for mutual geometric consistency, and the largest pairwise-consistent subset (a maximum-clique problem on the consistency graph) is accepted; measurements outside it are rejected as outliers.
- The distributed front-end detects inter-robot loop closures **without exchanging raw sensor data**, keeping communication bandwidth low and preserving data privacy between robots.
- Validated in simulation, benchmark datasets, and field experiments including **GPS-denied subterranean environments**, producing more inter-robot loop closures and accurate trajectories at low bandwidth.

## Why it matters for SLAM

Perceptual aliasing is the Achilles heel of multi-robot mapping: a single wrong inter-robot loop closure can fold two robots' maps into each other irreparably. DOOR-SLAM made robust outlier rejection a first-class architectural component of distributed SLAM, and its PCM idea was subsequently adopted and extended by later systems (Kimera-Multi uses graduated non-convexity toward the same goal, and Swarm-SLAM comes from the same group). It is the reference design for outlier-resilient decentralized C-SLAM.

## Related

- [Kimera-Multi](kimera-multi.md) — distributed successor with GNC-based robust PGO and semantic meshes
- [Swarm-SLAM](swarm-slam.md) — later decentralized framework by the same first author
- [Inter-robot loop closure](inter-robot-loop-closure.md) — the measurements PCM validates
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — single-robot view of the same outlier problem
- [Communication constraints](communication-constraints.md) — why raw data is never exchanged

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
