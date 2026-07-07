# DM-VIO
> von Stumberg 2022 · [Paper](https://arxiv.org/abs/2201.04114)

**One-line summary** — A direct (DSO-based) monocular VIO that introduces *delayed marginalization* and pose-graph-based IMU initialization, making photometric VIO match or beat feature-based systems on standard benchmarks.

## Problem
Marginalization is the standard trick for keeping sliding-window VIO real-time, "but it cannot easily be reversed, and linearization points of connected variables have to be fixed" (abstract). This frozen-prior problem is especially painful for direct methods, whose photometric Jacobians are far more sensitive to the linearization point than reprojection Jacobians.

A second, coupled problem is monocular IMU initialization: scale is initially unobservable, and prior initialization schemes could not capture the full photometric uncertainty, making bootstrap fragile under aggressive motion. DM-VIO attacks both with one mechanism.

## Key ideas
- **Direct photometric foundation.** DM-VIO performs photometric bundle adjustment in the DSO style: the cost is the brightness difference of sparse points warped between keyframes,
  $$E_{\text{photo}} = \sum_i \sum_{j} \sum_{\mathbf{p}} \omega_{\mathbf{p}} \left\| I_j\big[\pi(\mathbf{R}_{ji}\,\pi^{-1}(\mathbf{p}, d_i) + \mathbf{t}_{ji})\big] - e^{a_{ji}} I_i[\mathbf{p}] - b_{ji} \right\|_\gamma,$$
  with affine brightness parameters $(a_{ji}, b_{ji})$, photometric calibration, and — new in DM-VIO — a *dynamic weight* on the visual residuals.
- **IMU factors in the photometric window.** On-manifold preintegrated IMU residuals sit alongside photometric residuals in the sliding-window optimization, supplying metric scale, gravity alignment, and robustness under fast motion.
- **Delayed marginalization.** The system maintains a *second* factor graph in which marginalization is delayed: a keyframe leaving the main window is kept alive there before final Schur elimination. Because "this allows us to later readvance this delayed graph," DM-VIO can obtain "an updated marginalization prior with new and consistent linearization points" (abstract) — cutting the linearization error baked into the prior.
- **One mechanism, two uses.** The same delayed graph that fixes the prior also "enables us to inject IMU information into already marginalized states" (abstract) — which is precisely what the initialization procedure below exploits. Conceptually this is a pragmatic counterpart to Basalt's nonlinear factor recovery: instead of *replacing* the linearized prior, delay and rebuild it.
- **Pose graph bundle adjustment (PGBA) for IMU initialization.** Delayed marginalization also allows injecting IMU information into already-marginalized states; this enables an initialization that, "in contrast to prior works ... is able to capture the full photometric uncertainty, improving the scale estimation" (abstract).
- **Scale keeps improving after init.** To cope with initially unobservable scale, DM-VIO continues to optimize scale and gravity direction in the main system after IMU initialization completes, rather than committing to an early estimate.

## Results & impact
Evaluated on EuRoC, TUM-VI, and 4Seasons — flying drone, large-scale handheld, and automotive scenarios. Per the abstract, "our system exceeds the state of the art in visual-inertial odometry, even outperforming stereo-inertial methods while using only a single camera and IMU."

DM-VIO is the culmination of the TUM direct-method line (DSO → VI-DSO → DM-VIO) and re-established direct methods as fully competitive in tightly-coupled VIO.

## Why it matters for SLAM
DM-VIO closed the gap between direct and feature-based VIO: it demonstrated that a monocular photometric system with a well-designed marginalization and initialization strategy can compete with (and on hard sequences beat) feature-based stereo-inertial pipelines. It is the culmination of the TUM direct-method line (DSO → VI-DSO → DM-VIO) and the system to study for how marginalization consistency issues manifest — and are mitigated — in practice.

## Related
- [DSO](../level-03-monocular-slam/dso.md) — the direct sparse odometry core.
- [VI-DSO](vi-dso.md) — the earlier direct visual-inertial predecessor from the same group.
- [Basalt](basalt.md) — the alternative fix for marginalization linearization error.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the IMU factor formulation used.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — background on the mechanism being "delayed."
- [Observability](observability.md) — why monocular scale is initially unobservable and must be handled explicitly.

[Back to Level 6](../README.md#level-6-vio--vins)
