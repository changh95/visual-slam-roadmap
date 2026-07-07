# maplab

> Schneider 2018 · [Paper](https://arxiv.org/abs/1711.10250)

**One-line summary** — An open research framework for visual-inertial *mapping*: multi-session map merging, offline batch optimization, and drift-free re-localization built around ROVIOLI (ROVIO with Localization Integration), treating the map as a persistent, manipulable asset rather than a per-run byproduct.

## Problem

Most VIO systems produce a single-session local map that is discarded after each run. Practical deployment needs persistent maps, re-localization against a prior map for drift-free global pose estimates, merging of maps built by different robots or at different times, and offline optimization that improves the whole map after collection. As the paper observes, available solutions "either focus on a single session use-case, lack localization capabilities or an end-to-end pipeline" — only a complete system combining state-of-the-art algorithms, scalable multi-session tools, and a flexible user interface can become an efficient research platform.

## Method & architecture

maplab has two major parts: the **online frontend ROVIOLI** and the **offline maplab console**.

**ROVIOLI** wraps the ROVIO filter with localization and map building. Its modules: *Feature Tracking* detects and tracks BRISK or FREAK keypoints, matching descriptors frame-to-frame inside a window predicted from integrated gyroscope measurements; in LOC mode, *Frame Localization* establishes 2d-3d matches against a provided localization map and computes a global pose $\mathbf{T}_{GI_k}$ with P3P inside RANSAC; these raw global poses are fed into ROVIO and fused with odometry constraints to estimate the global-to-mission transform $\mathbf{T}_{GM}$ alongside the local pose $\mathbf{T}_{MI}$; the *Map Builder* synchronizes all outputs into a VI-map. Two modes: VIO (build a map on drifting local estimates) and LOC (additionally track a drift-free global pose).

**VI-map structure.** A map contains multiple *missions* (one per session). Each mission is a graph: vertices hold a state estimate (pose $\mathbf{T}_{MI_k}$, IMU biases, velocity) plus keypoints, binary descriptors and tracking info; edges (most commonly IMU edges) hold the inertial measurements between vertices. Landmarks are triangulated from multi-vertex observations and stored in their first observing vertex. Each mission is anchored in the global frame by a single transform $\mathbf{T}_{GM_i}$ — so aligning whole sessions requires touching one transform, not every vertex. Poses obey the standard convention

$$\begin{bmatrix} {}_{A}\mathbf{p} \\ 1 \end{bmatrix} = \mathbf{T}_{AB} \begin{bmatrix} {}_{B}\mathbf{p} \\ 1 \end{bmatrix} = \begin{bmatrix} \mathbf{R}_{AB} & {}_{A}\mathbf{p}_{AB} \\ \mathbf{0} & 1 \end{bmatrix} \begin{bmatrix} {}_{B}\mathbf{p} \\ 1 \end{bmatrix}$$

Maps serialize to Protobuf; large resources (images, dense reconstructions) live in a separate cached resource system.

**Console algorithms** (all plugin-extensible, Ceres-based): *VIWLS* — visual-inertial weighted least-squares batch optimization with cost terms similar to OKVIS, optionally including wheel odometry or GPS priors; *loop closure/localization* — inverted multi-index retrieval on projected binary descriptors; *pose-graph relaxation* with optional Cauchy loss against false loop closures; *map sparsification* — ILP-based landmark selection and keyframing; *dense reconstruction* — stereo block matching, voxblox TSDF fusion, CMVS/PMVS2 export. The multi-session workflow is literally a console script: load and merge maps, keyframe (`kfh`), optimize (`optvi`), anchor missions, `relax`, `lc`, `optvi`.

## Results

On EuRoC (localization map from MH2, evaluated on MH1): position RMSE 0.178 m for plain ROVIO, 0.082 m for ROVIOLI localizing against the prior map, 0.036 m after full VIWLS batch optimization; ORB-SLAM2 (stereo) achieves 0.084 m in batch mode but 0.464 m / 13.34° in real-time mode. On V2-easy with a V2-medium localization map: 0.064 → 0.057 → 0.027 m (ORB-SLAM2 real-time diverged). Timing on an Intel Xeon E3-1505M: ROVIOLI processes a frame in 44 ms at 105% CPU load vs 63 ms / 162% for ORB-SLAM2. Multi-session use-case: 4 sessions of a university building (over 1,000 m, ~463,000 landmarks) merge into a consistent 8.2 MB localization map. Map maintenance: keyframing plus ILP summarization shrinks a map 13× while recall drops only from 60% to 51%. Large-scale demo: 45 Google Tango sessions of Zurich's old town — 231 min, 16.48 km of trajectory, 435k landmarks with 7.3M observations, 480 MB — aligned and optimized overnight on a 32 GB desktop.

## Why it matters for SLAM

maplab was the first comprehensive open-source framework for the *lifecycle* of visual-inertial maps — build, optimize offline, re-localize, merge across sessions and robots — capabilities that previously existed only in proprietary AR/robotics stacks. Field-tested on MAVs, planes, cars, underwater vehicles, and walking robots, it became a common substrate for research in map summarization, localization, and decentralized mapping; maplab 2.0 extended it toward multi-robot and semantic mapping. Study it when your problem is "many sessions, one map" rather than "one run, low drift."

## Related

- [ROVIO](rovio.md) — the VIO filter inside ROVIOLI.
- [maplab 2.0](../level-08-collaborative-slam/maplab-2-0.md) — the multi-robot successor.
- [CCM-SLAM](../level-08-collaborative-slam/ccm-slam.md) — contemporaneous centralized collaborative SLAM.
- [VINS-Fusion](vins-fusion.md) — a different route to map-scale consistency (global pose graph).
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the retrieval component behind re-localization.
- [Map merging](../level-08-collaborative-slam/map-merging.md) — the general problem maplab's tooling solves.
