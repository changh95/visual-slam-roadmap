# maplab
> Schneider 2018 · [Paper](https://arxiv.org/abs/1711.10250)

**One-line summary** — An open research framework for visual-inertial *mapping*: multi-session map merging, offline global optimization, and re-localization on top of a ROVIO-based online VIO front-end, treating the map as a persistent asset rather than a per-run byproduct.

## Key ideas
- **ROVIOLI front-end**: the online component couples ROVIO (robocentric EKF with photometric patch tracking) with a visual localization module, emitting keyframes and preintegrated IMU edges into a map database.
- **Posegraph map representation**: vertices are keyframes with feature observations and descriptors; edges are VIO (IMU) constraints, loop closures, and localization edges anchoring a session to a reference map.
- **Offline global optimization**: full visual-inertial bundle adjustment over all sessions dramatically reduces drift relative to the online estimate — making the point that online VIO output is a starting point, not the final map.
- **Multi-session and multi-robot merging**: cross-session loop closures found via a shared vocabulary yield inter-map transforms; the merged posegraph is jointly optimized and duplicate landmarks are fused.
- **Plugin architecture**: dense reconstruction, semantic labeling, or learned descriptors can operate on the map data structure without touching the core, which made maplab a common research platform.

## Why it matters for SLAM
maplab was the first comprehensive open-source framework for the *lifecycle* of visual-inertial maps — build, optimize offline, re-localize, merge across sessions and robots — capabilities that previously existed only in proprietary AR/robotics stacks. It is the research analogue of persistent-anchor systems in deployed AR, and a precursor to collaborative SLAM frameworks; maplab 2.0 later extended it toward multi-robot and semantic mapping. Study it when your problem is "many sessions, one map" rather than "one run, low drift."

## Related
- [ROVIO](rovio.md) — the VIO front-end inside ROVIOLI.
- [maplab 2.0](../level-08-collaborative-slam/maplab-2-0.md) — the multi-robot successor.
- [CCM-SLAM](../level-08-collaborative-slam/ccm-slam.md) — contemporaneous centralized collaborative SLAM.
- [VINS-Fusion](vins-fusion.md) — a different route to map-scale consistency (GPS + pose graph).
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the retrieval component behind re-localization.

[Back to Level 6](../README.md#level-6-vio--vins)
