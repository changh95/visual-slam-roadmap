# LiDAR

**LiDAR (Light Detection and Ranging)** is an active exteroceptive sensor: it emits laser pulses and times the returns, directly measuring range to surfaces. A scanning LiDAR outputs dense 3D point clouds at typically 10–20 Hz with excellent range accuracy (on the order of ±2 cm), and — because it brings its own illumination — it works in darkness and is largely insensitive to ambient lighting.

Two main hardware families:

- **Spinning (mechanical) LiDAR** — e.g., Velodyne HDL-64, Ouster OS1 — a rotating column of emitters sweeps 360° horizontally, producing rings of points. The classic choice for autonomous driving and mobile robots.
- **Solid-state LiDAR** — e.g., Livox sensors, dome-style units — no large moving parts, fixed (often irregular, non-repetitive) scan patterns with a limited field of view. Cheaper and more durable; their unusual scan patterns motivated new odometry algorithms.

Compared with cameras, the trade-offs are sharp:

| | Camera | LiDAR |
|---|---|---|
| Depth | Indirect (triangulation) | Direct, metric |
| Lighting | Fails in darkness / HDR scenes | Independent of ambient light |
| Data | Dense texture, color, semantics | Sparse geometry, no color |
| Failure cases | Low texture, blur | Rain/fog/dust, geometrically degenerate scenes (long corridors, open fields) |
| Cost/weight/power | Low | Higher |

LiDAR SLAM has its own algorithmic stack, developed in Level 9: scan matching via ICP variants, feature-based odometry on edge/planar points (the LOAM lineage), surfel maps (SuMa), and tightly-coupled LiDAR-inertial odometry (LIO-SAM, FAST-LIO2). A recurring theme is **motion distortion**: the sensor moves while a sweep is being acquired, so points within one scan must be de-skewed using a motion estimate — one of the reasons LiDAR pairs naturally with an IMU.

Because camera and LiDAR failure modes are complementary — LiDAR gives geometry where vision has no texture; the camera gives texture and semantics where geometry is degenerate — the roadmap's arrow from this node points to **Visual-LiDAR fusion**: systems like LVI-SAM, R3LIVE, and FAST-LIVO fuse both (plus IMU) for robustness that neither sensor achieves alone.

## Why it matters for SLAM

LiDAR is the sensor of choice when metric accuracy and lighting robustness are non-negotiable — autonomous vehicles, surveying, industrial robots. For a visual-SLAM learner, understanding LiDAR matters twice over: it defines the strongest alternative paradigm to visual SLAM (useful for choosing sensors honestly), and it is half of the visual-LiDAR fusion systems that increasingly represent the state of the art in robust field robotics.

## Related

- [Exteroceptive sensor](exteroceptive-sensor.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [FAST-LIO2](../level-09-lidar-visual-lidar-slam/fast-lio2.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
