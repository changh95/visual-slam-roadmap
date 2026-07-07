# OpenVINS

> Geneva 2020 · [Paper](https://docs.openvins.com/)

**One-line summary** — OpenVINS is an open-source, modular MSCKF-based VIO research platform from the University of Delaware that packages observability-consistent filtering, online camera-IMU calibration, and reproducible benchmarking tools, becoming the de-facto standard MSCKF implementation.

## Problem

Despite MSCKF's influence since 2007, no authoritative open-source implementation existed, which made reproducing results and comparing filter-based against optimization-based VIO genuinely difficult. Real deployments additionally require online calibration of the camera-IMU extrinsics, the camera intrinsics, and the time offset between camera and IMU clocks — none of which earlier open implementations handled. Finally, EKF inconsistency (spurious information gain from incorrect linearization along unobservable directions) was well understood in theory but rarely addressed in released code.

## Key ideas

- **MSCKF core with First-Estimate Jacobians (FEJ)**: measurement Jacobians are evaluated at each variable's *first* linearization point,
  $$\mathbf{H}\big|_{\text{FEJ}} = \left.\frac{\partial \mathbf{r}}{\partial \mathbf{X}}\right|_{\hat{\mathbf{X}}_0},$$
  preventing spurious information gain along the unobservable directions and keeping the filter consistent.
- **Observability-aware design**: monocular VIO has four unobservable directions — global position ($x, y, z$) and global yaw — while scale is observable thanks to the IMU. FEJ enforces exactly this structure so the filter cannot "invent" information about the unobservable states.
- **Online spatial and temporal calibration**: the camera-IMU extrinsic transform, camera intrinsics, and the camera-IMU time offset $t_d$ are appended to the filter state and estimated on the fly. The time offset uses a first-order correction $\mathbf{z}(t + t_d) \approx \mathbf{z}(t) + \dot{\mathbf{z}}(t)\,t_d$, with the feature velocity $\dot{\mathbf{z}}$ obtained from optical flow — which is what makes $t_d$ observable from feature motion.
- **Type-based state system**: landmarks can use different representations (e.g., global 3D, anchored inverse depth), and the sliding window of pose clones follows the standard multi-state constraint (null-space projection) update, so landmarks never enter the state and per-feature cost stays low.
- **Modular and extensible**: clean separation of propagator, feature tracker, updater, and state management; supports monocular, stereo, and general N-camera rigs within the same measurement model.
- **Reproducible research infrastructure**: ROS integration, configuration files for standard datasets (EuRoC, TUM-VI), ground-truth alignment, RMSE computation, and trajectory-plotting utilities that made it a common baseline in subsequent VIO papers.

## Results & impact

On EuRoC, OpenVINS is competitive with VINS-Mono while retaining the computational profile of a filter. Its online extrinsic/temporal calibration converges within a few seconds of motion and improves accuracy by roughly 10–30% compared to running with fixed but imperfect factory calibration. Beyond raw numbers, its impact is infrastructural: it became the standard open MSCKF implementation referenced across the VIO literature, made FEJ-based observability enforcement the expected default in EKF-based VIO, and its evaluation tooling significantly lowered the barrier to entry for VIO research.

## Why it matters for SLAM

Despite MSCKF's influence since 2007, no authoritative open implementation existed before OpenVINS, which made rigorous comparison between filter-based and optimization-based VIO difficult. OpenVINS turned the filter-based lineage (MSCKF, observability-constrained EKF work) into an accessible, documented codebase; if you want to learn how a production-quality EKF-based VIO works — or need a lightweight estimator for a compute-constrained robot — this is the reference system to study.

## Related

- [MSCKF](msckf.md)
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md)
- [ROVIO](rovio.md)
- [Observability](observability.md)
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md)
- [IMU noise model](imu-noise-model.md)

[Back to Level 6](../README.md#level-6-vio--vins)
