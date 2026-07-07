# Introduction to Inertial Navigation
> Woodman 2007 · [Paper](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-696.html)

**One-line summary** — A self-contained tutorial technical report on inertial navigation — sensor physics, strapdown integration, and a measurement/simulation study of MEMS error propagation — that remains the standard entry point before studying any VIO system.

## Problem
IMUs appear in nearly every robotics and SLAM system, yet existing introductions to inertial navigation "fail to sufficiently describe the error characteristics of inertial systems". Researchers new to VIO lacked the background to understand why gyro and accelerometer noise fundamentally limit dead-reckoning accuracy — and therefore why every visual-inertial design looks the way it does. Woodman's Cambridge technical report (UCAM-CL-TR-696) fills this gap, focusing on strapdown systems built from MEMS devices.

## Method & architecture
The report walks through the full strapdown INS pipeline and then quantifies each error source by measurement (Allan variance) and simulation:

- **Sensor physics.** Gyroscopes: mechanical, optical (Sagnac effect), and MEMS (Coriolis force on a vibrating mass); accelerometers: mechanical proof-mass, solid-state (e.g. surface acoustic wave), and MEMS. Accelerometers measure specific force, so gravity must be subtracted after projection into the global frame.
- **Orientation tracking.** Body-frame angular velocity $\boldsymbol{\omega}_b(t)$ drives the direction-cosine matrix $C$ (body→global) through $\dot{C}(t) = C(t)\,\Omega(t)$, with $\Omega$ the skew-symmetric form of $\boldsymbol{\omega}_b$. Integrating over one sample period with the rectangular rule ($B = \Omega\,\delta t$, $\sigma = |\boldsymbol{\omega}_b\,\delta t|$) gives the closed-form attitude update

  $$C(t+\delta t) = C(t)\left(I + \frac{\sin\sigma}{\sigma}B + \frac{1-\cos\sigma}{\sigma^{2}}B^{2}\right).$$

- **Position tracking.** Acceleration is rotated to the global frame, gravity-compensated, and doubly integrated: $\mathbf{a}_g(t) = C(t)\,\mathbf{a}_b(t)$, then $\mathbf{v}_g(t) = \mathbf{v}_g(0) + \int_0^t (\mathbf{a}_g - \mathbf{g}_g)\,dt$ and $\mathbf{s}_g(t) = \mathbf{s}_g(0) + \int_0^t \mathbf{v}_g\,dt$.
- **Error growth laws.** A constant gyro bias $\epsilon$ integrates to a linearly growing angle error $\theta(t) = \epsilon\,t$. Gyro white noise of variance $\sigma^2$ produces an *angle random walk* with $\sigma_\theta(t) = \sigma\sqrt{\delta t \cdot t}$ (grows as $\sqrt{t}$). Double-integrated accelerometer white noise produces a *second-order random walk* in position,

  $$\sigma_s(t) \approx \sigma\, t^{3/2} \sqrt{\delta t / 3},$$

  growing as $t^{3/2}$. Flicker (1/f) noise causes bias instability, modeled as a bias random walk; temperature and calibration errors (scale factor, misalignment) add structured terms.
- **The critical error path.** A tilt error $\epsilon$ leaks gravity into the horizontal channels as a residual bias $g\sin(\epsilon)$: a tilt of just 0.05° projects 0.0086 m/s² onto the horizontal axes, growing quadratically to 7.7 m position error after only 30 s. Gyro error propagating into the gravity subtraction — not accelerometer error — dominates INS drift.
- **Allan variance.** Divide the signal into bins of length $t$, average each, then $\mathrm{AVAR}(t) = \frac{1}{2(n-1)}\sum_i (a(t)_{i+1} - a(t)_i)^2$. On a log-log Allan-deviation plot, white noise appears as a slope of $-0.5$ (read ARW/VRW at $t = 1$) and bias instability as the flat minimum — the procedure that yields the noise parameters every VIO filter configuration demands.

## Results
Using an Xsens Mtx MEMS IMU sampled at 100 Hz (500 stationary 60-second runs):

- Average position drift reaches **152.67 m after 60 seconds** of pure strapdown dead reckoning; only 1.76 m of it is vertical — the signature of tilt-error-driven gravity leakage.
- Selectively removing sensor noise in simulation shows accelerometer noise dominates drift only for the first ~0.3 s; after that, orientation error from gyroscope noise is by far the main cause, with white noise the largest contributor among the gyro noise processes.
- Allan analysis of the Mtx gyros gives angle random walk ≈ 4.6–4.8°/√h and bias instability ≈ 32–43°/h.
- Sensor fusion with magnetometers reduces the average 60-second position error from over 150 m to around 5 m — a preview of why inertial data must always be aided (by cameras, in VIO).

## Why it matters for SLAM
Nearly every VIO paper assumes the reader already knows what an IMU measures, why biases must be estimated online, and why pure inertial dead-reckoning diverges — and cites Woodman for the details. Reading this report first makes the measurement models in MSCKF, preintegration, and every subsequent system legible, and its 152 m-in-60-s worked example gives quantitative intuition for how much the camera must correct.

## Related
- [IMU noise model](imu-noise-model.md) — the concept note distilled from this material.
- [IMU](../level-02-getting-familiar/imu.md) — sensor basics.
- [IMU Preintegration on Manifold](imu-preintegration-on-manifold.md) — the theory built on top of these measurement models.
- [MSCKF](msckf.md) — the first system to read after this foundation.
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md) — the companion mathematical reference for rotation handling.
