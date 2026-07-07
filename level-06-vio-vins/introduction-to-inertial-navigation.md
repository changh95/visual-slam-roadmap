# Introduction to Inertial Navigation
> Woodman 2007 · [Paper](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html)

**One-line summary** — A self-contained tutorial technical report on inertial navigation — sensor physics, coordinate frames, error sources, and strapdown integration — that remains the standard entry point before studying any VIO system.

## Problem
IMUs appear in nearly every robotics and SLAM system, yet their operating principles, error characteristics, and integration equations were scattered across aerospace textbooks rather than collected in one accessible source. Researchers new to VIO lacked the background to understand why IMU bias, noise, and integration drift fundamentally limit dead-reckoning accuracy — and therefore why every visual-inertial design looks the way it does.

Woodman's Cambridge technical report (UCAM-CL-TR-696) fills this gap as a standalone primer.

## Key ideas
- **Sensor physics.** Accelerometers measure *specific force* (acceleration minus gravity) via proof-mass deflection; gyroscopes measure angular rate via Coriolis forces (MEMS) or the Sagnac effect (fiber-optic). Manufacturing imperfections in both produce structured, not merely random, errors.
- **The full IMU error model.** Each sensor axis exhibits bias, scale-factor error, cross-axis misalignment, and white noise:
  $$\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \mathbf{S}^a\mathbf{a} + \mathbf{M}^a\mathbf{a} + \boldsymbol{\eta}^a, \qquad
  \tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{S}^g\boldsymbol{\omega} + \mathbf{M}^g\boldsymbol{\omega} + \boldsymbol{\eta}^g$$
  where $\mathbf{b}$ is bias, $\mathbf{S}$ is (diagonal) scale-factor error, $\mathbf{M}$ is cross-axis sensitivity, and $\boldsymbol{\eta}$ is white Gaussian noise. Practical VIO estimators keep only $\mathbf{b}$ and $\boldsymbol{\eta}$ online and assume the rest is calibrated away.
- **Strapdown navigation equations.** Orientation, velocity, and position follow from chained integration of body-frame measurements:
  $$\dot{\mathbf{R}} = \mathbf{R}\,[\boldsymbol{\omega}]_\times, \qquad \dot{\mathbf{v}} = \mathbf{R}\,\mathbf{a} + \mathbf{g}, \qquad \dot{\mathbf{p}} = \mathbf{v}.$$
  Modern VIO is exactly a strapdown INS with visual aiding; the report also clarifies the strapdown vs gimbal-stabilized distinction and why strapdown demands careful orientation tracking.
- **Drift growth laws.** Double integration of accelerometer white noise makes position error grow as $\sigma_p \propto \sigma_\eta\, t^{3/2}$; integrating gyro white noise gives orientation error growing like $\sqrt{t}$ (angle random walk). These closed-form growth rates are the quantitative reason pure inertial dead-reckoning diverges.
- **Allan variance.** Plotting the Allan deviation $\sigma(\tau)$ against averaging time $\tau$ on a log-log scale separates the noise sources by slope — the procedure that yields the four noise parameters every VIO filter configuration demands:

  | Slope | Noise source |
  |---|---|
  | $-1/2$ | angle / velocity random walk (white noise) |
  | $0$ (flat minimum) | bias instability |
  | $+1/2$ | rate random walk (bias random walk) |
- **Worked dead-reckoning examples.** The report walks through drift calculations for representative MEMS sensors, showing how rapidly uncorrected position error grows to unusable levels during pure dead reckoning — concrete arithmetic that motivates camera-based correction.

## Results & impact
This is a tutorial report, not a benchmark paper: its "results" are worked numerical examples of drift rates for representative MEMS IMUs. Its impact is as a citation staple — it is the standard entry-point reference for IMU theory cited by most VIO papers, and it explains the error sources that motivated all subsequent VIO machinery: online bias estimation, manifold integration, and preintegration.

## Why it matters for SLAM
Nearly every VIO paper assumes the reader already knows what an IMU measures, why biases must be estimated online, and why pure inertial dead-reckoning diverges — and cites Woodman for the details. Reading this report first makes the measurement models in MSCKF, preintegration, and every subsequent system legible, and its worked drift examples give quantitative intuition for how much the camera must correct.

## Related
- [IMU noise model](imu-noise-model.md) — the concept note distilled from this material.
- [IMU](../level-02-getting-familiar/imu.md) — sensor basics.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the theory built on top of these measurement models.
- [MSCKF](msckf.md) — the first system to read after this foundation.
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — the companion mathematical reference for rotation handling.

[Back to Level 6](../README.md#level-6-vio--vins)
