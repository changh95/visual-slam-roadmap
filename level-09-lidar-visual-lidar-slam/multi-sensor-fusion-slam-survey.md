# Multi-Sensor Fusion SLAM Survey

> Zhu 2024 · [Paper](https://www.sciopen.com/article/10.26599/TST.2023.9010010)

**One-line summary** — A comprehensive survey of SLAM systems that fuse camera, LiDAR, and IMU, organizing the rapidly growing multi-sensor fusion literature into a coherent taxonomy of architectures and fusion strategies.

## Key ideas

- Surveys the **camera + LiDAR + IMU fusion** landscape as a whole, rather than any single system — useful as a map of the territory once you know the individual landmark systems.
- The literature organizes naturally along a few axes that the survey works through: **which sensors are fused** (LiDAR-inertial, visual-inertial, LiDAR-visual, full LVI), **coupling depth** (loosely vs tightly coupled), and **estimator type** (filter-based, e.g., iterated/error-state Kalman filters, vs optimization-based, e.g., factor graphs and sliding-window smoothing).
- Motivates fusion through **complementary failure modes**: cameras degrade in darkness and low texture, LiDAR in adverse weather and degenerate geometry, IMU drifts alone — themes elaborated across the systems in this level.
- Serves as a structured entry point to the primary literature: LOAM-derived feature pipelines, direct methods (FAST-LIO2 lineage), factor-graph systems (LIO-SAM, LVI-SAM), and colorized/radiance mapping systems (R3LIVE family).

## Why it matters for SLAM

After reading the individual papers in this level, a survey like this is how you consolidate: it places each system in a common taxonomy, summarizes the trade-offs (accuracy vs compute, robustness vs complexity), and collects datasets and evaluation practices in one place. It is also a practical shortcut when selecting a fusion architecture for a new platform — the design axes it lays out (sensor set, coupling, estimator) are exactly the decisions you must make.

## Related

- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the core fusion concept the survey covers
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — the key architectural axis
- [LVI-SAM](lvi-sam.md) — representative optimization-based LVI system
- [FAST-LIVO2](fast-livo2.md) — representative filter-based direct LVI system
- [Degradation handling](degradation-handling.md) — the robustness motivation behind fusion

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
