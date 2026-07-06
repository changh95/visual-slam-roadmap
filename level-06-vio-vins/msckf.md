# MSCKF
> Mourikis 2007 · [Paper](https://ieeexplore.ieee.org/document/4209642)

**One-line summary** — The Multi-State Constraint Kalman Filter achieves efficient monocular VIO by keeping a sliding window of camera *poses* (not landmarks) in the EKF state and projecting feature measurements onto the null space of the landmark Jacobian, so cost stays low regardless of feature count.

## Key ideas
- **No landmarks in the state**: classic EKF-SLAM puts 3D landmark positions in the state, giving $O(n^2)$ cost in the number of features. MSCKF instead augments the state with a bounded window of past camera poses; features never become state variables.
- **Feature marginalization via null-space projection**: when a feature track ends, the feature is triangulated from all observing poses, its stacked reprojection residuals are linearized, and multiplication by the left null space of the feature-position Jacobian $\mathbf{H}_f$ eliminates the feature term — leaving a constraint that couples only the camera poses in the window (a *structureless* measurement model).
- **Standard EKF machinery around it**: IMU measurements propagate the state (pose, velocity, biases); the projected visual residuals drive the update; stale camera poses are pruned from the window.
- **Efficiency by design**: per-feature cost is constant, making camera-rate updates feasible on the modest hardware of 2007 — and on today's embedded platforms.

## Why it matters for SLAM
MSCKF founded the filter-based branch of VIO and its structureless measurement model became standard well beyond filtering (e.g., smart factors in GTSAM/Kimera). It is the direct ancestor of S-MSCKF (stereo), ROVIO-era EKF designs, and OpenVINS, and the follow-up literature on its linearization behavior produced the observability/consistency analysis (First-Estimate Jacobians) that all modern filter-based VIO relies on. Its efficiency profile is why MSCKF-style estimators are widely associated with deployed AR/VR tracking stacks. When accuracy-per-CPU-cycle matters more than absolute accuracy, MSCKF is still the reference design.

## Related
- [OpenVINS](openvins.md) — the modern open-source MSCKF with FEJ and online calibration.
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md) — the stereo extension (S-MSCKF).
- [ROVIO](rovio.md) — the other landmark filter-based VIO, using direct photometric updates.
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — where MSCKF sits in the design space.
- [Observability](observability.md) — the analysis tradition MSCKF spawned.

[Back to Level 6](../README.md#level-6-vio--vins)
