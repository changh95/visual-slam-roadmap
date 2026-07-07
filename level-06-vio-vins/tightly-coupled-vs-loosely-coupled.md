# Tightly-coupled vs Loosely-coupled

When fusing a camera and an IMU, the first architectural decision is *where* the fusion happens.

**Loosely-coupled** systems run separate estimators — a visual odometry pipeline producing camera poses and an inertial navigation pipeline integrating IMU measurements — and then fuse their *outputs* (poses, velocities) in a second stage, typically with a Kalman filter. Each subsystem treats the other as a black box:

```
camera → [ VO pipeline ]  → pose estimate ─┐
                                           ├→ [ fusion filter ] → fused state
IMU    → [ INS integration ] → pose/vel  ──┘
```

**Tightly-coupled** systems put the *raw measurements* of both sensors into a single estimator: image feature observations (reprojection residuals) and IMU readings (preintegrated inertial residuals) are jointly optimized over one shared state containing poses, velocities, and IMU biases. Virtually all modern VIO systems — MSCKF, OKVIS, VINS-Mono, Kimera-VIO, Basalt — are tightly coupled.

## What the joint state looks like

A tightly-coupled sliding-window estimator carries, for each keyframe $i$,

$$\mathbf{x}_i = \left(\mathbf{R}_i,\; \mathbf{p}_i,\; \mathbf{v}_i,\; \mathbf{b}^g_i,\; \mathbf{b}^a_i\right)$$

plus landmark parameters (or structureless equivalents), and minimizes one cost of the form

$$\min_{\mathcal{X}} \; \|\mathbf{r}_p\|^2 \;+\; \sum_{(i,j)} \|\mathbf{r}_{\text{IMU}}(\mathbf{x}_i, \mathbf{x}_j)\|^2_{\Sigma^{-1}} \;+\; \sum_{k,i} \rho\!\left(\|\mathbf{r}_{\text{reproj}}(\mathbf{l}_k, \mathbf{x}_i)\|^2\right).$$

Both sensor modalities constrain the *same* variables in the same solve — that is the definition of tight coupling. A loosely-coupled design instead feeds the fusion filter a pose measurement $\hat{\mathbf{T}}_i$ whose internal structure (which directions were well-constrained, which features produced it) has already been compressed away.

## Comparison

| | Loosely-coupled | Tightly-coupled |
|---|---|---|
| Fusion level | Pose/velocity estimates | Raw measurements |
| Accuracy | Lower (information lost at the interface) | Higher (cross-correlations exploited) |
| Complexity | Low; subsystems reusable | High; joint state and Jacobians |
| Failure behavior | One subsystem can fail independently | Visual outliers can corrupt the joint state, but IMU also aids vision (e.g., feature prediction) |
| Bias estimation | IMU biases not observable from fused poses alone | Biases estimated jointly, constrained by vision |
| Examples | Pose-fusion EKFs (e.g., ethzasl MSF-style frameworks), classical GNSS/INS integration | MSCKF, OKVIS, VINS-Mono, Kimera-VIO, Basalt |

## Why tight coupling wins on accuracy

The cross-correlations between visual and inertial information are what make the combined system strong:

- **Vision constrains bias drift.** Gyro and accelerometer biases are only weakly observable from IMU data alone; visual constraints on the trajectory pin them down continuously.
- **The IMU constrains scale, roll, and pitch.** The accelerometer senses gravity and true acceleration, making monocular metric scale observable and giving an absolute vertical reference.
- **The IMU aids the front-end.** Integrated rotation between frames predicts where features will reappear, keeping KLT/descriptor tracking alive through fast motion and blur.
- **Uncertainty stays honest.** A loosely-coupled interface must assign the VO pose a covariance; in degenerate geometry (low parallax, pure rotation) the true error distribution is strongly anisotropic and correlated with past states — structure that a compressed pose estimate cannot carry.

## The price, and when loose coupling is right

Tight coupling demands consistent **time synchronization** (camera-IMU offset of even a few ms degrades accuracy), accurate **camera-IMU extrinsic calibration**, a careful **initialization** procedure (gravity, velocity, bias, scale), and marginalization machinery to bound the state. Loosely-coupled designs survive where modularity matters more than peak accuracy: quickly integrating an existing odometry source (wheel odometry, a proprietary VO black box, GNSS/INS), building redundant/failover architectures, or prototyping. If one subsystem's output is already near-optimal and its failure modes must stay contained, loose coupling is a legitimate engineering choice — not just a lesser one.

## Common pitfalls

- Calling a system "tightly coupled" because it uses both sensors — the test is whether *raw measurements* share one estimator, not whether both sensors are present.
- Fusing a VO pose stream with an aggressive fusion filter while ignoring the strong temporal correlation of VO errors (drift is not white noise); this makes the fused covariance wildly optimistic.
- Assuming tight coupling removes the need for good calibration — it *increases* sensitivity to extrinsic and time-offset errors, which is why modern systems estimate both online.

## Why it matters for SLAM
This distinction is the first question to ask about any VIO paper, and the same vocabulary reappears in every multi-sensor fusion context (LiDAR-visual-inertial, GNSS fusion). Understanding *why* tight coupling wins on accuracy — retained cross-sensor correlations — also explains why the field consistently moves toward joint estimation whenever compute allows.

## Related
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — the second key axis for classifying VIO systems.
- [MSCKF](msckf.md) — the classic tightly-coupled filter.
- [VINS-Mono](vins-mono.md) — the classic tightly-coupled optimizer.
- [IMU preintegration](imu-preintegration.md) — the tool that makes tightly-coupled optimization tractable.
- [Tightly-coupled LiDAR-camera](../level-09-lidar-visual-lidar-slam/tightly-coupled-lidar-camera.md) — the same concept applied to LiDAR fusion.
- [Multi-sensor calibration](../level-02-getting-familiar/multi-sensor-calibration.md) — the prerequisite tight coupling depends on.
