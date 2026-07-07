# Communication constraints

Multi-robot SLAM lives or dies by its communication budget. Real robot teams talk over bandwidth-limited, intermittent links — WiFi at the edge of range, ad-hoc mesh radios, or underground/underwater channels measured in kilobits per second. Transmitting raw sensor streams or dense maps is infeasible, so collaborative SLAM systems are designed around *what can be shared cheaply*.

## The cost hierarchy of shareable data

Roughly in increasing order of bytes-on-the-wire:

1. **Global place descriptor** for a keyframe (a bag-of-words vector or learned embedding) — the cheapest currency; enough to *detect* a possible encounter.
2. **Local features of one keyframe** (keypoints + descriptors) — enough to *verify* a candidate closure geometrically; orders of magnitude smaller than the image itself.
3. **Pose graph / sparse landmark subset** — enough to align and jointly optimize trajectories.
4. **Compressed submaps** (meshes, TSDF blocks, point-cloud segments) — the expensive tier, sent rarely, if at all.

Well-designed systems climb this ladder lazily: broadcast tier 1 continuously, send tier 2 only for promising matches, and reserve tiers 3-4 for confirmed merges.

## Design patterns

- **Sparse descriptors instead of images.** Robots exchange compact place-recognition signatures — bag-of-words vectors (DBoW2) or learned global descriptors (NetVLAD) — instead of megabytes of pixels. Full feature sets or raw images are sent only after a promising match, if at all (C2TAM already transmitted only keypoints + descriptors, never images).
- **Compact map representations.** Pose graphs and sparse landmark sets travel; dense meshes, TSDFs, or point clouds usually stay local, with at most compressed submaps or boundary information exchanged.
- **Incremental / deduplicated exchange.** Track what each neighbor already has and send only novel data (Swarm-SLAM's sparse descriptor exchange), rather than re-broadcasting whole databases.
- **Prioritization under budget.** When the link cannot carry every candidate loop closure, spend verification bandwidth on the most valuable ones — e.g., Swarm-SLAM scores candidates by similarity, uncertainty, and whether they connect disconnected subgraphs.
- **Tolerance to dropouts.** Connectivity is intermittent by assumption: clients buffer keyframes locally and upload retroactively after reconnecting (CCM-SLAM), and local odometry must continue unaffected when the network disappears.
- **Distributed optimization with small messages.** Decentralized pose-graph solvers are chosen partly because their per-iteration messages (a few poses or gradients between neighbors) are tiny compared to shipping full maps.

## Common pitfalls

- **Evaluating with a perfect network.** A system that assumes full, continuous connectivity in simulation will meet reality's first dropout as a crash; dropout handling must be a design assumption, not an afterthought.
- **Ignoring latency.** Even with enough bandwidth, corrections arrive late; clients must tolerate operating on a slightly stale map (C2TAM's asynchronous cached-map pattern) rather than blocking on the freshest one.
- **Broadcast storms at scale.** Naive all-to-all descriptor broadcasting grows quadratically with team size; deduplication and neighbor-aware exchange keep swarms viable.
- **Sending what cannot be verified.** Bandwidth spent shipping loop-closure candidates that fail geometric verification is pure waste — which is why candidate *prioritization* is a first-class problem in decentralized systems.

A useful mental model: the communication channel is another sensor-budget constraint, like CPU or battery. Every architectural feature of collaborative SLAM — centralized vs decentralized, descriptor choice, submap granularity, loop-closure prioritization — can be read as an answer to "what fits through the pipe?"

## Why it matters for SLAM

Algorithms that look identical on a benchmark differ by orders of magnitude in bytes-on-the-wire, and in the field the network is usually the first thing to fail. Designing for sparse, prioritized, dropout-tolerant sharing is what separates deployable multi-robot SLAM (subterranean exploration, search and rescue, warehouse fleets) from simulation-only results.

## Related

- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Map merging](map-merging.md)
- [Swarm-SLAM](swarm-slam.md)
- [CCM-SLAM](ccm-slam.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Inter-robot loop closure](inter-robot-loop-closure.md)

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
