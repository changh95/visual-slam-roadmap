# RADAR

**RADAR** (Radio Detection and Ranging) emits radio waves — millimetre-wave (mmWave) in automotive sensors — and measures the reflections. For each detection it returns **range** and, thanks to the Doppler effect, **radial velocity**: how fast the target is moving towards or away from the sensor. That per-detection velocity is something neither cameras nor LiDAR provide directly.

Where RADAR sits among exteroceptive sensors:

| Property | RADAR | LiDAR | Camera |
|---|---|---|---|
| Rain / fog / dust / snow | Robust | Degrades | Degrades |
| Darkness | Works | Works | Fails (passive RGB) |
| Angular resolution | Low | High | High |
| Direct velocity measurement | Yes (Doppler) | No | No |
| Measurement density | Sparse, noisy | Dense | Dense |

The weaknesses shape how RADAR is used. Returns are sparse, cluttered with multipath reflections and ghost targets, and angular resolution is far below LiDAR — so a raw RADAR scan is a poor basis for detailed mapping. Instead, RADAR is almost always one input to **sensor fusion**: its range-Doppler detections are combined with wheel odometry, IMU, camera, or LiDAR data, classically through an **Extended Kalman Filter** (and increasingly through factor-graph back-ends). The Doppler velocities are particularly valuable — with enough detections of the static world, the sensor's own ego-velocity can be estimated from a single scan, and moving objects can be separated from the static background before mapping.

Modern **4D imaging RADARs** add elevation and much denser point clouds, and RADAR-only odometry/SLAM (both spinning and automotive RADAR) is an active research area, attractive exactly where cameras and LiDAR fail: fire smoke, dusty mines, heavy weather, and long highway ranges.

## Why it matters for SLAM

RADAR is the all-weather sensor: when perception must keep working in rain, fog, dust, or darkness, it is often the only exteroceptive sensor still returning useful data. For SLAM engineers in automotive and field robotics, that makes RADAR fusion — and understanding its unusual noise characteristics and Doppler measurements — an increasingly demanded skill.

## Related

- [LiDAR](lidar.md)
- [Sonar](sonar.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
