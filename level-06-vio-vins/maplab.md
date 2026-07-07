# maplab
> Schneider 2018 · [Paper](https://arxiv.org/abs/1711.10250)

**One-line summary** — An open research framework for visual-inertial *mapping*: multi-session map merging, offline global optimization, and re-localization on top of a ROVIO-based online VIO front-end, treating the map as a persistent asset rather than a per-run byproduct.

## Problem
Most VIO systems produce a single-session local map that is discarded after each run. Practical deployment needs more:

1. persistent maps that survive across sessions,
2. re-localization into a previously built map ("localize against a prior map and obtain accurate and drift-free pose estimates," per the abstract),
3. merging of maps built by different robots or at different times,
4. offline global optimization that improves the whole map after collection.

As the paper observes, available solutions "either focus on a single session use-case, lack localization capabilities or an end-to-end pipeline" — and only a complete system combining state-of-the-art algorithms, scalable multi-session tools, and a usable interface can serve as a research platform.

## Key ideas
- **ROVIOLI online front-end.** The online component couples ROVIO (robocentric EKF with photometric patch tracking) with a visual localization module; it both creates visual-inertial maps and can "track a global drift-free pose within a localization map" (abstract), emitting keyframes and preintegrated IMU edges into the map database.
- **Posegraph map representation.** Vertices are keyframes with feature observations and binary descriptors (BRISK); edges are VIO/IMU constraints with full covariance, loop-closure edges, and localization edges anchoring a session to a reference map. The map is a first-class, storable, manipulable data structure — not solver internals.
- **Offline global optimization.** Full visual-inertial bundle adjustment over all sessions —
  $$\min_{\{\mathbf{T}_i\},\{\mathbf{l}_k\}} \sum \|\mathbf{r}_{\text{IMU}}\|^2_{\Sigma^{-1}} + \sum \rho\big(\|\mathbf{r}_{\text{reproj}}\|^2\big) + \sum \|\mathbf{r}_{\text{LC}}\|^2_{\Omega^{-1}}$$
  — dramatically reduces drift relative to the online estimate, making the point that online VIO output is a starting point, not the final map.
- **Multi-session and multi-robot merging.** Cross-session loop closures found via a shared vocabulary yield inter-map transforms; the merged posegraph is jointly optimized and duplicate landmarks are fused using co-visibility. The same machinery serves "many sessions, one robot" and "one session each, many robots."
- **A console of map-manipulation tools.** maplab is usable in two ways (abstract): as a ready-to-use VI mapping and localization system, and as "a collection of multi-session mapping tools that include map merging, visual-inertial batch optimization, and loop closure" for researchers.
- **Plugin architecture.** Dense reconstruction, semantic labeling, or learned descriptors can operate on the map data structure without touching the core — which is what made maplab a common substrate for other people's research.

## Results & impact
The paper presents the system architecture, five use-cases, and evaluations on public datasets, with source code released "for the benefit of the robotics research community" (abstract). The use-cases exercise the full map lifecycle: offline batch optimization improving on the online ROVIO estimate, multi-session and multi-robot map merging, and re-localization against previously built maps.

maplab became the first comprehensive open-source framework for the full lifecycle of visual-inertial maps, and its successor maplab 2.0 extended the design toward multi-robot and semantic mapping.

## Why it matters for SLAM
maplab was the first comprehensive open-source framework for the *lifecycle* of visual-inertial maps — build, optimize offline, re-localize, merge across sessions and robots — capabilities that previously existed only in proprietary AR/robotics stacks. It is the research analogue of persistent-anchor systems in deployed AR, and a precursor to collaborative SLAM frameworks; maplab 2.0 later extended it toward multi-robot and semantic mapping. Study it when your problem is "many sessions, one map" rather than "one run, low drift."

## Related
- [ROVIO](rovio.md) — the VIO front-end inside ROVIOLI.
- [maplab 2.0](../level-08-collaborative-slam/maplab-2-0.md) — the multi-robot successor.
- [CCM-SLAM](../level-08-collaborative-slam/ccm-slam.md) — contemporaneous centralized collaborative SLAM.
- [VINS-Fusion](vins-fusion.md) — a different route to map-scale consistency (GPS + pose graph).
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the retrieval component behind re-localization.
- [Map merging](../level-08-collaborative-slam/map-merging.md) — the general problem maplab's tooling solves.

[Back to Level 6](../README.md#level-6-vio--vins)
