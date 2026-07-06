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

The boundary is a spectrum rather than a wall. DSO and SVO are VO systems; LDSO is "DSO + loop closure", i.e. the same front-end promoted to SLAM. ORB-SLAM's tracking thread alone is essentially a VO system — the local mapping and loop closing threads are what make it SLAM. In VIO the same distinction appears as *odometry* (MSCKF, VINS front-end) versus *full SLAM with map reuse* (ORB-SLAM3, VINS-Mono with loop closure enabled).

Which one you need is an engineering decision. If only short-horizon ego-motion matters (e.g. feeding a controller, drone stabilisation), VO's bounded compute and simplicity win. If the robot revisits places, operates for long periods, or must localise in a prior map, you need SLAM — nothing else stops unbounded drift.

## Why it matters for SLAM

This distinction organises the entire field: nearly every system you will study is either a VO/odometry method, or a SLAM system built by wrapping map management, place recognition, and global optimisation around a VO core. Knowing which claims a paper makes (local accuracy vs global consistency) tells you which benchmarks matter — RPE for VO, ATE with loop closures for SLAM — and what its failure modes will be.

## Related

- [Visual Odometry](visual-odometry.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)
- [ORB-SLAM](orb-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
