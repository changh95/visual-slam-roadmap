# DM-VIO
> von Stumberg 2022 · [Paper](https://arxiv.org/abs/2201.04114)

**One-line summary** — A direct (DSO-based) monocular VIO that introduces *delayed marginalization* and pose-graph-based IMU initialization, making photometric VIO match or beat feature-based systems on standard benchmarks.

## Key ideas
- **Direct photometric foundation**: builds on DSO's sparse photometric bundle adjustment — no feature descriptors; the cost is the brightness difference of sparse points warped between keyframes, with affine brightness correction and photometric calibration.
- **IMU factors in the photometric window**: on-manifold preintegrated IMU residuals are added alongside photometric residuals in the sliding-window optimization, giving metric scale and robustness under fast motion.
- **Delayed marginalization**: rather than eliminating a keyframe the moment it leaves the window, it is kept alive in a secondary "delayed" factor graph for a while before final Schur elimination. Linearization points can keep improving in the meantime, cutting the linearization error baked into the marginalization prior — a pragmatic counterpart to Basalt's nonlinear factor recovery, and especially important for direct methods whose photometric Jacobians are highly sensitive to the linearization point.
- **Pose-graph IMU initialization**: a separate IMU-only pose graph robustly estimates initial velocity, gravity direction, and gyroscope bias, and scale can keep being refined after initialization — more robust than SfM-style bootstrap under aggressive motion.

## Why it matters for SLAM
DM-VIO closed the gap between direct and feature-based VIO: it demonstrated that a monocular photometric system with a well-designed marginalization and initialization strategy can compete with (and on hard sequences beat) feature-based stereo-inertial pipelines. It is the culmination of the TUM direct-method line (DSO → VI-DSO → DM-VIO) and the system to study for how marginalization consistency issues manifest — and are mitigated — in practice.

## Related
- [DSO](../level-03-monocular-slam/dso.md) — the direct sparse odometry core.
- [VI-DSO](vi-dso.md) — the earlier direct visual-inertial predecessor from the same group.
- [Basalt](basalt.md) — the alternative fix for marginalization linearization error.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the IMU factor formulation used.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — background on the mechanism being "delayed."

[Back to Level 6](../README.md#level-6-vio--vins)
