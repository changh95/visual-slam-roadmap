# RTAB-Map

> Labbé 2019 · [Paper](https://doi.org/10.1002/rob.21831)

**One-line summary** — A memory-managed, multi-sensor open-source SLAM library supporting RGB-D, stereo, and LiDAR, whose bounded-time loop closure detection enables large-scale, long-term, and multi-session operation.

## Problem

Long-duration SLAM accumulates an ever-growing map, and loop-closure retrieval that scans all stored locations grows with it — eventually violating real-time constraints. For robots operating over hours, days, or multiple sessions, loop closure must run in bounded time regardless of exploration duration. Separately, real-world robots carry diverse sensor suites (stereo outdoors, RGB-D indoors, 2D/3D LiDAR, wheel odometry), yet most research systems supported exactly one configuration and were benchmarked on camera-only or LiDAR-only datasets, making visual-vs-LiDAR comparisons — let alone deployment — difficult.

## Method & architecture

RTAB-Map is a graph-based SLAM node that treats odometry as an external, replaceable input. The map is a graph: each node stores an odometry pose, compressed raw sensor data, visual words, and a local occupancy grid, created at a fixed detection rate; links (neighbor, loop-closure, proximity) carry rigid transformations that constrain graph optimization.

- **Pluggable odometry front-ends**: built-in visual odometry runs Frame-To-Frame (F2F) or Frame-To-Map (F2M): GFTT features (BRIEF descriptors, nearest-neighbor-distance-ratio matching for F2M, optical flow for F2F), constant-velocity motion prediction to restrict the search window, PnP RANSAC motion estimation, then local bundle adjustment; LiDAR odometry runs Scan-To-Scan or Scan-To-Map ICP via libpointmatcher (point-to-point or point-to-plane). External sources (wheel, VIO, ORB-SLAM2's tracker, LOAM) plug in the same way, and multiple residuals can be fused into one estimate (book formulation):
  $$\mathbf{T}_{k}^{k+1} = \arg\min_{\mathbf{T}} \sum_{s \in \mathcal{S}} w_s \left\| \mathbf{e}_s(\mathbf{T}) \right\|^2_{\boldsymbol{\Sigma}_s}$$
- **STM → WM → LTM memory management**: new nodes enter a Short-Term Memory buffer, then a fixed-size Working Memory (WM); only WM participates in loop-closure retrieval, so detection cost is $O(|\text{WM}|) = O(1)$ regardless of total map size. A rehearsal mechanism weights nodes (visually similar consecutive nodes increment a node's weight); when the update time exceeds a fixed threshold, the oldest lowest-weight WM nodes are transferred to Long-Term Memory, and a loop closure retrieves a location's graph neighborhood back from LTM into WM.
- **Bayesian appearance-based loop closure**: features are quantized into an incremental bag-of-words vocabulary; tf-idf likelihoods update a Bayes filter estimating whether the current node revisits a WM location or a new place. When the hypothesis passes a threshold, the transform is computed with the same PnP motion estimation as visual odometry and refined by ICP when a scan is available.
- **Proximity detection**: nodes close in the graph (bounded search depth, so complexity stays bounded) are matched by ICP scan registration — this localizes when traversing a corridor backwards, where the camera cannot close the loop.
- **Graph optimization with loop rejection**: TORO, g2o, or GTSAM (default) optimize the pose graph; if an optimized link's transform changes by more than a set factor of its translational variance, the new loop/proximity links are rejected — guarding against false-positive place recognition.
- **Practical outputs & multi-session**: OctoMap, 2D occupancy grid, and point-cloud outputs are assembled directly for ROS navigation stacks; on startup a new session begins its own map, and a loop closure to a past session computes the inter-map transform, merging graphs.

## Results

The Journal of Field Robotics paper evaluates RTAB-Map's visual and LiDAR configurations on KITTI, TUM RGB-D, EuRoC, and the MIT Stata Center PR2 dataset. On KITTI (ATE, single CPU core): LiDAR S2S achieves 1.0 m on sequence 00 at 62 ms/frame average odometry time; stereo F2M 1.0 m at 82 ms; ORB-SLAM2-based odometry inside RTAB-Map is the most accurate visual variant (best ATE on 9 of 11 sequences, best translational error on 10 of 11) but exceeds 100 ms per frame on one core. The highway sequence 01 exposes a modality trade-off: LiDAR odometry drifts badly (24.0 m S2S, poor pitch from geometry-sparse scans) where stereo F2M reaches 4.7 m using distant visual features. On the KITTI odometry leaderboard, RTAB-Map (F2M, stereo) scores 1.26 % translation / 0.0026 deg/m rotation — close to ORB-SLAM2 (1.15 % / 0.0027) and LSD-SLAM (1.20 % / 0.0033), with LOAM at 0.61 %. The original IROS 2014 memory-management paper showed constant loop-closure processing time — under 700 ms per frame — even on maps with thousands of locations, and the JFR version demonstrates multi-session mapping and memory management keeping online operation real-time as maps grow (see paper for the full computation-performance study).

## Why it matters for SLAM

RTAB-Map is one of the most widely deployed SLAM systems in practical robotics: its combination of bounded-time loop closure, support for virtually every common sensor configuration, and turnkey ROS integration lets non-specialists get reliable mapping running with minimal configuration. It is the go-to baseline when you need a robust, full-featured SLAM stack on a real robot rather than a research prototype, and its memory-management design remains the reference approach for long-term SLAM scalability.

## Related

- [RGBD-SLAM-V2](rgbd-slam-v2.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — the same false-loop problem RTAB-Map's rejection test addresses
