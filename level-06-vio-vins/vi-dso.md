# VI-DSO

> von Stumberg 2018 · [Paper](https://arxiv.org/abs/1804.05625)

**One-line summary** — VI-DSO tightly integrates preintegrated IMU factors into DSO's direct sparse photometric bundle adjustment, recovering metric scale for a monocular camera while keeping the accuracy and low-texture robustness of direct methods.

## Problem

Monocular direct odometry (DSO) delivers excellent accuracy but only up to an unknown scale. An IMU makes scale observable — yet often *not immediately*: with gentle motion the accelerometer barely constrains scale, so systems that wait for full observability before initializing suffer long, fragile start-up phases. Worse, sliding-window estimators keep computation bounded via partial marginalization, and the resulting linearized prior becomes inconsistent if the scale estimate later moves far away from the value at which the prior was linearized. VI-DSO addresses both problems at once.

## Key ideas

- **Photometric + inertial joint optimization**: the sliding-window bundle adjustment minimizes photometric residuals (as in DSO) together with IMU measurement errors in a combined energy functional, over poses, velocities, IMU biases, inverse depths, and affine brightness parameters:
  $$E = \sum_{\text{photo}} w_p\,\|e_{\text{photo}}\|_\gamma + \sum_{\text{IMU}} \|e_{\text{IMU}}\|^2_{\Sigma_{\text{IMU}}}$$
- **Bundle adjustment on raw intensities**: the visual part performs a bundle-adjustment-like optimization on a sparse set of points, but instead of matching keypoints it directly minimizes photometric error — so it can track not only corners but *any* pixel with a large enough intensity gradient, which is where the low-texture robustness comes from.
- **IMU preintegration between keyframes**: IMU information accumulated across several frames is inserted into the optimization as one preintegrated constraint between consecutive keyframes, keeping the factor graph small despite the high IMU rate.
- **Scale and gravity as explicit variables**: metric scale and gravity direction are included in the optimized state, so the system can initialize *immediately with an arbitrary scale* instead of delaying initialization until everything is observable — scale then converges jointly with the other variables as the estimator runs.
- **Dynamic marginalization**: sliding-window marginalization priors are linearized around the current scale estimate; when the scale estimate drifts far from that linearization point the prior becomes inconsistent. VI-DSO maintains multiple marginalization priors and swaps to one with a valid linearization region when scale changes significantly — allowing partial marginalization even when the initial scale estimate is far from the optimum.
- **Direct alternative to feature-based VIO**: in contrast to VINS-Mono/OKVIS, which minimize geometric reprojection error of matched features, VI-DSO works on raw intensities of high-gradient points.

## Results & impact

On the challenging EuRoC dataset, the paper shows VI-DSO outperforming the state of the art of its time — establishing that a direct photometric front-end plus tightly-coupled IMU factors is competitive with the mature feature-based VIO systems. Its two signature mechanisms had lasting influence: joint estimation of scale/gravity in the window became a common pattern for visual-inertial initialization, and dynamic marginalization is the direct precursor of the delayed marginalization idea at the heart of DM-VIO.

## Why it matters for SLAM

VI-DSO demonstrated that visual-inertial fusion is not exclusive to feature-based pipelines: direct photometric bundle adjustment accommodates IMU factors and delivers EuRoC accuracy competitive with VINS-Mono and OKVIS. It is a key link in the DSO lineage (DSO → Stereo DSO / LDSO → VI-DSO → DM-VIO), and its handling of delayed scale convergence via dynamic marginalization directly foreshadows DM-VIO's delayed marginalization.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [DM-VIO](dm-vio.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [IMU preintegration](imu-preintegration.md)
- [VINS-Mono](vins-mono.md)

[Back to Level 6](../README.md#level-6-vio--vins)
