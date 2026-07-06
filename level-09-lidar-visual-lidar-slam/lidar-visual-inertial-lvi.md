# LiDAR-Visual-Inertial (LVI)

LiDAR-Visual-Inertial (LVI) fusion combines three sensors — LiDAR point clouds, camera images, and IMU measurements — into a single state estimator. The motivation is complementarity: each modality covers the others' failure modes.

| Sensor | Strength | Typical failure mode |
|---|---|---|
| LiDAR | Direct metric depth, long range, lighting-invariant | Rain/fog/snow (beam scatter), geometrically degenerate scenes (long corridors, open fields) |
| Camera | Dense texture, cheap, rich appearance for place recognition | Darkness, overexposure, texture-less walls, scale ambiguity (monocular) |
| IMU | High-rate motion prediction, gravity direction, works everywhere | Drifts within seconds without external correction; bias must be estimated |

The IMU plays the same role it does in VIO: it propagates the state at high rate between exteroceptive measurements, de-skews the LiDAR sweep (each point in a spinning scan is captured at a slightly different pose), and bridges short outages of either camera or LiDAR. LiDAR anchors the metric scale and geometry of the map; the camera adds texture, more constraints in LiDAR-degenerate geometry, and appearance-based loop closure.

Two design families dominate:

- **Factor-graph, feature-based**: LVI-SAM couples a VINS-Mono-style visual-inertial subsystem with a LIO-SAM-style LiDAR-inertial subsystem in a shared factor graph. The subsystems help each other initialize and can each keep the system alive when the other fails.
- **Filter-based, direct**: R3LIVE and FAST-LIVO/FAST-LIVO2 use an (error-state) iterated Kalman filter. LiDAR builds the geometric map by registering raw points; the camera contributes photometric residuals against that same map — no visual feature extraction at all.

A well-engineered LVI system should be *at least* as robust as its best single-modality subsystem in every environment: in a dark tunnel it degrades to LiDAR-inertial odometry, in a geometrically degenerate corridor it degrades to visual-inertial odometry, and in benign conditions the joint estimate is more accurate than either.

## Why it matters for SLAM

Triple fusion is the current best practice for robust outdoor and large-scale SLAM — autonomous driving, drone inspection, and handheld scanning stacks are almost all LVI (often plus GNSS). Understanding the LVI design space (tight vs loose coupling, filter vs factor graph, feature vs direct) lets you read essentially every modern fusion paper, since they are all points in this space.

## Related

- [LVI-SAM](lvi-sam.md) — canonical factor-graph LVI system
- [R3LIVE](r3live.md) — filter-based LVI with RGB-colored maps
- [FAST-LIVO](fast-livo.md) — fully direct LVI on a shared map
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — how the modalities are jointly optimized
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — how IMU data enters the optimization

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
