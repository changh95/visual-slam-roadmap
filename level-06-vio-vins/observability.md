# Observability

A state (or direction in state space) is **observable** if the available measurements constrain it; unobservable directions can drift freely without changing any measurement. Formally, a direction $\mathbf{n}$ lies in the unobservable subspace when perturbing the state along $\mathbf{n}$ leaves every measurement invariant — for a linearized system, $\mathbf{n}$ spans the null space of the observability matrix built from the stacked $\mathbf{H}\boldsymbol{\Phi}$ blocks. Knowing exactly which directions are unobservable in VIO is essential for building consistent estimators.

## The 4 unobservable DoF of VIO

A visual-inertial system measures bearing angles to landmarks (camera) and specific force plus angular rate (IMU). Gravity gives an absolute reference for roll and pitch, and the accelerometer makes metric scale observable under generic motion. What remains unobservable:

- **3-DoF global translation** — shifting the entire trajectory and map together changes no camera measurement (bearings between poses and landmarks are unchanged) and no IMU measurement (accelerations are translation-invariant).
- **1-DoF global yaw** — rotating everything about the gravity direction leaves bearings unchanged, and gravity itself is symmetric about its own axis, so the IMU cannot break the tie either. Roll and pitch, by contrast, *are* observable because they change how gravity projects into the accelerometer.

So monocular VIO has exactly 4 unobservable DoF. Compare:

| System | Unobservable DoF | What's free |
|---|---|---|
| Monocular vision only | 7 | translation (3) + rotation (3) + scale (1) |
| Monocular VIO | 4 | translation (3) + yaw (1) |
| Stereo VIO | 4 | translation (3) + yaw (1) — the baseline adds a second scale source, but global position and yaw remain free |

## Motion-dependent degeneracies

Some states are only observable under sufficiently exciting motion:

- Under **constant acceleration** (including hovering and uniform velocity), metric scale becomes *additionally* unobservable — the accelerometer reading cannot be separated into scale and acceleration. This is why VIO on constant-velocity ground vehicles and gentle drone hovers degrades, why highway driving shows scale drift, and why initialization procedures demand dynamic motion.
- **Pure rotation or zero rotation** weakens the separability of accelerometer bias, gravity, and extrinsic calibration states; online camera-IMU calibration likewise needs rotational excitation about multiple axes.
- Practical rule: the richer the motion (varied accelerations and rotations), the faster scale, biases, and extrinsics converge. Systems like DM-VIO explicitly keep optimizing scale after initialization because early motion may not have excited it.

## A quick intuition check

Why is yaw unobservable but roll/pitch observable? Rotate the whole world (trajectory + map) by an angle $\alpha$ about the gravity vector: every camera still sees every landmark at the same bearing (the rotation is applied to both), and the accelerometer still measures the same gravity projection (gravity is the rotation axis, so it is unchanged). No measurement can distinguish the rotated world from the original — yaw is free. Now tilt the world about a horizontal axis instead: bearings are still consistent, but gravity now projects *differently* into the accelerometer — the IMU notices. Roll and pitch are pinned.

The same style of argument shows global translation is free (bearings and accelerations are translation-invariant) and why the accelerometer fixes scale under generic motion: doubling the map and trajectory doubles true accelerations, which the accelerometer would detect — unless acceleration is constant, in which case the change hides inside the bias/gravity estimate.

## Consistency and First-Estimate Jacobians (FEJ)

An EKF that linearizes measurements at *different estimates over time* can spuriously gain information along the unobservable directions: each Jacobian is correct in isolation, but stacked together they define a linearized system whose unobservable subspace is smaller than the true one (typically yaw appears observable when it is not). The filter then becomes overconfident — **inconsistent** — most visibly in yaw covariance that shrinks without justification.

The **FEJ remedy**: evaluate the Jacobians of each state at its *first* estimate and keep using that linearization point, so all stacked Jacobians share a consistent linearization and the correct 4-dimensional unobservable subspace is preserved by construction. This is standard in OpenVINS and modern MSCKF variants, and the same idea governs the handling of marginalization priors in sliding-window optimizers (with Basalt's nonlinear factor recovery and DM-VIO's delayed marginalization as alternative treatments).

## Practical consequences

- **Fix the gauge explicitly.** Hold the first pose (position + yaw) fixed or add a prior; otherwise the solver wanders along the free directions and the Hessian is singular.
- **4-DoF loop closure.** Loop-closure corrections in VIO pose graphs should adjust only yaw + translation (as in VINS-Mono) — warping roll/pitch would corrupt directions that gravity has made observable.
- **4-DoF trajectory alignment.** Evaluating a VIO system against ground truth uses a 4-DoF (yaw + translation) alignment, not the 6-DoF or 7-DoF ($Sim(3)$) alignments appropriate for visual-only odometry.
- **Reading covariances.** Uncertainty along global $x, y, z$ and yaw *should* grow without bound in the absence of loop closures or absolute references (GPS, prior map); a filter that reports shrinking yaw uncertainty is telling you it is inconsistent, not accurate.

## Common pitfalls

- Believing stereo removes all scale worries: stereo fixes *scale* observability, but global translation and yaw stay unobservable — drift in those directions is inevitable without loop closure or absolute measurements.
- Diagnosing yaw drift or highway scale drift as a bug: they are structural properties of the sensor suite, mitigated only by adding information (loops, GPS, wheel odometry, prior maps).
- Applying full 6/7-DoF evaluation alignment to VIO results — this hides yaw errors and flatters the numbers.

## Why it matters for SLAM
Observability analysis explains behaviors that otherwise look like bugs: yaw drift that never stops, scale drift on highway driving, overconfident covariances after long runs. It dictates the design of initialization (needs excitation), loop closure (4-DoF), and filter consistency machinery (FEJ). Reading a VIO paper starts with asking: which states does this system treat as observable, and under what motion?

## Related
- [MSCKF](msckf.md) — the filter whose follow-up literature developed VIO observability analysis.
- [OpenVINS](openvins.md) — implements FEJ-based observability-constrained estimation.
- [Scale observability](../level-07-stereo-slam/scale-observability.md) — the stereo perspective on scale.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the purely monocular case (7 unobservable DoF).
- [Consistency](../level-02-getting-familiar/consistency.md) — the estimator property observability analysis protects.
- [Metrics](../level-02-getting-familiar/metrics.md) — where the 4-DoF alignment convention shows up in evaluation.
