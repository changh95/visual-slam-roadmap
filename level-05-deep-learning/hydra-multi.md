# Hydra-Multi

> Chang 2023 · [Paper](https://arxiv.org/abs/2304.13487)

**One-line summary** — Multi-robot extension of Hydra in which each robot builds its own local 3D scene graph online and a central node merges them into a single globally consistent hierarchical map.

## Key ideas

- **Local scene graphs per robot**: Each robot runs a full Hydra instance, producing its own layered scene graph (mesh, objects, places, rooms) from onboard sensing.
- **Inter-robot loop closures**: When robots cover overlapping areas, correspondences are established across robots so their maps can be registered against each other.
- **Global alignment**: Inter-robot constraints enter a global pose-graph optimization that brings all robot frames into a common coordinate system.
- **Scene graph merging**: Once aligned, duplicate object and place nodes observed by multiple robots are fused, yielding one consistent scene graph rather than a set of overlapping partial maps.
- Demonstrated collaborative online construction with multiple robots mapping shared indoor environments.

## Why it matters for SLAM

Large environments (multi-floor buildings, campuses) are impractical for a single robot to map quickly, and collaborative SLAM systems before this produced metric maps without hierarchical semantics. Hydra-Multi was the first system to build 3D scene graphs collaboratively across a robot team, extending the Kimera/Hydra line from single-robot to fleet-scale semantic mapping — relevant to search-and-rescue, warehouses, and any multi-robot deployment that needs a shared semantic world model.

## Related

- [Hydra](hydra.md) — the single-robot scene-graph system each robot runs
- [Kimera-Multi](../level-08-collaborative-slam/kimera-multi.md) — multi-robot metric-semantic SLAM from the same lab
- [Inter-robot loop closure](../level-08-collaborative-slam/inter-robot-loop-closure.md) — the key mechanism for aligning robot maps
- [Map merging](../level-08-collaborative-slam/map-merging.md) — the general problem Hydra-Multi solves at scene-graph level

[Back to Level 5](../README.md#level-5-applying-deep-learning)
