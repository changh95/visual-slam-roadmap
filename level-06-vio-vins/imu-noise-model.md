# IMU noise model

Raw IMU measurements are corrupted in a structured way. The standard model used in VIO keeps two error terms per sensor axis — additive **white noise** and a slowly-varying **bias**:

$$\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \boldsymbol{\eta}^g \qquad
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \boldsymbol{\eta}^a$$

where $\boldsymbol{\eta}$ is zero-mean white Gaussian noise and $\mathbf{b}$ is a bias modeled as a **random walk**: $\dot{\mathbf{b}} = \boldsymbol{\eta}^b$ with its own white driving noise. (Full calibration models also include scale-factor error and cross-axis misalignment, but VIO estimators normally assume those are handled by factory or offline calibration.)

Why these two terms matter so much:

- **White noise integrates into random walk drift.** Integrating white gyroscope noise gives an orientation error that grows like $\sigma\sqrt{t}$ (*angle random walk*); double-integrating accelerometer noise gives position error growing like $t^{3/2}$. This is why pure inertial dead-reckoning with a MEMS IMU diverges within seconds — and why the camera is needed.
- **Bias is not constant.** Turn-on bias differs every power cycle, and in-run bias wanders slowly with time and temperature. VIO estimators therefore keep $\mathbf{b}^g, \mathbf{b}^a$ *in the state vector* and estimate them continuously; the random-walk model tells the estimator how fast to let them move.

**Allan variance** is the standard tool for identifying these noise parameters from a long stationary log. Plotting the Allan deviation $\sigma(\tau)$ against averaging time $\tau$ on a log-log scale separates the noise sources by slope:

| Slope | Noise source | Parameter |
|---|---|---|
| $-1/2$ | White noise (angle/velocity random walk) | $\sigma_{\eta}$ (noise density) |
| $0$ (flat minimum) | Bias instability | — |
| $+1/2$ | Bias random walk | $\sigma_{b}$ (random-walk density) |

The four numbers read off this plot — gyro/accel noise density and gyro/accel bias random walk — are exactly the parameters demanded by the configuration files of VINS-Mono, OpenVINS, Kimera-VIO, and every other VIO system. Tools such as `kalibr_allan` and `allan_variance_ros` automate the procedure. In practice, values are often inflated somewhat above the Allan-derived ones to absorb unmodeled effects (vibration, temperature ramps).

## Why it matters for SLAM
The noise model is the contract between your hardware and your estimator: it sets the weight of IMU factors relative to visual factors. Parameters that are too optimistic make the filter overconfident in the IMU (divergence under vibration); too pessimistic and you throw away the IMU's motion information. Being able to run and read an Allan variance plot is a basic practical skill for anyone deploying VIO on real hardware.

## Related
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md) — Woodman's primer covering error sources in depth.
- [IMU](../level-02-getting-familiar/imu.md) — the sensor itself.
- [IMU preintegration](imu-preintegration.md) — where these noise terms propagate into factor covariances.
- [OpenVINS](openvins.md) — a system whose documentation makes the noise-parameter workflow explicit.

[Back to Level 6](../README.md#level-6-vio--vins)
