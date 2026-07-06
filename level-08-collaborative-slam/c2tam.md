# C2TAM

> Riazuelo 2014 · [Paper](https://ieeexplore.ieee.org/document/6696630)

**One-line summary** — C2TAM (Cloud framework for Cooperative Tracking And Mapping) pioneered cloud-based collaborative monocular SLAM, offloading expensive bundle adjustment and global map management to a server while each robot keeps only lightweight real-time tracking on board.

## Key ideas

- **Tracking/mapping split across the network**: extending PTAM's two-thread decomposition, the *tracking* process runs on the robot against a locally cached map, while the *mapping* process (keyframe management, triangulation, bundle adjustment, place recognition) runs in the cloud.
- **Bandwidth-conscious uploads**: clients send keyframes (keypoints, descriptors, pose estimates) rather than raw video, keeping the link usage low — a pattern that all later centralized collaborative systems adopted.
- **Asynchronous map updates**: local tracking continues on the cached map during cloud round-trip latency; optimized maps are pushed back periodically, so the robot never blocks on the network.
- **Cooperative mapping and map reuse**: the server detects overlap between different clients' maps via place recognition and fuses them, enabling several cheap camera-equipped robots to build and share one map, and allowing new sessions to relocalize in stored maps.

## Why it matters for SLAM

C2TAM established the cloud-robotics division of labor for SLAM — heavy optimization in the cloud, light tracking at the edge — and demonstrated that real network latency is compatible with real-time visual SLAM when the two loops are decoupled. It is the direct conceptual ancestor of CCM-SLAM and of modern centralized/cloud mapping services, and its client-server keyframe protocol remains the default template for centralized collaborative SLAM.

## Related

- [PTAM](../level-03-monocular-slam/ptam.md)
- [CCM-SLAM](ccm-slam.md)
- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Communication constraints](communication-constraints.md)

---
[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
