# CoPeD

> Zhou 2024 · [Paper](https://arxiv.org/abs/2405.14731)

**One-line summary** — CoPeD is a comprehensive real-world multi-robot collaborative perception dataset built around air-ground robot teams, created to fill the evaluation gap that had kept collaborative perception research stuck in simulation.

## Problem

In the past decade single-robot perception made significant advances, but multi-robot *collaborative* perception remained largely unexplored — and one major hurdle was the lack of real-world datasets. Collaborative perception requires fusing **compressed, intermittent, limited, heterogeneous, and asynchronous** environmental information across robots, under sensor noise, occlusions, and outright sensor failures. Existing datasets were predominantly designed for single-robot SLAM and, when replayed with virtual agents, do not exercise any of these conditions; CoPeD was built specifically to close this gap.

## Key ideas

- **Air-ground collaboration as the organizing principle**: the dataset leverages the untapped potential of aerial + ground robot teams with *distinct spatial viewpoints, complementary robot mobilities, coverage ranges, and sensor modalities* — the aerial platform covers large areas quickly from above, while the ground platform provides persistent close-range sensing.
- **Layered data products**: raw sensor inputs, pose estimation, and optional high-level perception annotation are all provided, so the same sequences serve SLAM, place recognition, detection, and scene-understanding research interests.
- **Designed overlap, not incidental overlap**: unlike SLAM-oriented datasets, sequences ensure a *diverse range and adequate overlap of sensor views* between robots — exactly the condition inter-robot loop closure and collaborative perception algorithms need to be benchmarked fairly.
- **Heterogeneity as a feature**: differing sensor suites and mobility profiles between the air and ground platforms force algorithms to confront the asynchronous, multi-modal fusion problem that homogeneous datasets hide.
- **Beyond geometry**: the authors position the dataset to unlock *high-level scene understanding through multi-modal collaborative perception* — perception tasks above pure localization and mapping.

## Results & impact

The paper demonstrates the dataset's value qualitatively through multiple collaborative perception tasks, rather than through a single benchmark number. Its contribution is infrastructural: it is one of the first comprehensive real-world multi-robot collaborative perception datasets, and it gives C-SLAM and collaborative perception systems a realistic air-ground testbed where previously only simulation or artificially split single-robot data existed.

## Why it matters for SLAM

Collaborative SLAM papers have historically been evaluated on single-robot datasets artificially split among virtual agents, which hides the hard parts of real deployments: asynchronous sensing, heterogeneous platforms, and genuinely different viewpoints of the same place. CoPeD gives C-SLAM systems such as Kimera-Multi and Swarm-SLAM a realistic air-ground benchmark, much as EuRoC did for single-robot VIO. If you are building or evaluating inter-robot loop closure or map merging, this is a natural dataset to reach for.

## Related

- [Kimera-Multi](kimera-multi.md) — distributed metric-semantic C-SLAM system that this kind of dataset benchmarks
- [Swarm-SLAM](swarm-slam.md) — decentralized C-SLAM framework evaluated on multi-robot data
- [Inter-robot loop closure](inter-robot-loop-closure.md) — the capability that cross-robot view overlap is designed to test
- [Map merging](map-merging.md) — aligning air and ground submaps into one frame
- [Communication constraints](communication-constraints.md) — the real-world condition (intermittent, limited links) the dataset embodies

[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
