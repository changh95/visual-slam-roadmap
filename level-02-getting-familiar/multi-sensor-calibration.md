# Multi-sensor calibration

Modern SLAM systems rarely rely on a single sensor. A camera-IMU rig, a camera-LiDAR car, or a full camera-IMU-LiDAR-wheel platform only works if you know, precisely, how the sensors are related to each other. Multi-sensor calibration estimates two things:

- **Extrinsic calibration**: the rigid-body transformation $T_{AB} \in SE(3)$ between the frames of sensor A and sensor B (e.g. where the camera sits relative to the IMU).
- **Temporal calibration**: the time offset between sensor clocks. Sensors timestamp their data with different latencies, and even a few milliseconds of offset is fatal for a fast-moving platform.

The most common pairings and tools:

| Pairing | Typical approach | Tool |
|---|---|---|
| Camera-IMU | Continuous-time B-spline trajectory jointly fit to image and inertial data; estimates extrinsics, time offset, and IMU noise/bias parameters | [Kalibr](https://github.com/ethz-asl/kalibr) (Furgale et al., 2013) |
| Camera-LiDAR | Target-based (checkerboard corners visible to both sensors) or targetless (align planar surfaces / edges between image and point cloud) | Autoware calibration tools, and many research toolkits |
| Multi-camera | Overlapping views of a calibration target (AprilGrid/checkerboard) | Kalibr multi-cam |

A few practical notes. Camera-IMU calibration needs *excitation*: you must rotate and translate the rig aggressively on all axes so that the extrinsics and time offset become observable. Camera-LiDAR calibration is harder because the two sensors do not observe the same primitive directly — a LiDAR sees geometry, a camera sees appearance — so methods align shared structure such as planes, edges, or reflective targets. Finally, calibration is not a one-time event: mounts flex, temperatures change, and good VIO/SLAM systems (e.g. VINS-Mono, OpenVINS) refine extrinsics and time offset online.

## Why it matters for SLAM

Every sensor-fusion SLAM formulation — VIO, LiDAR-visual-inertial odometry, RADAR fusion — assumes measurements can be expressed in a common frame at a common time. Errors in extrinsics or time offset show up as systematic, unmodelled residuals that the optimizer tries to absorb into poses and biases, producing drift and inconsistency that no amount of tuning fixes. Getting calibration right (and knowing how to verify it) is usually the first step of any real-world SLAM deployment.

## Related

- [Camera calibration](../level-01-beginner/camera-calibration.md)
- [IMU](imu.md)
- [LiDAR](lidar.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
