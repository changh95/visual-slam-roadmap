# Scale observability

A monocular camera measures only *bearings* (directions to points), so the absolute size of the reconstructed world is unobservable: scaling the whole scene and all translations by any factor produces exactly the same images. Stereo removes this ambiguity structurally. The known, calibrated baseline $B$ between the two cameras is a physical length placed inside every stereo measurement: through $Z = fB/d$, each matched keypoint yields a depth in meters. **Metric scale is observable from a single stereo frame**, with no motion, no IMU, and no scene assumptions.

## Why monocular scale is unobservable

Take any monocular reconstruction $\{\mathbf{X}_j, (\mathbf{R}_i, \mathbf{t}_i)\}$ and scale it by $s > 0$: points become $s\mathbf{X}_j$, translations become $s\mathbf{t}_i$ (rotations unchanged). Every projection is untouched, because the pinhole projection is invariant to scaling of homogeneous coordinates:

$$\pi\!\left(\mathbf{K}(\mathbf{R}_i\, s\mathbf{X}_j + s\mathbf{t}_i)\right) = \pi\!\left(s\,\mathbf{K}(\mathbf{R}_i \mathbf{X}_j + \mathbf{t}_i)\right) = \pi\!\left(\mathbf{K}(\mathbf{R}_i \mathbf{X}_j + \mathbf{t}_i)\right).$$

The measurement likelihood is *identical* for every $s$ — no amount of monocular data can distinguish a small world traversed slowly from a large world traversed quickly. Scale is a gauge freedom, exactly like the choice of global position and orientation.

## What makes scale observable

Scale becomes observable the moment any measurement carries a metric unit:

- **Stereo baseline** — a calibrated physical length inside every frame's measurement (this page's topic).
- **IMU accelerometer** — measures metric specific force; integrating it predicts metric displacement, so comparing that to the visual (up-to-scale) displacement reveals scale. But this needs *acceleration excitation*: under constant velocity or hover the accelerometer only sees gravity and scale becomes weakly observable again.
- **Depth cameras / LiDAR** — direct metric range measurements.
- **Wheel odometry** — metric translation between poses.
- **Scene priors** — known object sizes, known camera height above a ground plane (common in autonomous driving), fiducial markers of known dimensions.

## Consequences for the SLAM estimator

- **Instant initialization.** A stereo SLAM system can build a metric local map from its very first frame, whereas monocular SLAM needs a translating motion and still only recovers structure up to scale (and monocular VIO needs sufficient IMU excitation before scale converges — VI-DSO even keeps scale as an explicit optimization variable so it can start with an arbitrary value and converge later).
- **No scale drift.** Monocular odometry accumulates scale error over time (scale drift), which pose-graph methods must correct with $\mathrm{Sim}(3)$ (7-DoF) loop closures. Stereo constrains scale at every keyframe, so loop closure reduces to ordinary $\mathrm{SE}(3)$ (6-DoF) alignment.
- **Fewer unobservable directions in VIO.** In monocular VIO, scale becomes observable only through IMU accelerations; four directions (global position + yaw) remain unobservable. Stereo VIO gets scale directly from the baseline, keeping the estimator well-conditioned during low-excitation motion (hover, constant velocity) where monocular VIO scale is weakly observable.
- **Caveat — scale is only as good as your geometry.** The metric information decays with range ($\Delta Z \propto Z^2$), so at distances far beyond the baseline the system degrades gracefully toward monocular behavior. Baseline calibration errors also translate directly into a global scale bias.

## Common pitfalls

- **Assuming IMU = scale, always**: a drone hovering or a car cruising at constant speed provides almost no acceleration excitation; monocular VIO scale can drift or converge slowly in exactly these common regimes.
- **Far-field stereo is monocular**: on a highway, most of the scene may be beyond the reliable range of a roof-mounted rig; the estimator should not count those points as metric anchors.
- **Uncalibrated baseline changes**: thermal expansion or mechanical flex changes $B$; since $B$ multiplies every depth, this appears as a slow, global scale change that loop closure alone cannot explain.

A useful way to think about it: monocular SLAM estimates the world in "units of the first translation"; stereo SLAM estimates it in meters because the ruler (the baseline) is bolted to the robot.

## Why it matters for SLAM

Robots plan, control, and avoid obstacles in meters, so metric scale is non-negotiable for navigation. Understanding which sensor configurations make scale observable — stereo baseline, IMU accelerations, depth cameras, wheel odometry — explains many system design choices, from why autonomous cars use wide-baseline stereo to why AR headsets pair cameras with IMUs.

## Related

- [Disparity vs Depth](disparity-vs-depth.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
- [Observability](../level-06-vio-vins/observability.md)
- [Stereo DSO](stereo-dso.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)

[Back to Level 7](../README.md#level-7-stereo-slam)
