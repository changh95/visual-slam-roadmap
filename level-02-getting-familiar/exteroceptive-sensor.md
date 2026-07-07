# Exteroceptive sensor

Robotic sensors divide into two families. **Proprioceptive sensors** measure the robot's own internal state (wheel encoders, IMU). **Exteroceptive sensors** measure the *external environment* — they look outward. SLAM is fundamentally built on exteroceptive sensing, because building a map requires observing the world, and correcting drift requires re-observing it.

The two exteroceptive workhorses of SLAM:

**Camera.** Passive, cheap, light, power-efficient, and information-rich (texture, color, semantics). Variants trade off geometry for convenience:

- *Monocular* — simplest, but no metric scale.
- *Stereo* — two cameras with a known baseline $b$ give metric depth; with focal length $f$, depth is resolvable out to roughly $b \cdot f / d_{\min}$ (the range at which disparity drops to the smallest measurable value $d_{\min}$), and depth uncertainty grows quadratically with distance.
- *RGB-D* — active depth alongside color; dense but short-range and sunlight-sensitive.
- *Fisheye/omnidirectional* — very wide field of view, popular in automotive surround-view.
- *Event camera* — asynchronous per-pixel brightness changes at microsecond resolution; no motion blur, very high dynamic range.

Cameras' weaknesses are the flip side of their passivity: they fail in darkness, textureless scenes, and severe motion blur, and a single camera cannot observe scale.

**LiDAR.** Active: emits laser pulses and times the returns, producing 3D point clouds with centimeter-level range accuracy, largely independent of ambient lighting. The cost is price, weight, power, and data sparsity compared to images (no texture or color).

## Other exteroceptive modalities

- **RADAR** — millimeter-wave; measures range and, via the Doppler effect, radial velocity. Robust to rain, fog, and dust where both LiDAR and cameras degrade, at the price of much coarser angular resolution; increasingly used in automotive SLAM as a weather-proof complement.
- **Sonar / ultrasonic** — acoustic ranging; the primary exteroceptive sensor underwater (where light attenuates quickly) and a cheap short-range proximity sensor on ground robots.
- **GNSS/GPS** — measures position relative to satellites; exteroceptive in character and drift-free, but unavailable indoors and degraded in urban canyons, so in SLAM it appears as an optional absolute-position factor rather than a core sensor.

## The role in the estimation problem

The key property that separates exteroceptive from proprioceptive measurements in the SLAM problem: exteroceptive observations are **drift-correcting**. An IMU or wheel encoder can only be integrated forward, so its error grows without bound. A camera or LiDAR can recognize a previously seen landmark or place, creating a constraint back to an old pose — this is what makes loop closure, relocalization, and bounded-error mapping possible.

In the estimation framework, exteroceptive data feeds the *observation model*

$$
\mathbf{z} = h(\mathbf{x}, \mathbf{m}) + \mathbf{v},
$$

tying the robot state $\mathbf{x}$ to the map $\mathbf{m}$ — for a camera, $h$ projects 3D map points through the camera model to predicted pixel locations — while proprioceptive data feeds the *motion model*. Every "loop closure factor" and "reprojection factor" in a factor graph is an exteroceptive measurement doing its drift-correcting job.

Because the two families fail in complementary ways, practical systems fuse them: visual-inertial odometry (camera + IMU), LiDAR-inertial odometry, and full visual-LiDAR-inertial systems. Fusion requires accurate spatial and temporal calibration between the sensors.

## Choosing an exteroceptive sensor

A quick checklist that recurs in every system-design discussion:

- **Lighting and weather** — darkness rules out passive cameras; heavy rain/fog/dust pushes toward RADAR; direct sunlight harms many RGB-D sensors.
- **Required accuracy and range** — centimeter geometry at tens of meters says LiDAR; room-scale AR says camera (+IMU).
- **Platform budget** — weight, power, and cost ceilings on a drone or phone often decide before performance does.
- **Environment geometry/texture** — textureless corridors starve vision; long featureless tunnels and open fields starve LiDAR; the failure modes, not the average case, drive the choice.

## Why it matters for SLAM

Your choice of exteroceptive sensor dictates the entire SLAM architecture — feature-based vs. dense vs. point-cloud pipelines, the failure modes you must engineer around, and the cost/weight envelope of the product. Reading any SLAM paper starts with identifying its sensor assumptions, and the roadmap's later levels are literally organized by this choice (monocular, RGB-D, stereo, LiDAR fusion, event cameras).

## Related

- [Proprioceptive sensor](proprioceptive-sensor.md)
- [Camera device](camera-device.md)
- [LiDAR](lidar.md)
- [IMU](imu.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
