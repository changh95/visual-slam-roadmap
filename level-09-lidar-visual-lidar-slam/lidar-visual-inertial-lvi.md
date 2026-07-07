# LiDAR-Visual-Inertial (LVI)

LiDAR-Visual-Inertial (LVI) fusion combines three sensors — LiDAR point clouds, camera images, and IMU measurements — into a single state estimator. The motivation is complementarity: each modality covers the others' failure modes.

| Sensor | Strength | Typical failure mode |
|---|---|---|
| LiDAR | Direct metric depth, long range, lighting-invariant | Rain/fog/snow (beam scatter), geometrically degenerate scenes (long corridors, open fields) |
| Camera | Dense texture, cheap, rich appearance for place recognition | Darkness, overexposure, texture-less walls, scale ambiguity (monocular) |
| IMU | High-rate motion prediction, gravity direction, works everywhere | Drifts within seconds without external correction; bias must be estimated |

## What each sensor contributes

The IMU plays the same role it does in VIO: it propagates the state at high rate between exteroceptive measurements, de-skews the LiDAR sweep (each point in a spinning scan is captured at a slightly different pose), and bridges short outages of either camera or LiDAR. LiDAR anchors the metric scale and geometry of the map; the camera adds texture, extra constraints in LiDAR-degenerate geometry, and appearance-based loop closure.

Whatever the architecture, the estimator solves one joint problem over a shared state $\mathbf{X}$ (poses, velocities, IMU biases). In the optimization view this is

$$
\mathbf{X}^* = \arg\min_{\mathbf{X}} \; \sum \|\mathbf{r}^{\text{IMU}}\|^2_{\Sigma_I} + \sum \|\mathbf{r}^{\text{visual}}\|^2_{\Sigma_V} + \sum \|\mathbf{r}^{\text{LiDAR}}\|^2_{\Sigma_L} + \sum \|\mathbf{r}^{\text{loop}}\|^2_{\Sigma_{lp}},
$$

with LiDAR residuals typically point-to-plane distances and visual residuals either reprojection errors (feature-based) or photometric errors (direct). The filter view replaces the sum with iterated Kalman updates on an error state.

## The two dominant design families

- **Factor-graph, feature-based** — LVI-SAM couples a VINS-Mono-style visual-inertial subsystem with a LIO-SAM-style LiDAR-inertial subsystem in a shared factor graph. The subsystems aid each other explicitly: the LiDAR-inertial side hands the visual side a fast, reliable initialization and metric depth for its features; the visual side supplies initial guesses for scan-matching and rescues the LiDAR side in degenerate geometry. Loop closures are found visually and refined geometrically.
- **Filter-based, direct** — R3LIVE and FAST-LIVO/FAST-LIVO2 use an (error-state) iterated Kalman filter. LiDAR builds the geometric map by registering raw points; the camera contributes photometric residuals against that same map — no visual feature extraction at all. R3LIVE uses vision mainly to color and texture the map; FAST-LIVO feeds the photometric residuals back into pose estimation; FAST-LIVO2 handles the LiDAR/image dimension mismatch with a sequential update.

A useful mental map of the design space, since every LVI paper is a point in it:

| Axis | Options |
|---|---|
| Coupling | tight (raw residuals share one estimator) vs loose (poses fused after the fact) |
| Estimator | filter (ESIKF/iEKF) vs smoothing (factor graph, sliding window) |
| Visual frontend | feature-based (corners + descriptors) vs direct (photometric) |
| Map | separate per-modality maps vs one shared map |

## The robustness contract

A well-engineered LVI system should be *at least* as robust as its best single-modality subsystem in every environment: in a dark tunnel it degrades to LiDAR-inertial odometry, in a geometrically degenerate corridor it degrades to visual-inertial odometry, and in benign conditions the joint estimate is more accurate than either. This contract is not automatic — it requires explicit degradation detection and fallback (see the degradation-handling note), otherwise a failing sensor drags the fused estimate down with it.

## Common pitfalls

- **Calibration is now a three-body problem.** LiDAR-camera and LiDAR-IMU extrinsics, plus per-sensor time offsets, all enter the residuals; millimeter- and millisecond-level errors show up as unexplained bias, and tightly-coupled systems are *more* sensitive to this than loose ones.
- **Clock synchronization.** Three sensors on three clocks must be brought onto one timeline; hardware triggering or careful software sync is a prerequisite, not an afterthought.
- **Fusion does not always help.** With poor calibration or an undetected degraded sensor, the triple-fusion estimate can be worse than the best single-modality system — benchmark against your own subsystems, not just against other papers.
- **Compute budgeting.** LiDAR registration, image alignment, and high-rate IMU propagation compete for the same onboard CPU; the direct/filter family exists largely because feature pipelines did not fit on small platforms.

## Why it matters for SLAM

Triple fusion is the current best practice for robust outdoor and large-scale SLAM — autonomous driving, drone inspection, and handheld scanning stacks are almost all LVI (often plus GNSS). Understanding the LVI design space (tight vs loose coupling, filter vs factor graph, feature vs direct) lets you read essentially every modern fusion paper, since they are all points in this space.

## Related

- [LVI-SAM](lvi-sam.md) — canonical factor-graph LVI system
- [R3LIVE](r3live.md) — filter-based LVI with RGB-colored maps
- [FAST-LIVO](fast-livo.md) — fully direct LVI on a shared map
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — how the modalities are jointly optimized
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md) — how IMU data enters the optimization
- [Degradation handling](degradation-handling.md) — what enforces the robustness contract

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
