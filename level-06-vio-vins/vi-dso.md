# VI-DSO

> von Stumberg 2018 · [Paper](https://arxiv.org/abs/1804.05625)

**One-line summary** — VI-DSO tightly integrates preintegrated IMU factors into DSO's direct sparse photometric bundle adjustment, recovering metric scale for a monocular camera while keeping the accuracy and low-texture robustness of direct methods.

## Key ideas

- **Photometric + inertial joint optimization**: the sliding-window bundle adjustment minimizes photometric residuals (as in DSO) together with IMU preintegration residuals, over poses, velocities, IMU biases, inverse depths, and affine brightness parameters:
  $$E = \sum_{\text{photo}} w_p\,\|e_{\text{photo}}\|_\gamma + \sum_{\text{IMU}} \|e_{\text{IMU}}\|^2_{\Sigma_{\text{IMU}}}$$
- **Scale and gravity as explicit variables**: rather than waiting for a fragile initialization to converge, VI-DSO includes metric scale and gravity direction in the optimized state and starts with an arbitrary scale, refining it jointly as the estimator runs.
- **Dynamic marginalization**: sliding-window marginalization priors are linearized around the current scale estimate; when the scale estimate drifts far from that linearization point the prior becomes inconsistent. VI-DSO maintains multiple marginalization priors and swaps to one with a valid linearization region when scale changes significantly — the "dynamic marginalization" trick.
- **Direct alternative to feature-based VIO**: in contrast to VINS-Mono/OKVIS, which minimize geometric reprojection error of matched features, VI-DSO works on raw intensities of high-gradient points.

## Why it matters for SLAM

VI-DSO demonstrated that visual-inertial fusion is not exclusive to feature-based pipelines: direct photometric bundle adjustment accommodates IMU factors and delivers EuRoC accuracy competitive with VINS-Mono and OKVIS. It is a key link in the DSO lineage (DSO → Stereo DSO / LDSO → VI-DSO → DM-VIO), and its handling of delayed scale convergence via dynamic marginalization directly foreshadows DM-VIO's delayed marginalization.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [DM-VIO](dm-vio.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [IMU preintegration](imu-preintegration.md)
- [VINS-Mono](vins-mono.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
