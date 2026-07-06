# OpenVINS

> Geneva 2020 · [Paper](https://docs.openvins.com/)

**One-line summary** — OpenVINS is an open-source, modular MSCKF-based VIO research platform from the University of Delaware that packages observability-consistent filtering, online camera-IMU calibration, and reproducible benchmarking tools, becoming the de-facto standard MSCKF implementation.

## Key ideas

- **MSCKF core with First-Estimate Jacobians (FEJ)**: measurement Jacobians are evaluated at each variable's first linearization point, preventing spurious information gain along the unobservable directions (global position and yaw) and keeping the filter consistent.
- **Online spatial and temporal calibration**: the camera-IMU extrinsic transform, camera intrinsics, and the camera-IMU time offset $t_d$ are appended to the filter state and estimated on the fly — essential for real deployments with imperfect factory calibration.
- **Modular and extensible**: clean separation of propagator, feature tracker, updater, and state management; supports monocular, stereo, and general N-camera rigs.
- **Type-based state system**: landmarks can use different representations (e.g., global 3D, anchored inverse depth), and the sliding window of clones follows the standard multi-state constraint (null-space projection) update.
- **Reproducible research infrastructure**: ROS integration, dataset configurations, ground-truth alignment, and evaluation utilities that made it a common baseline in subsequent VIO papers.

## Why it matters for SLAM

Despite MSCKF's influence since 2007, no authoritative open implementation existed before OpenVINS, which made rigorous comparison between filter-based and optimization-based VIO difficult. OpenVINS turned the filter-based lineage (MSCKF, observability-constrained EKF work) into an accessible, documented codebase; if you want to learn how a production-quality EKF-based VIO works — or need a lightweight estimator for a compute-constrained robot — this is the reference system to study.

## Related

- [MSCKF](msckf.md)
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md)
- [ROVIO](rovio.md)
- [Observability](observability.md)
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
