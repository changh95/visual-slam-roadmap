# CCM-SLAM

> Schmuck & Chli 2019 · [Paper](https://github.com/v4rl-ucy/ccm_slam)

**One-line summary** — CCM-SLAM is a centralized collaborative monocular SLAM system in which ORB-SLAM-based agents stream keyframes to a server that performs cross-robot place recognition, map merging, and global optimization — engineered to keep every robot running through communication failures.

## Key ideas

- **Server-client split**: each robot (client) runs a trimmed ORB-SLAM pipeline for real-time local visual odometry with a bounded local map; the server holds the growing global map and does the expensive work — DBoW2 place recognition across all agents, loop closure, map fusion, and global bundle adjustment.
- **Map merging on inter-robot loop closure**: when the server confirms that two clients observed the same place, it estimates the relative transform between their submaps, merges them into one map, and optimizes; corrected map information flows back to the clients.
- **Robust to communication failures**: clients never depend on the server to keep tracking — keyframes are buffered during dropouts and synchronized retroactively on reconnection, so intermittent WiFi degrades map freshness, not safety.
- **Bounded onboard resources**: client memory and CPU stay constant regardless of mission length, since the global map lives on the server; validated with small UAV teams whose onboard computers could not host a full SLAM map.

## Why it matters for SLAM

CCM-SLAM turned the cloud-SLAM concept of C2TAM into a mature, open-source system on a modern (ORB-SLAM) backbone, and became the de-facto baseline that later collaborative systems compare against. Its central lesson — design the architecture so local autonomy survives network loss — carried into essentially all subsequent multi-robot SLAM work, including the decentralized successors (DOOR-SLAM, Kimera-Multi) that removed the server entirely.

## Related

- [C2TAM](c2tam.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Kimera-Multi](kimera-multi.md)
- [DOOR-SLAM](door-slam.md)

---
[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
