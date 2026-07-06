# CoPeD

> Zhou 2024 · [Paper](https://arxiv.org/abs/2405.14731)

**One-line summary** — CoPeD is a comprehensive real-world multi-robot collaborative perception dataset built around air-ground robot teams, created to fill the evaluation gap that had kept collaborative perception research stuck in simulation.

## Key ideas

- Multi-robot collaborative perception means fusing **compressed, intermittent, limited, heterogeneous, and asynchronous** information across robots — challenges that single-robot datasets replayed with virtual agents cannot reproduce.
- The dataset pairs **aerial and ground robots** whose spatial viewpoints, mobility profiles, coverage ranges, and sensor modalities are deliberately complementary: the aerial platform covers large areas quickly from above, while the ground platform provides persistent close-range sensing.
- Provides **raw sensor inputs, pose estimation, and optional high-level perception annotations**, so the same sequences serve SLAM, place recognition, and scene-understanding research.
- Unlike datasets designed purely for SLAM, sequences are designed with a **diverse range and adequate overlap of sensor views**, which is exactly what inter-robot loop closure and collaborative perception algorithms need to be benchmarked fairly.
- Demonstrated qualitatively on multiple collaborative perception tasks, positioning it as a testbed for multi-modal, multi-robot scene understanding.

## Why it matters for SLAM

Collaborative SLAM papers have historically been evaluated on single-robot datasets artificially split among virtual agents, which hides the hard parts of real deployments: asynchronous sensing, heterogeneous platforms, and genuinely different viewpoints of the same place. CoPeD gives C-SLAM systems such as Kimera-Multi and Swarm-SLAM a realistic air-ground benchmark, much as EuRoC did for single-robot VIO. If you are building or evaluating inter-robot loop closure or map merging, this is a natural dataset to reach for.

## Related

- [Kimera-Multi](kimera-multi.md) — distributed metric-semantic C-SLAM system that this kind of dataset benchmarks
- [Swarm-SLAM](swarm-slam.md) — decentralized C-SLAM framework evaluated on multi-robot data
- [Inter-robot loop closure](inter-robot-loop-closure.md) — the capability that cross-robot view overlap is designed to test
- [Map merging](map-merging.md) — aligning air and ground submaps into one frame

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
