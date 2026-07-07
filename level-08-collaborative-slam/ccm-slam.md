# CCM-SLAM

> Schmuck & Chli 2019 · [Paper](https://github.com/v4rl-ucy/ccm_slam)

**One-line summary** — CCM-SLAM is a centralized collaborative monocular SLAM system in which ORB-SLAM-based agents stream keyframes to a server that performs cross-robot place recognition, map merging, and global optimization — engineered to keep every robot running through communication failures.

## Problem

Single-robot monocular SLAM is limited in coverage and vulnerable to drift; a robotic team can map faster and correct each other's drift — but only if three problems are solved together: (1) sharing map data efficiently over bandwidth-constrained links, (2) merging maps built by different robots at different times into one consistent frame, and (3) surviving communication dropouts without crashing or blinding any client. The extra constraint that makes it hard: small UAVs' onboard computers cannot host a full global map, so the architecture itself must bound client-side resources.

## Key ideas

- **Server-client split**: each robot (client) runs a trimmed ORB-SLAM pipeline for real-time local visual odometry with a bounded local map; the server holds the growing global map and does the expensive work — DBoW2 place recognition across all agents (intra- and inter-robot), loop closure, map fusion, and global bundle adjustment.
- **Map merging on inter-robot loop closure**: when the server confirms that two clients observed the same place, it estimates the relative $\mathrm{SE}(3)$ transform between their submaps (via essential-matrix or PnP computation on the matched features, followed by geometric verification), merges them into one map, runs global BA, and sends corrected map information back to the clients.
- **Robust to communication failures**: clients never depend on the server to keep tracking — keyframes are buffered during dropouts and synchronized retroactively on reconnection, so intermittent WiFi degrades map freshness, not safety. Resilience is built into the architecture, not bolted on at the protocol level.
- **Bounded onboard resources**: client memory and CPU stay constant regardless of mission length, since the global map lives on the server; validated with small UAV teams whose onboard computers could not host a full SLAM map.

## Results & impact

Evaluated on aerial datasets with small UAV teams, CCM-SLAM demonstrated accurate map merging whenever robots traversed overlapping regions, and — its signature result — graceful degradation under unreliable networking, with only a small accuracy penalty even under severe simulated packet loss. As the first mature open-source centralized multi-robot monocular SLAM system on an ORB-SLAM backbone, it became the de-facto baseline that later collaborative systems (including the decentralized generation) compare against.

## Why it matters for SLAM

CCM-SLAM turned the cloud-SLAM concept of C2TAM into a mature, open-source system on a modern (ORB-SLAM) backbone, and became the de-facto baseline that later collaborative systems compare against. Its central lesson — design the architecture so local autonomy survives network loss — carried into essentially all subsequent multi-robot SLAM work, including the decentralized successors (DOOR-SLAM, Kimera-Multi) that removed the server entirely.

## Related

- [C2TAM](c2tam.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Kimera-Multi](kimera-multi.md)
- [DOOR-SLAM](door-slam.md)

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
