# LiDAR

**LiDAR (Light Detection and Ranging)** is an active exteroceptive sensor: it emits laser pulses and times the returns, directly measuring range to surfaces. A scanning LiDAR outputs dense 3D point clouds at typically 10–20 Hz with excellent range accuracy (on the order of ±2 cm), and — because it brings its own illumination — it works in darkness and is largely insensitive to ambient lighting.

## What a LiDAR measurement contains

Each fired pulse returns a **range** along a known beam direction; range plus direction gives a 3D point in the sensor frame. A full sweep bundles these into a point cloud where each point typically carries:

- $(x, y, z)$ coordinates in the sensor frame,
- **intensity** (return strength — useful as a crude "texture" for matching and for detecting retroreflective surfaces),
- **ring/channel index** (which laser produced it — encodes the vertical structure of the scan),
- a **per-point timestamp** within the sweep (essential for de-skewing, below).

Two main hardware families:

- **Spinning (mechanical) LiDAR** — e.g., Velodyne HDL-64, Ouster OS1 — a rotating column of emitters sweeps 360° horizontally, producing rings of points. The classic choice for autonomous driving and mobile robots.
- **Solid-state LiDAR** — e.g., Livox sensors, dome-style units — no large moving parts, fixed (often irregular, non-repetitive) scan patterns with a limited field of view. Cheaper and more durable; their unusual scan patterns motivated new odometry algorithms.

## Motion distortion

A recurring theme unique to scanning sensors: at 10–20 Hz, one sweep takes on the order of 50–100 ms to acquire, and the platform moves meaningfully in that time. Points from the start and end of the sweep are therefore expressed in *different* sensor poses, and treating the scan as rigid smears the geometry. Every serious LiDAR pipeline **de-skews**: each point is re-projected using an interpolated pose for its individual timestamp, with the motion coming from an IMU or a constant-velocity model. This is one of the main reasons LiDAR pairs so naturally with an IMU.

## Camera vs. LiDAR

Compared with cameras, the trade-offs are sharp:

| | Camera | LiDAR |
|---|---|---|
| Depth | Indirect (triangulation) | Direct, metric |
| Lighting | Fails in darkness / HDR scenes | Independent of ambient light |
| Data | Dense texture, color, semantics | Sparse geometry, no color |
| Failure cases | Low texture, blur | Rain/fog/dust, geometrically degenerate scenes (long corridors, open fields) |
| Cost/weight/power | Low | Higher |

LiDAR's failure modes deserve emphasis because they are *geometric*, not photometric: a long featureless corridor or tunnel constrains the sensor in some directions and not others (scan matching slides freely along the corridor axis), open fields offer few structures to match, and rain, fog, dust, or glass produce spurious or missing returns. Degeneracy detection and handling is its own topic at Level 9.

## The LiDAR SLAM stack

LiDAR SLAM has its own algorithmic stack, developed in Level 9:

- **Scan matching** via ICP variants — point-to-point or point-to-plane alignment of consecutive scans (the 3D-3D correspondence machinery from this level).
- **Feature-based odometry** on edge and planar points — the LOAM lineage extracts sharp/flat points by local curvature and matches those instead of full clouds.
- **Map representations** — surfel maps (SuMa), voxel/TSDF maps, occupancy octrees.
- **Tightly-coupled LiDAR-inertial odometry** — LIO-SAM (factor graph), FAST-LIO2 (iterated Kalman filter), where the IMU handles de-skewing and fast dynamics.

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
