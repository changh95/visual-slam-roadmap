# Tightly-coupled vs Loosely-coupled

When fusing a camera and an IMU, the first architectural decision is *where* the fusion happens.

**Loosely-coupled** systems run separate estimators — a visual odometry pipeline producing camera poses and an inertial navigation pipeline integrating IMU measurements — and then fuse their *outputs* (poses, velocities) in a second stage, typically with a Kalman filter. Each subsystem treats the other as a black box.

**Tightly-coupled** systems put the *raw measurements* of both sensors into a single estimator: image feature observations (reprojection residuals) and IMU readings (preintegrated inertial residuals) are jointly optimized over one shared state containing poses, velocities, and IMU biases. Virtually all modern VIO systems — MSCKF, OKVIS, VINS-Mono, Kimera-VIO, Basalt — are tightly coupled.

| | Loosely-coupled | Tightly-coupled |
|---|---|---|
| Fusion level | Pose/velocity estimates | Raw measurements |
| Accuracy | Lower (information lost at the interface) | Higher (cross-correlations exploited) |
| Complexity | Low; subsystems reusable | High; joint state and Jacobians |
| Failure behavior | One subsystem can fail independently | Visual outliers can corrupt the joint state, but IMU also aids vision (e.g., feature prediction) |
| Bias estimation | IMU biases not observable from fused poses alone | Biases estimated jointly, constrained by vision |

The key argument for tight coupling: the cross-correlations between visual and inertial information are what make the system strong. Vision constrains IMU bias drift; the IMU constrains scale, roll, and pitch and predicts feature locations across frames for robust tracking under fast motion. A loosely-coupled interface throws these correlations away — once VO compresses images into a pose estimate, the information about *which* directions were well-constrained is mostly gone.

The price is engineering complexity: a tightly-coupled estimator needs consistent time synchronization, camera-IMU extrinsic calibration, and careful handling of the joint state (marginalization, initialization). Loosely-coupled designs survive in systems where modularity matters more than peak accuracy, or where an existing odometry source (wheel odometry, GNSS/INS) must be integrated quickly.

## Why it matters for SLAM
This distinction is the first question to ask about any VIO paper, and the same vocabulary reappears in every multi-sensor fusion context (LiDAR-visual-inertial, GNSS fusion). Understanding *why* tight coupling wins on accuracy — retained cross-sensor correlations — also explains why the field consistently moves toward joint estimation whenever compute allows.

## Related
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — the second key axis for classifying VIO systems.
- [MSCKF](msckf.md) — the classic tightly-coupled filter.
- [VINS-Mono](vins-mono.md) — the classic tightly-coupled optimizer.
- [IMU preintegration](imu-preintegration.md) — the tool that makes tightly-coupled optimization tractable.
- [Tightly-coupled LiDAR-camera](../level-09-lidar-visual-lidar-slam/tightly-coupled-lidar-camera.md) — the same concept applied to LiDAR fusion.

[Back to Level 6](../README.md#level-6-vio--vins)
