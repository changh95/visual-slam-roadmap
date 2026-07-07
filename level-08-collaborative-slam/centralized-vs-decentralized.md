# Centralized vs Decentralized

Collaborative (multi-robot) SLAM systems differ most fundamentally in *where* the global map is assembled.

## Centralized architecture

A single server (ground station or cloud) aggregates data from all robots and performs global optimization. Each robot runs a lightweight local front-end (tracking, keyframe selection) and streams keyframes, descriptors, or submaps to the server; the server performs cross-robot place recognition, map merging, and global bundle adjustment, then broadcasts the corrected map back. Examples: C2TAM (cloud-based PTAM), CCM-SLAM (server + ORB-SLAM clients), maplab 2.0 (multi-session merging).

What flows over the network: keyframes (keypoints + descriptors + pose estimates) up; optimized map corrections down. Raw images stay on the robot.

- Pros: tightest global consistency (the server sees everything), simple clients, heavy computation offloaded from robots, one authoritative map.
- Cons: single point of failure, requires connectivity to the server, server bandwidth and compute must scale with the team, and range is limited by the communication infrastructure.

A well-designed centralized system still degrades gracefully: CCM-SLAM clients keep tracking through dropouts by buffering keyframes and synchronizing retroactively, so the server is critical for the *shared* map but not for each robot's safety.

## Decentralized (peer-to-peer) architecture

There is no server: robots exchange information directly with neighbors when within communication range, and each robot maintains its own estimate of the (partially) global map. Optimization is distributed — each robot iterates on its own trajectory variables and exchanges only estimates of the boundary/separator poses with its neighbors, repeating until the network converges toward the global optimum. Examples: DOOR-SLAM, Kimera-Multi, Swarm-SLAM.

What flows over the network: compact place-recognition descriptors during encounters, then features for verifying candidate closures, then small per-iteration optimization messages — never whole maps.

- Pros: no single point of failure, scales to larger teams, works with intermittent ad-hoc links, and raw data can stay on each robot (privacy/bandwidth).
- Cons: global consistency is harder — distributed optimizers converge more slowly, each robot may temporarily hold a different version of the map, and robust outlier rejection (e.g., PCM, graduated non-convexity) becomes essential because no central authority vets inter-robot loop closures.

## Comparison

| | Centralized | Decentralized |
|---|---|---|
| Global optimization | at server, exact | distributed, iterative |
| Failure tolerance | server is critical | degrades gracefully |
| Communication | robot-to-server | robot-to-robot (neighbors) |
| Outlier vetting | server sees all closures | robust back-ends (PCM, GNC) required |
| Map versioning | one authoritative map | temporarily divergent local views |
| Typical team size | small (2-4) | larger swarms |

## How to choose

- Reliable infrastructure (warehouse WiFi, lab, cloud link) and a small team → **centralized**: simplest path to one accurate shared map.
- Intermittent, short-range, or contested links (subterranean, disaster response, swarms) → **decentralized**: the only architecture that keeps working when the network fragments.
- Long-lived mapping across many sessions rather than live collaboration → a centralized *offline* merger (maplab 2.0 style) often suffices, sidestepping live-bandwidth issues entirely.
- Hybrids are common in practice: robots run peer-to-peer in the field and dump to a central server when they regain connectivity.

The fundamental tension is between consistency and communication cost: centralized systems achieve tighter global consistency but create a single point of failure; decentralized systems are more robust but harder to optimize globally. Recent work (Kimera-Multi, Swarm-SLAM) trends toward decentralized architectures with robust outlier rejection.

## Why it matters for SLAM

The architecture choice drives everything else in a collaborative SLAM design — what gets transmitted, where loop closures are verified, how map merging happens, and how the system fails. For a small team with reliable WiFi, a centralized system is the simplest path to an accurate shared map; for swarms, subterranean exploration, or contested networks, decentralized designs are the only ones that survive.

## Related

- [CCM-SLAM](ccm-slam.md)
- [Kimera-Multi](kimera-multi.md)
- [Swarm-SLAM](swarm-slam.md)
- [Communication constraints](communication-constraints.md)
- [Map merging](map-merging.md)
- [DOOR-SLAM](door-slam.md)
