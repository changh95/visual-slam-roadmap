# Centralized vs Decentralized

Collaborative (multi-robot) SLAM systems differ most fundamentally in *where* the global map is assembled.

**Centralized architecture.** A single server (ground station or cloud) aggregates data from all robots and performs global optimization. Each robot runs a lightweight local front-end (tracking, keyframe selection) and streams keyframes, descriptors, or submaps to the server; the server performs cross-robot place recognition, map merging, and global bundle adjustment, then broadcasts the corrected map back. Examples: C2TAM (cloud-based PTAM), CCM-SLAM (server + ORB-SLAM clients), maplab 2.0 (multi-session merging).

- Pros: tightest global consistency (the server sees everything), simple clients, heavy computation offloaded from robots.
- Cons: single point of failure, requires connectivity to the server, server bandwidth and compute must scale with the team, and range is limited by the communication infrastructure.

**Decentralized (peer-to-peer) architecture.** There is no server: robots exchange information directly with neighbors when within communication range, and each robot maintains its own estimate of the (partially) global map. Optimization is distributed — e.g., distributed pose-graph solvers where robots iterate on their own variables and exchange only boundary information. Examples: DOOR-SLAM, Kimera-Multi, Swarm-SLAM.

- Pros: no single point of failure, scales to larger teams, works with intermittent ad-hoc links, and raw data can stay on each robot (privacy/bandwidth).
- Cons: global consistency is harder — distributed optimizers converge more slowly, each robot may temporarily hold a different version of the map, and robust outlier rejection (e.g., PCM, graduated non-convexity) becomes essential because no central authority vets inter-robot loop closures.

| | Centralized | Decentralized |
|---|---|---|
| Global optimization | at server, exact | distributed, iterative |
| Failure tolerance | server is critical | degrades gracefully |
| Communication | robot-to-server | robot-to-robot (neighbors) |
| Typical team size | small (2-4) | larger swarms |

The fundamental tension is between consistency and communication cost: centralized systems achieve tighter global consistency but create a single point of failure; decentralized systems are more robust but harder to optimize globally. Recent work (Kimera-Multi, Swarm-SLAM) trends toward decentralized architectures with robust outlier rejection.

## Why it matters for SLAM

The architecture choice drives everything else in a collaborative SLAM design — what gets transmitted, where loop closures are verified, how map merging happens, and how the system fails. For a small team with reliable WiFi, a centralized system is the simplest path to an accurate shared map; for swarms, subterranean exploration, or contested networks, decentralized designs are the only ones that survive.

## Related

- [CCM-SLAM](ccm-slam.md)
- [Kimera-Multi](kimera-multi.md)
- [Swarm-SLAM](swarm-slam.md)
- [Communication constraints](communication-constraints.md)
- [Map merging](map-merging.md)

---
[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
