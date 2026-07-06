# Introduction to Inertial Navigation
> Woodman 2007 · [Paper](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html)

**One-line summary** — A self-contained tutorial technical report on inertial navigation — sensor physics, coordinate frames, error sources, and strapdown integration — that remains the standard entry point before studying any VIO system.

## Key ideas
- **Sensor physics**: accelerometers measure *specific force* (acceleration minus gravity) via proof-mass deflection; gyroscopes measure angular rate via Coriolis forces (MEMS) or the Sagnac effect (fiber-optic). Manufacturing imperfections produce structured errors.
- **IMU error model**: each axis exhibits bias $\mathbf{b}$, scale-factor error, cross-axis misalignment, and white noise $\boldsymbol{\eta}$; practical VIO systems keep only bias and white noise in the estimator and calibrate the rest.
- **Strapdown navigation equations**: orientation, velocity, and position are obtained by chained integration in the body frame: $\dot{\mathbf{R}} = \mathbf{R}[\boldsymbol{\omega}]_\times$, $\dot{\mathbf{v}} = \mathbf{R}\mathbf{a} + \mathbf{g}$, $\dot{\mathbf{p}} = \mathbf{v}$. Modern VIO is strapdown INS with visual aiding.
- **Drift growth**: double integration of accelerometer white noise makes position error grow as $\sigma_p \propto \sigma_\eta\, t^{3/2}$ — dead-reckoning with a MEMS IMU accumulates tens of meters of error within about a minute, which is exactly why camera correction is essential.
- **Allan variance**: the log-log plot of $\sigma(\tau)$ vs averaging time separates angle/velocity random walk (slope $-1/2$), bias instability (slope $0$), and rate random walk (slope $+1/2$), giving the noise parameters needed to configure any VIO filter.

## Why it matters for SLAM
Nearly every VIO paper assumes the reader already knows what an IMU measures, why biases must be estimated online, and why pure inertial dead-reckoning diverges — and cites Woodman for the details. Reading this report first makes the measurement models in MSCKF, preintegration, and every subsequent system legible, and its worked drift examples give quantitative intuition for how much the camera must correct.

## Related
- [IMU noise model](imu-noise-model.md) — the concept note distilled from this material.
- [IMU](../level-02-getting-familiar/imu.md) — sensor basics.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the theory built on top of these measurement models.
- [MSCKF](msckf.md) — the first system to read after this foundation.

[Back to Level 6](../README.md#level-6-vio--vins)
