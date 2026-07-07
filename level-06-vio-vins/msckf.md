# MSCKF
> Mourikis 2007 · [Paper](https://ieeexplore.ieee.org/document/4209642)

**One-line summary** — The Multi-State Constraint Kalman Filter achieves efficient monocular VIO by keeping a sliding window of camera *poses* (not landmarks) in the EKF state and projecting feature measurements onto the null space of the landmark Jacobian, so cost stays low regardless of feature count.

## Problem
Classic EKF-SLAM puts every 3D landmark position in the state vector, so the covariance update costs $O(n^2)$ in the number of features — prohibitive for vision-aided inertial navigation, where hundreds of features per image are routine and the hardware budget (in 2007 and on today's embedded devices alike) is tight.

The question MSCKF answered: can visual feature tracks constrain the trajectory *without* the features ever becoming state variables?

## Key ideas
- **Poses in the state, not landmarks.** The EKF state holds the current IMU state $({}^G\mathbf{R}_I, {}^G\mathbf{p}_I, {}^G\mathbf{v}_I, \mathbf{b}^g, \mathbf{b}^a)$ plus a bounded sliding window of past camera poses; at each new image the current camera pose is appended (state augmentation), and stale poses are pruned. Feature positions never enter the state.
- **Use whole feature tracks at once.** When a feature track ends (the point leaves the field of view), its 3D position ${}^G\mathbf{p}_f$ is triangulated from *all* the windowed poses that observed it, and the stacked reprojection residuals over the $M$ observations are linearized:
  $$\mathbf{r}^{(f)} = \mathbf{H}^{(f)}_{\mathbf{X}}\,\delta\mathbf{X} + \mathbf{H}^{(f)}_{f}\,\delta{}^G\mathbf{p}_f + \mathbf{n}^{(f)}.$$
- **Null-space projection (the structureless trick).** Multiplying by $\mathbf{V}^\top$, where $\mathbf{V}$ spans the left null space of the feature Jacobian $\mathbf{H}^{(f)}_f$, eliminates the feature-position term:
  $$\mathbf{r}^{(f)}_o = \mathbf{V}^\top\mathbf{r}^{(f)} = \mathbf{V}^\top\mathbf{H}^{(f)}_{\mathbf{X}}\,\delta\mathbf{X} + \mathbf{V}^\top\mathbf{n}^{(f)},$$
  leaving a constraint that couples only the camera poses in the window — a *structureless* measurement model in which the feature's uncertainty is marginalized exactly, not ignored.
- **Standard EKF machinery around it.** The full loop per camera frame:
  1. *propagate* the IMU state and covariance with incoming IMU measurements;
  2. *augment* the state with the new camera pose;
  3. for each feature track that just ended: *triangulate*, *linearize*, *project* onto the null space;
  4. *update* the EKF with the stacked projected residuals;
  5. *prune* camera poses that no longer contribute.

  Per-feature cost is constant, so the filter handles many features at camera rate.
- **Multi-state constraints as the core insight.** A single image measurement constrains one pose; a feature track constrains the *relative geometry of all poses that saw it*. MSCKF is the machinery for feeding exactly that multi-pose information into a Kalman filter without state growth.

## Results & impact
Presented at ICRA 2007, MSCKF demonstrated real-time monocular VIO at camera-rate updates with accuracy competitive with early optimization-based systems at a fraction of the computational cost.

It founded the filter-based branch of VIO: it is the direct ancestor of S-MSCKF (stereo) and OpenVINS, and its structureless measurement model became standard well beyond filtering (GTSAM's smart factors, used in Kimera-VIO, are the smoothing-world analogue). The follow-up literature analyzing its linearization behavior produced the observability/consistency theory — First-Estimate Jacobians and observability-constrained filtering — that all modern filter-based VIO relies on.

## Why it matters for SLAM
MSCKF founded the filter-based branch of VIO and its structureless measurement model became standard well beyond filtering (e.g., smart factors in GTSAM/Kimera). It is the direct ancestor of S-MSCKF (stereo), ROVIO-era EKF designs, and OpenVINS, and the follow-up literature on its linearization behavior produced the observability/consistency analysis (First-Estimate Jacobians) that all modern filter-based VIO relies on. Its efficiency profile is why MSCKF-style estimators are widely associated with deployed AR/VR tracking stacks. When accuracy-per-CPU-cycle matters more than absolute accuracy, MSCKF is still the reference design.

## Related
- [OpenVINS](openvins.md) — the modern open-source MSCKF with FEJ and online calibration.
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md) — the stereo extension (S-MSCKF).
- [ROVIO](rovio.md) — the other landmark filter-based VIO, using direct photometric updates.
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — where MSCKF sits in the design space.
- [Observability](observability.md) — the analysis tradition MSCKF spawned.
- [Deployed VIO](deployed-vio.md) — where MSCKF-class efficiency matters most.

[Back to Level 6](../README.md#level-6-vio--vins)
