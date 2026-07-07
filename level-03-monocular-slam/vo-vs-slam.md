# VO vs SLAM

**Visual Odometry (VO)** estimates local, incremental camera motion from consecutive frames: match or track features frame-to-frame (or minimise photometric error, for direct methods), estimate the relative pose, and chain the estimates. VO has no notion of a global map and cannot perform loop closure — so drift accumulates unboundedly. Return to your starting point after a long loop and a pure VO trajectory will not close.

**Visual SLAM** extends VO with the machinery of global consistency:

- a **persistent global map** (landmarks/keyframes) that survives beyond the local sliding window, enabling re-observation of old landmarks;
- **place recognition** to detect loop closures — revisits of previously mapped areas;
- **global optimisation** (pose-graph optimisation or global bundle adjustment) that redistributes accumulated drift when a loop is detected;
- usually also **relocalization**: recovering the pose from the map after tracking failure.

A compact comparison:

| Aspect | VO | SLAM |
|---|---|---|
| Scope | Local (window of recent frames) | Global (whole trajectory + map) |
| Drift | Grows without bound | Corrected at loop closures |
| Map | None, or temporary local map | Persistent, reusable |
| Cost | Low, bounded | Higher; grows with map size |
| Failure recovery | Lost is lost | Relocalize against the map |

## What a VO pipeline actually does

Concretely, a feature-based VO iteration looks like this — worth internalising because it is also the tracking thread of every feature-based SLAM system:

1. **Detect/track** features in the new frame (FAST/ORB detection, or KLT tracking from the previous frame).
2. **Associate** with the previous frame(s): descriptor matching or tracked correspondences, pruned by RANSAC.
3. **Estimate relative pose**: essential matrix from 2D-2D matches (initialisation), or PnP against locally triangulated 3D points (steady state).
4. **Triangulate** new points from the estimated motion, to keep the local 3D structure alive.
5. **Locally refine**: a small bundle adjustment over the last few frames/keyframes (windowed BA).

Direct VO replaces steps 1-3 with photometric alignment: minimise pixel intensity error between frames over the pose (and per-pixel depths), skipping explicit correspondences. Either way, the output is a chain of relative poses — and every stage after step 3 exists to slow drift, not eliminate it.

The corresponding metrics: **RPE (relative pose error)** measures the error of pose increments over fixed distances/time offsets — drift rate, VO's honest score. **ATE (absolute trajectory error)** measures global position error after aligning the estimate to ground truth — dominated by whether loops were closed, SLAM's score. A system with excellent RPE and poor ATE is a good odometer without global consistency; the reverse suggests strong loop closure over a noisy front-end.

## The boundary is a spectrum

DSO and SVO are VO systems; LDSO is "DSO + loop closure", i.e. the same front-end promoted to SLAM. ORB-SLAM's tracking thread alone is essentially a VO system — the local mapping and loop closing threads are what make it SLAM. In VIO the same distinction appears as *odometry* (MSCKF, VINS front-end) versus *full SLAM with map reuse* (ORB-SLAM3, VINS-Mono with loop closure enabled).

Which one you need is an engineering decision. If only short-horizon ego-motion matters (e.g. feeding a controller, drone stabilisation), VO's bounded compute and simplicity win. If the robot revisits places, operates for long periods, or must localise in a prior map, you need SLAM — nothing else stops unbounded drift.

## Common pitfalls

- **Comparing ATE across categories**: judging a VO system by ATE on a loopy sequence (or a SLAM system by RPE alone) misreads what each is designed to do; check which metric and which alignment (6-DoF vs 7-DoF for monocular) a paper reports.
- **Assuming loop closure is free**: promoting VO to SLAM adds a place-recognition database, verification logic, global optimisation, and — critically — new failure modes (false loops). A robust VO can beat a fragile SLAM in practice.
- **Unbounded map growth**: "just keep everything" SLAM degrades over hours of operation; keyframe culling and map management are part of the SLAM contract, not optional extras.
- **Relocalization ≠ loop closure**: both use place recognition, but relocalization recovers *tracking* against the existing map, while loop closure adds *constraints* that deform the map; conflating them muddles system design discussions.

## Why it matters for SLAM

This distinction organises the entire field: nearly every system you will study is either a VO/odometry method, or a SLAM system built by wrapping map management, place recognition, and global optimisation around a VO core. Knowing which claims a paper makes (local accuracy vs global consistency) tells you which benchmarks matter — RPE for VO, ATE with loop closures for SLAM — and what its failure modes will be.

## Hands-on

- [MonoVO hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_05)

## Related

- [Visual Odometry](visual-odometry.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)
- [ORB-SLAM](orb-slam.md)
