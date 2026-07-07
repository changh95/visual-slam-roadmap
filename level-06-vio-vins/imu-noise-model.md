# IMU noise model

Raw IMU measurements are corrupted in a structured way. The full error model (following Woodman's primer) includes bias, scale-factor error, cross-axis misalignment, and white noise per sensor:

$$\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \mathbf{S}^a\mathbf{a} + \mathbf{M}^a\mathbf{a} + \boldsymbol{\eta}^a, \qquad
\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{S}^g\boldsymbol{\omega} + \mathbf{M}^g\boldsymbol{\omega} + \boldsymbol{\eta}^g$$

where $\mathbf{S}$ is (diagonal) scale-factor error and $\mathbf{M}$ is cross-axis sensitivity. VIO estimators assume $\mathbf{S}$ and $\mathbf{M}$ are handled by factory or offline calibration and keep only the two online terms — additive **white noise** and a slowly-varying **bias**:

$$\tilde{\boldsymbol{\omega}} = \boldsymbol{\omega} + \mathbf{b}^g + \boldsymbol{\eta}^g \qquad
\tilde{\mathbf{a}} = \mathbf{a} + \mathbf{b}^a + \boldsymbol{\eta}^a$$

with $\boldsymbol{\eta}$ zero-mean white Gaussian noise and each bias modeled as a **random walk**: $\dot{\mathbf{b}} = \boldsymbol{\eta}^b$ with its own white driving noise.

## Why these two terms matter so much

- **White noise integrates into random-walk drift.** Integrating white gyroscope noise gives an orientation error that grows like $\sigma\sqrt{t}$ (*angle random walk*); double-integrating accelerometer noise gives position error growing like $t^{3/2}$. This is why pure inertial dead-reckoning with a MEMS IMU diverges within seconds — and why the camera is needed.
- **Bias is not constant.** Turn-on bias differs every power cycle, and in-run bias wanders slowly with time and temperature. VIO estimators therefore keep $\mathbf{b}^g, \mathbf{b}^a$ *in the state vector* and estimate them continuously; the random-walk model tells the estimator how fast to let them move.

## The four parameters and their units

A VIO configuration needs four numbers (often per-axis, usually shared):

| Parameter | Symbol | Typical continuous-time unit |
|---|---|---|
| Gyro noise density (angle random walk) | $\sigma_{\eta^g}$ | $\mathrm{rad/s/\sqrt{Hz}}$ |
| Accel noise density (velocity random walk) | $\sigma_{\eta^a}$ | $\mathrm{m/s^2/\sqrt{Hz}}$ |
| Gyro bias random walk | $\sigma_{b^g}$ | $\mathrm{rad/s^2/\sqrt{Hz}}$ |
| Accel bias random walk | $\sigma_{b^a}$ | $\mathrm{m/s^3/\sqrt{Hz}}$ |

These are *continuous-time densities*. To use them at a discrete sampling interval $\Delta t$, the standard conversions are $\sigma_{\eta,d} = \sigma_\eta / \sqrt{\Delta t}$ for the measurement noise and $\sigma_{b,d} = \sigma_b \sqrt{\Delta t}$ for the bias increment — a chronic source of implementation bugs (see pitfalls). These four numbers feed directly into the covariance propagation of an EKF or the covariance of a preintegrated IMU factor, i.e., they set how much the estimator trusts the IMU relative to the camera.

## Allan variance: identifying the parameters

**Allan variance** is the standard tool for identifying these noise parameters from a long stationary log (hours, temperature-stable). Plotting the Allan deviation $\sigma(\tau)$ against averaging time $\tau$ on a log-log scale separates the noise sources by slope:

| Slope | Noise source | Parameter |
|---|---|---|
| $-1/2$ | White noise (angle/velocity random walk) | $\sigma_{\eta}$ (noise density, read at $\tau = 1\,\mathrm{s}$) |
| $0$ (flat minimum) | Bias instability | — |
| $+1/2$ | Bias random walk | $\sigma_{b}$ (random-walk density) |

The four numbers read off this plot are exactly the parameters demanded by the configuration files of VINS-Mono, OpenVINS, Kimera-VIO, and every other VIO system, e.g. in a Kalibr-style `imu.yaml`:

```yaml
# continuous-time noise densities (example structure — measure your own values)
gyroscope_noise_density:     ...   # [rad/s/sqrt(Hz)]
gyroscope_random_walk:       ...   # [rad/s^2/sqrt(Hz)]
accelerometer_noise_density: ...   # [m/s^2/sqrt(Hz)]
accelerometer_random_walk:   ...   # [m/s^3/sqrt(Hz)]
update_rate: 200.0                 # [Hz]
```

Tools such as `kalibr_allan` and `allan_variance_ros` automate the log-and-fit procedure. In practice, values are often inflated somewhat above the Allan-derived ones (commonly several-fold) to absorb unmodeled effects: vibration, temperature ramps, scale-factor residuals.

## Common pitfalls

- **Unit confusion.** Mixing continuous-time densities with discrete-time standard deviations (or datasheet units like $^\circ/\sqrt{\mathrm{h}}$ for gyros) silently mis-weights the IMU by orders of magnitude. Always check which convention your estimator expects.
- **Datasheet optimism.** Manufacturer numbers are measured on a vibration-isolated bench; a quadrotor's IMU sees motor vibration that behaves like extra noise. Log on the actual platform if possible.
- **Overconfident parameters** make the filter trust the IMU too much — divergence under vibration or fast motion. **Overly pessimistic** parameters throw away the IMU's motion information, hurting robustness during visual dropouts. Both failure modes are common; tune deliberately.
- **Too-short Allan logs.** The $+1/2$ bias-random-walk region only appears at large $\tau$; a 10-minute log cannot identify it. Multi-hour stationary recordings are the norm.

## Why it matters for SLAM
The noise model is the contract between your hardware and your estimator: it sets the weight of IMU factors relative to visual factors. Parameters that are too optimistic make the filter overconfident in the IMU (divergence under vibration); too pessimistic and you throw away the IMU's motion information. Being able to run and read an Allan variance plot is a basic practical skill for anyone deploying VIO on real hardware.

## Related
- [Introduction to Inertial Navigation](introduction-to-inertial-navigation.md) — Woodman's primer covering error sources in depth.
- [IMU](../level-02-getting-familiar/imu.md) — the sensor itself.
- [IMU preintegration](imu-preintegration.md) — where these noise terms propagate into factor covariances.
- [OpenVINS](openvins.md) — a system whose documentation makes the noise-parameter workflow explicit.
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md) — the offline calibration that removes scale/misalignment terms.
