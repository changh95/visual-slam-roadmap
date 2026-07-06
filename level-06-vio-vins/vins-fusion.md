# VINS-Fusion

> Qin 2019 · [Paper](https://arxiv.org/abs/1901.03638)

**One-line summary** — VINS-Fusion generalizes VINS-Mono into an optimization-based multi-sensor odometry framework where every sensor (mono/stereo cameras, IMU, GPS) is treated as a general factor, enabling stereo and GPS-fused configurations for drift-free large-scale operation.

## Key ideas

- **Sensors as general factors**: each sensor contributes residual factors over shared state variables; factors are summed into one optimization problem. This single design supports stereo-only, mono+IMU, and stereo+IMU suites in the same codebase.
- **Stereo extension**: features observed in the right camera add reprojection constraints through the fixed, calibrated baseline, directly constraining metric scale — no reliance on IMU excitation for scale.
- **GPS / global sensor fusion**: low-rate, noisy global position measurements are fused in a global pose graph, with an online-estimated 4-DoF alignment (yaw + translation) between the local odometry frame and the global frame; this bounds long-term drift outdoors.
- **Asynchronous local + global architecture**: the sliding-window VIO runs at camera rate while global measurements are merged asynchronously in the pose graph, so odometry latency is unaffected by GPS delays.
- **Inherited VINS-Mono machinery**: KLT feature tracking, on-manifold IMU preintegration, sliding-window optimization with marginalization, and DBoW2 loop closure.

## Why it matters for SLAM

VINS-Fusion is one of the most widely deployed open-source odometry stacks in robotics: it took the academically successful VINS-Mono and made it practical for real vehicles by adding stereo scale observability and GPS drift correction. Its "everything is a factor" formulation became the template for local-plus-global fusion in autonomous driving and drone autonomy, and it remains a standard baseline for stereo-inertial estimation.

## Related

- [VINS-Mono](vins-mono.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
- [Tightly-coupled vs Loosely-coupled](tightly-coupled-vs-loosely-coupled.md)
- [LVI-SAM](../level-09-lidar-visual-lidar-slam/lvi-sam.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
