# FAST-LIVO2

> Zheng 2024 · [Paper](https://arxiv.org/abs/2408.14035)

**One-line summary** — FAST-LIVO2 fuses IMU, LiDAR, and camera through an error-state iterated Kalman filter with a *sequential* update that resolves the dimension mismatch between heterogeneous LiDAR and image measurements, setting the bar for direct LVI odometry on onboard compute.

## Key ideas

- **Sequential ESIKF update**: rather than stacking thousands of LiDAR residuals and image photometric residuals into one giant Jacobian, the filter applies the LiDAR update first and then the visual update on the intermediate state within the same iteration — efficient and principled handling of heterogeneous measurements.
- **Direct in both modalities**: the LiDAR module registers raw points (no edge/plane extraction); the visual module minimizes direct photometric errors (no ORB/FAST corners), continuing the FAST-LIO2/FAST-LIVO lineage.
- **Single unified voxel map**: LiDAR builds the geometric structure for registering new scans, and the visual module attaches image patches to the LiDAR points — one map serves both sensors.
- **Smarter image alignment**: plane priors from LiDAR points improve (and are refined during) patch alignment; reference patches are updated dynamically as new images arrive; an on-demand raycast handles points not currently in the map, and **exposure time is estimated in real time** for photometric robustness.
- **Demonstrated applications**: fully onboard UAV navigation (real-time on embedded compute), high-accuracy airborne mapping, and dense maps good enough for mesh- and NeRF-based rendering; code, datasets, and applications are open source.

## Why it matters for SLAM

FAST-LIVO2 is widely regarded as the strongest open-source direct LVI odometry system — the culmination of the HKU MARS line (FAST-LIO2 → FAST-LIVO → FAST-LIVO2). Its sequential-update trick is a generally useful pattern for fusing sensors whose measurements differ wildly in dimension and rate, and its demonstrated UAV deployments show that direct triple fusion is production-ready at edge-compute budgets. If you are choosing a modern LVI system for a robot today, this is the default candidate to beat.

## Related

- [FAST-LIVO](fast-livo.md) — the predecessor whose fusion it makes rigorous
- [FAST-LIO2](fast-lio2.md) — the direct LiDAR-inertial core
- [R3LIVE++](r3livepp.md) — shares the photometric-calibration mindset
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the underlying principle
- [LVI-SAM](lvi-sam.md) — the factor-graph counterpart in the LVI design space

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
