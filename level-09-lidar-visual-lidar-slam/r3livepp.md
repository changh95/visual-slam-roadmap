# R3LIVE++

> Lin 2023 · [Paper](https://arxiv.org/abs/2209.03666)

**One-line summary** — R3LIVE++ upgrades R3LIVE from simple RGB coloring to on-the-fly **radiance map** reconstruction, adding camera photometric calibration and online exposure-time estimation to improve both mapping fidelity and state-estimation accuracy.

## Problem

R3LIVE stores raw RGB values on map points, but a pixel's brightness is not a property of the scene — it is the scene's radiance filtered through the camera's non-linear response function, lens vignetting, and whatever exposure time the auto-exposure logic chose for that frame. Ignoring this pipeline makes stored colors inconsistent across viewpoints and over time, and injects systematic error into any estimator that minimizes photometric residuals. R3LIVE++ models the imaging pipeline explicitly so the map stores *radiance*, a physical quantity, instead of device-dependent RGB.

## Key ideas

- **Same proven architecture as R3LIVE**: a real-time **LIO subsystem** reconstructs the geometric structure (3D point positions) from LiDAR, while a real-time **VIO subsystem** simultaneously recovers the radiance information of that geometry from the input images — both running in real time in a tightly-coupled state estimator.
- **Radiance instead of raw RGB**: by reconstructing the radiance map on the fly, the system decouples scene appearance from the camera's imaging pipeline, giving more consistent appearance across viewpoints and time.
- **Photometric camera modeling**: in the standard photometric image-formation model, an observed pixel intensity is

  $$I(\mathbf{u}) = g\big(\tau \, V(\mathbf{u}) \, L\big),$$

  where $L$ is the scene radiance, $\tau$ the exposure time, $V(\mathbf{u})$ the lens vignetting (per-pixel attenuation toward the image corners), and $g$ the camera's non-linear response function. R3LIVE++ accounts for $g$ and $V$ explicitly, so observed intensities can be inverted back to radiance before they are fused into the map.
- **Online exposure-time estimation**: exposure $\tau$ varies frame to frame under auto-exposure; estimating it online removes the dominant global brightness fluctuation that plagues photometric methods.
- **Calibration feeds back into estimation**: because the photometric residuals are now computed in a physically consistent space, the same modeling that improves map fidelity also improves localization accuracy and robustness.

## Results & impact

The authors conducted more extensive experiments on both public and private datasets against other state-of-the-art SLAM systems; quantitative and qualitative results show significant improvements in both accuracy and robustness over the alternatives. To demonstrate extendability, they built several applications on the reconstructed radiance maps — high-dynamic-range (HDR) imaging, virtual environment exploration, and 3D video gaming. Code, hardware design, and dataset are all open source (`hku-mars/r3live`).

## Why it matters for SLAM

R3LIVE++ is an early, practical step in the convergence of SLAM and photorealistic reconstruction: it treats appearance not as decoration but as a calibrated physical measurement, anticipating the radiance-field mindset (NeRF, Gaussian splatting) inside a real-time LVI estimator. Its photometric calibration and exposure estimation techniques were also picked up by later direct LVI systems such as FAST-LIVO2. Reach for it when the deliverable is a high-fidelity colored map, not just a trajectory.

## Related

- [R3LIVE](r3live.md) — the predecessor system this improves
- [FAST-LIVO2](fast-livo2.md) — direct LVI odometry that also estimates exposure online
- [FAST-LIO2](fast-lio2.md) — the LiDAR-inertial foundation of the HKU MARS stack
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — why photometric calibration matters for direct methods
- [NeRF](../level-05-deep-learning/nerf.md) — the radiance-field idea this system anticipates in real time

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
