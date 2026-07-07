# Hydra-Multi

> Chang 2023 · [Paper](https://arxiv.org/abs/2304.13487)

**One-line summary** — Multi-robot extension of Hydra in which each robot builds its own local 3D scene graph online and a central node merges them into a single globally consistent hierarchical map.

## Problem

3D scene graphs proved to be an expressive high-level map representation, but Hydra could only build one from a single robot's viewpoint — and large environments (multi-floor buildings, campuses) are impractical for one robot to cover quickly. Multi-robot SLAM systems, meanwhile, produced metric maps without hierarchical semantics. Hydra-Multi is the first multi-robot spatial perception system capable of constructing a multi-robot 3D scene graph online from sensor data collected by a robot team, which requires solving three coupled problems: estimating the relative transforms between robot frames, detecting inter-robot loop closures, and reconciling scene-graph nodes contributed by different robots.

## Key ideas

- **Local scene graphs per robot**: Each robot runs a full Hydra front-end, producing its own layered scene graph (mesh, objects, places, rooms) from onboard sensing and streaming incremental updates.
- **Centralized fusion**: A central system takes incremental inputs from multiple robots and constructs a joint 3D scene graph online, rather than merging finished maps after the fact.
- **Relative frame estimation**: The system effectively finds the relative transforms between the robots' coordinate frames, so partial maps built independently can be expressed in one global frame.
- **Inter-robot loop closures**: When robots cover overlapping areas, loop closure detections across robots are incorporated as constraints; these both refine the global alignment and trigger reconciliation of the graph.
- **Scene graph reconciliation**: Once aligned, duplicate object and place nodes observed by multiple robots are correctly merged, yielding one consistent hierarchical map instead of a set of overlapping partial maps.
- **Heterogeneous teams**: Hydra-Multi can fuse different map representations built by robots with different sensor suites — the scene-graph abstraction is what makes maps from heterogeneous platforms compatible.

## Results & impact

Evaluated on simulated and real scenarios, Hydra-Multi reconstructs accurate 3D scene graphs online, and its support for heterogeneous teams was demonstrated by fusing maps from robots carrying different sensors. It is the first system to build 3D scene graphs collaboratively across a robot team, extending the Kimera/Hydra line from single-robot to fleet-scale semantic mapping.

## Why it matters for SLAM

Large environments (multi-floor buildings, campuses) are impractical for a single robot to map quickly, and collaborative SLAM systems before this produced metric maps without hierarchical semantics. Hydra-Multi was the first system to build 3D scene graphs collaboratively across a robot team, extending the Kimera/Hydra line from single-robot to fleet-scale semantic mapping — relevant to search-and-rescue, warehouses, and any multi-robot deployment that needs a shared semantic world model.

## Related

- [Hydra](hydra.md) — the single-robot scene-graph system each robot runs
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot metric-semantic SLAM from the same lab
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — the key mechanism for aligning robot maps
- [Map merging](../level-08-collaborative-slam/map-merging.md) — the general problem Hydra-Multi solves at scene-graph level
- [Centralized vs Decentralized](../level-08-collaborative-slam/centralized-vs-decentralized.md) — Hydra-Multi takes the centralized route

[Back to Level 5](../README.md#level-5-applying-deep-learning)
