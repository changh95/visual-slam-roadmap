# maplab 2.0

> Cramariuc 2023 · [Paper](https://arxiv.org/abs/2212.00654)

**One-line summary** — maplab 2.0 is ETH Zurich's modular, open-source mapping platform that unifies multi-session and multi-robot visual-inertial mapping with support for additional sensor modalities and deep-learned modules.

## Problem

Integrating multiple sensor modalities and deep learning into SLAM are two of the most active directions in current research: multi-modality is a stepping stone toward robustness in challenging environments and toward interoperability of heterogeneous multi-robot systems with varying sensor setups. Existing frameworks (ORB-SLAM3, RTAB-Map, the original maplab) are tightly integrated around specific sensor configurations, so every new feature type or modality requires major engineering. maplab 2.0 provides a versatile open platform on which such modules can be developed, tested, and integrated into a *fully-fledged* SLAM system.

## Method & architecture

The system has three main components (the paper is architectural — its contribution is the framework, not new estimation equations):

- **Map structure.** A map is a collection of *missions* (one per continuous session), stored as a factor graph. Vertices are robot states (6-DoF pose, velocity, IMU biases) and landmarks (3D positions that can represent visual features, LiDAR keypoints, or semantic objects). Edges are IMU-preintegration constraints, relative 6-DoF pose constraints (odometry, or loop closures — optionally as switchable constraints the optimizer can disable if they conflict), and landmark observation errors; absolute 6-DoF constraints inject GPS or fiducial-marker measurements. Wheel odometry gets infinite covariance on unobservable axes (z, pitch, roll).
- **Landmarks and features.** The classic maplab visual pipeline remains (ORB detection with BRISK/FREAK descriptors, gyro-aided matching, triangulation; loop closure by 2D-3D descriptor matching + covisibility filtering + P3P-RANSAC). New in 2.0: any number of feature types can coexist in one map — floating-point descriptors (e.g. SuperPoint, SIFT) matched via FLANN, binary via inverted multi-index — and 3D-observed landmarks (RGB-D or LiDAR) whose positions are averaged instead of triangulated, with Euclidean-distance error terms and 3D-3D RANSAC loop closure.
- **Mapping node (per robot).** Odometry-agnostic: any external 6-DoF odometry initializes pose vertices (an IMU is no longer required). Raw images or point clouds attach to the map as resources for later modules. Maps are split into submaps and streamed to the server.
- **Mapping server (new).** Receives submaps at regular intervals, preprocesses each independently (local bundle adjustment, feature quality evaluation, intra-map loop closure) then concatenates them per robot, and continuously loop-closes across robots (visual and/or LiDAR) and globally optimizes the joint multi-robot map, which can be transmitted back to robots. This system was deployed in the DARPA Subterranean Challenge as part of the winning team CERBERUS's multi-robot mapping stack.
- **Offline console.** Batch optimization, multi-session map merging, keyframing/sparsification, LiDAR loop closure via ICP/G-ICP, Voxblox dense reconstruction, and a plugin system.
- **Semantic loop closure use case.** Objects detected with Mask R-CNN get NetVLAD descriptors on the masked instance, are tracked with Deep SORT, and become class-labeled 3D landmarks; candidate matches within a class are geometrically verified, covisible landmark clusters are aligned with Horn's method to build a 6-DoF loop-closure constraint with an estimated covariance.

## Results

- **HILTI SLAM Challenge 2021** (nine sequences, 52 min total): maplab 2.0 is comparable to the state of the art. Best configurations (e.g. FAST-LIO2 odometry with SuperPoint+BRISK features, or with LiDAR ICP constraints) reach per-sequence APE RMSE around 0.04–0.19 m — e.g. 0.04 m on Construction 1 and 0.07 m on Construction 2, where ORB-SLAM3 scores 1.55 m and 2.77 m. Three odometry sources are shown (ROVIO, OKVIS, FAST-LIO2); SuperPoint/SIFT descriptors are PCA-compressed from 256 to 32 floats; maplab is the only method using all five cameras for loop closure.
- **Large-scale multi-session mapping:** 23 handheld missions (five cameras + Ouster OS0-128), more than two hours of data over ~10 km with indoor-outdoor transitions; the first five maps built online via the mapping server, the rest merged in the console, with global visual loop closures and RTK-GPS absolute constraints.
- **EuRoC (server vs console):** running all 11 sequences as a simultaneous multi-robot experiment (ROVIO + BRISK) gives the same average APE RMSE of 0.043 m as sequential multi-session processing, but the parallelized server finishes in 3 min 27 s versus 35 min 56 s.
- **Modality demos:** SuperPoint+SuperGlue keypoints tracked directly on LiDAR intensity images map a HILTI sequence; the semantic object loop-closure module visibly removes accumulated drift on a custom RGB-inertial office dataset.

## Why it matters for SLAM

Real deployments rarely involve a single robot mapping once: maps must be built, extended, and maintained across days and across devices. maplab (1.0 and 2.0) is one of the few production-quality open frameworks built around this multi-session lifecycle, which makes it a natural backbone for centralized collaborative mapping — proven at SubT scale — and for benchmarking new modules against a complete system. Its plugin architecture has made it a common research vehicle for integrating learned features, new sensors, and semantic loop closure into visual-inertial mapping (`ethz-asl/maplab`).

## Related

- [maplab](../level-06-vio-vins/maplab.md) — the original visual-inertial mapping framework this extends
- [Kimera-Multi](kimera-multi.md) — the decentralized alternative philosophy
- [Map merging](map-merging.md) — the core operation behind multi-session and multi-robot fusion
- [Centralized vs Decentralized](centralized-vs-decentralized.md) — where server-based frameworks sit in the design space
- [NetVLAD](../level-05-deep-learning/netvlad.md) — learned place recognition of the kind maplab 2.0 plugs in
- [SuperPoint](../level-05-deep-learning/superpoint.md) — learned features demonstrated inside the framework
