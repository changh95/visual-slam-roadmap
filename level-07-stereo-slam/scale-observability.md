# Scale observability

A monocular camera measures only *bearings* (directions to points), so the absolute size of the reconstructed world is unobservable: scaling the whole scene and all translations by any factor produces exactly the same images. Stereo removes this ambiguity structurally. The known, calibrated baseline $B$ between the two cameras is a physical length placed inside every stereo measurement: through $Z = fB/d$, each matched keypoint yields a depth in meters. **Metric scale is observable from a single stereo frame**, with no motion, no IMU, and no scene assumptions.

Consequences for the SLAM estimator:

- **Instant initialization.** A stereo SLAM system can build a metric local map from its very first frame, whereas monocular SLAM needs a translating motion and still only recovers structure up to scale (and monocular VIO needs sufficient IMU excitation before scale converges).
- **No scale drift.** Monocular odometry accumulates scale error over time (scale drift), which pose-graph methods must correct with $\mathrm{Sim}(3)$ (7-DoF) loop closures. Stereo constrains scale at every keyframe, so loop closure reduces to ordinary $\mathrm{SE}(3)$ (6-DoF) alignment.
- **Fewer unobservable directions in VIO.** In monocular VIO, scale becomes observable only through IMU accelerations; four directions (global position + yaw) remain unobservable. Stereo VIO gets scale directly from the baseline, keeping the estimator well-conditioned during low-excitation motion (hover, constant velocity) where monocular VIO scale is weakly observable.
- **Caveat — scale is only as good as your geometry.** The metric information decays with range ($\Delta Z \propto Z^2$), so at distances far beyond the baseline the system degrades gracefully toward monocular behavior. Baseline calibration errors also translate directly into a global scale bias.

A useful way to think about it: monocular SLAM estimates the world in "units of the first translation"; stereo SLAM estimates it in meters because the ruler (the baseline) is bolted to the robot.

## Why it matters for SLAM

Robots plan, control, and avoid obstacles in meters, so metric scale is non-negotiable for navigation. Understanding which sensor configurations make scale observable — stereo baseline, IMU accelerations, depth cameras, wheel odometry — explains many system design choices, from why autonomous cars use wide-baseline stereo to why AR headsets pair cameras with IMUs.

## Related

- [Disparity vs Depth](disparity-vs-depth.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
- [Observability](../level-06-vio-vins/observability.md)
- [Stereo DSO](stereo-dso.md)

---
[Back to Level 7](../README.md#level-7-stereo-slam)
