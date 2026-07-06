# Communication constraints

Multi-robot SLAM lives or dies by its communication budget. Real robot teams talk over bandwidth-limited, intermittent links — WiFi at the edge of range, ad-hoc mesh radios, or underground/underwater channels measured in kilobits per second. Transmitting raw sensor streams or dense maps is infeasible, so collaborative SLAM systems are designed around *what can be shared cheaply*:

- **Sparse descriptors instead of images.** Robots exchange compact place-recognition signatures — bag-of-words vectors (DBoW2) or learned global descriptors (NetVLAD) — a few hundred bytes per keyframe instead of megabytes of pixels. Full feature sets or raw images are sent only after a promising match, if at all (C2TAM already transmitted only keypoints + descriptors, never images).
- **Compact map representations.** Pose graphs and sparse landmark sets travel; dense meshes, TSDFs, or point clouds usually stay local, with at most compressed submaps or boundary information exchanged.
- **Incremental / deduplicated exchange.** Track what each neighbor already has and send only novel data (Swarm-SLAM's sparse descriptor exchange), rather than re-broadcasting whole databases.
- **Prioritization under budget.** When the link cannot carry every candidate loop closure, spend verification bandwidth on the most valuable ones — e.g., Swarm-SLAM scores candidates by similarity, uncertainty, and whether they connect disconnected subgraphs.
- **Tolerance to dropouts.** Connectivity is intermittent by assumption: clients buffer keyframes locally and upload retroactively after reconnecting (CCM-SLAM), and local odometry must continue unaffected when the network disappears.
- **Distributed optimization with small messages.** Decentralized pose-graph solvers are chosen partly because their per-iteration messages (a few poses or gradients between neighbors) are tiny compared to shipping full maps.

A useful mental model: the communication channel is another sensor-budget constraint, like CPU or battery. Every architectural feature of collaborative SLAM — centralized vs decentralized, descriptor choice, submap granularity, loop-closure prioritization — can be read as an answer to "what fits through the pipe?"

## Why it matters for SLAM

Algorithms that look identical on a benchmark differ by orders of magnitude in bytes-on-the-wire, and in the field the network is usually the first thing to fail. Designing for sparse, prioritized, dropout-tolerant sharing is what separates deployable multi-robot SLAM (subterranean exploration, search and rescue, warehouse fleets) from simulation-only results.

## Related

- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Map merging](map-merging.md)
- [Swarm-SLAM](swarm-slam.md)
- [CCM-SLAM](ccm-slam.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)

---
[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
