# Observability

A state (or direction in state space) is **observable** if the available measurements constrain it; unobservable directions can drift freely without changing any measurement. Knowing exactly which directions are unobservable in VIO is essential for building consistent estimators.

**The 4 unobservable DoF of VIO.** A visual-inertial system measures bearing angles to landmarks (camera) and specific force plus angular rate (IMU). Gravity gives an absolute reference for roll and pitch, and the accelerometer makes metric scale observable under generic motion. What remains unobservable:

- **3-DoF global translation** — shifting the entire trajectory and map together changes no measurement.
- **1-DoF global yaw** — rotating everything about the gravity direction is also invisible.

So monocular VIO has exactly 4 unobservable DoF (compare pure monocular vision: 7 — translation, rotation, and scale). Stereo VIO has the same 4: the baseline adds a second scale source but global position and yaw remain free.

**Motion-dependent degeneracies.** Some states are only observable under sufficiently exciting motion:

- Under **constant acceleration** (including hovering and uniform velocity), metric scale becomes additionally unobservable — the accelerometer reading cannot be separated into scale and acceleration. This is why VIO on constant-velocity ground vehicles and gentle drone hovers degrades, and why initialization procedures demand dynamic motion.
- Pure rotation or zero rotation similarly weakens the observability of accelerometer bias and extrinsic calibration states.

**Consistency and First-Estimate Jacobians (FEJ).** An EKF that linearizes measurements at different estimates over time can *spuriously* gain information along the unobservable directions — the linearized system has fewer unobservable DoF than the true one. The filter then becomes overconfident (inconsistent), most visibly in yaw. The FEJ remedy fixes the linearization point of each state at its first estimate so the linearized system preserves the correct unobservable subspace; this is standard in OpenVINS and modern MSCKF variants, and the same idea underlies FEJ handling of marginalization priors in sliding-window optimizers.

Practical consequences: estimators should hold gauge freedom explicitly (fix the first pose and yaw, or use a prior), loop-closure corrections in VIO pose graphs are 4-DoF (yaw + translation, as in VINS-Mono), and system evaluations align trajectories with a 4-DoF transform rather than a full 6/7-DoF one.

## Why it matters for SLAM
Observability analysis explains behaviors that otherwise look like bugs: yaw drift that never stops, scale drift on highway driving, overconfident covariances after long runs. It dictates the design of initialization (needs excitation), loop closure (4-DoF), and filter consistency machinery (FEJ). Reading a VIO paper starts with asking: which states does this system treat as observable, and under what motion?

## Related
- [MSCKF](msckf.md) — the filter whose follow-up literature developed VIO observability analysis.
- [OpenVINS](openvins.md) — implements FEJ-based observability-constrained estimation.
- [Scale observability](../level-07-stereo-slam/scale-observability.md) — the stereo perspective on scale.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the purely monocular case (7 unobservable DoF).
- [Consistency](../level-02-getting-familiar/consistency.md) — the estimator property observability analysis protects.

[Back to Level 6](../README.md#level-6-vio--vins)
