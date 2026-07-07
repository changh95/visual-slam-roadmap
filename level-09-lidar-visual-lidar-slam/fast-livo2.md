# FAST-LIVO2

> Zheng 2024 · [Paper](https://arxiv.org/abs/2408.14035)

**One-line summary** — FAST-LIVO2 fuses IMU, LiDAR, and camera through an error-state iterated Kalman filter with a *sequential* update that resolves the dimension mismatch between heterogeneous LiDAR and image measurements, setting the bar for direct LVI odometry on onboard compute.

## Problem

A LiDAR scan contributes thousands of low-dimensional geometric residuals per update, while a camera frame contributes photometric residuals of a completely different structure and scale — stacking both into one Kalman update is awkward and expensive, and FAST-LIVO's straightforward stacking left accuracy on the table. FAST-LIVO2 re-architects the fusion so heterogeneous measurements are handled rigorously and efficiently enough for real-time, onboard robotic applications.

## Key ideas

- **Sequential ESIKF update**: rather than one giant stacked Jacobian, the error-state iterated Kalman filter applies the LiDAR update first and then the visual update on the intermediate state,

  $$\hat{\mathbf{x}}_1 = \hat{\mathbf{x}}_0 \oplus \mathbf{K}_L\,\mathbf{r}_L(\hat{\mathbf{x}}_0), \qquad \hat{\mathbf{x}}_2 = \hat{\mathbf{x}}_1 \oplus \mathbf{K}_V\,\mathbf{r}_V(\hat{\mathbf{x}}_1),$$

  which addresses the dimension mismatch between the heterogeneous LiDAR and image measurements while keeping both inside a single filter.
- **Direct in both modalities**: the LiDAR module registers raw points (no edge/plane extraction); the visual module minimizes direct photometric errors (no ORB/FAST corners), continuing the FAST-LIO2/FAST-LIVO lineage.
- **Single unified voxel map**: the LiDAR module constructs the geometric structure used to register new scans, and the visual module attaches image patches to the LiDAR points — one map serves both sensors.
- **Geometry-informed image alignment**: plane priors from the LiDAR points in the voxel map improve patch alignment (and the prior itself is refined); reference patches are updated dynamically after new images are aligned, so the visual anchor stays current.
- **Robustness machinery**: an on-demand raycast operation handles cases where too few map points are visible, and the camera **exposure time is estimated in real time** to absorb brightness fluctuations — attacking the classic weaknesses of photometric alignment.

## Results & impact

Beyond benchmark accuracy, the paper details three deployed applications: fully onboard UAV navigation (demonstrating the computational efficiency needed for real-time onboard use), airborne mapping (demonstrating mapping accuracy), and 3D model rendering — both mesh-based and NeRF-based — showing that the dense colorized maps are good enough to feed downstream rendering pipelines. Code, dataset, and the applications are open source on GitHub, and the system is widely treated as the strongest open-source direct LVI odometry available.

## Why it matters for SLAM

FAST-LIVO2 is widely regarded as the strongest open-source direct LVI odometry system — the culmination of the HKU MARS line (FAST-LIO2 → FAST-LIVO → FAST-LIVO2). Its sequential-update trick is a generally useful pattern for fusing sensors whose measurements differ wildly in dimension and rate, and its demonstrated UAV deployments show that direct triple fusion is production-ready at edge-compute budgets. If you are choosing a modern LVI system for a robot today, this is the default candidate to beat.

## Related

- [FAST-LIVO](fast-livo.md) — the predecessor whose fusion it makes rigorous
- [FAST-LIO2](fast-lio2.md) — the direct LiDAR-inertial core
- [R3LIVE++](r3livepp.md) — shares the photometric-calibration mindset
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the underlying principle
- [LVI-SAM](lvi-sam.md) — the factor-graph counterpart in the LVI design space
- [NeRF](../level-05-deep-learning/nerf.md) — one of the rendering pipelines its dense maps feed

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
