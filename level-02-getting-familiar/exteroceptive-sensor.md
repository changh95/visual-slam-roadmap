# Exteroceptive sensor

Robotic sensors divide into two families. **Proprioceptive sensors** measure the robot's own internal state (wheel encoders, IMU). **Exteroceptive sensors** measure the *external environment* — they look outward. SLAM is fundamentally built on exteroceptive sensing, because building a map requires observing the world, and correcting drift requires re-observing it.

The two exteroceptive workhorses of SLAM:

**Camera.** Passive, cheap, light, power-efficient, and information-rich (texture, color, semantics). Variants trade off geometry for convenience:

- *Monocular* — simplest, but no metric scale.
- *Stereo* — two cameras with a known baseline give metric depth.
- *RGB-D* — active depth alongside color; dense but short-range and sunlight-sensitive.
- *Fisheye/omnidirectional* — very wide field of view, popular in automotive surround-view.
- *Event camera* — asynchronous per-pixel brightness changes at microsecond resolution; no motion blur, very high dynamic range.

Cameras' weaknesses are the flip side of their passivity: they fail in darkness, textureless scenes, and severe motion blur, and a single camera cannot observe scale.

**LiDAR.** Active: emits laser pulses and times the returns, producing 3D point clouds with centimeter-level range accuracy, largely independent of ambient lighting. The cost is price, weight, power, and data sparsity compared to images (no texture or color).

The key property that separates exteroceptive from proprioceptive measurements in the SLAM problem: exteroceptive observations are **drift-correcting**. An IMU or wheel encoder can only be integrated forward, so its error grows without bound. A camera or LiDAR can recognize a previously seen landmark or place, creating a constraint back to an old pose — this is what makes loop closure, relocalization, and bounded-error mapping possible. In the estimation framework, exteroceptive data feeds the *observation model* $\mathbf{z} = h(\mathbf{x}, \mathbf{m}) + \mathbf{v}$, tying the robot state $\mathbf{x}$ to the map $\mathbf{m}$, while proprioceptive data feeds the *motion model*.

Because the two families fail in complementary ways, practical systems fuse them: visual-inertial odometry (camera + IMU), LiDAR-inertial odometry, and full visual-LiDAR-inertial systems. Fusion requires accurate spatial and temporal calibration between the sensors.

## Why it matters for SLAM

Your choice of exteroceptive sensor dictates the entire SLAM architecture — feature-based vs. dense vs. point-cloud pipelines, the failure modes you must engineer around, and the cost/weight envelope of the product. Reading any SLAM paper starts with identifying its sensor assumptions, and the roadmap's later levels are literally organized by this choice (monocular, RGB-D, stereo, LiDAR fusion, event cameras).

## Related

- [Proprioceptive sensor](proprioceptive-sensor.md)
- [Camera device](camera-device.md)
- [LiDAR](lidar.md)
- [IMU](imu.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
