# Proprioceptive sensor

Robotic sensors split into two families. **Proprioceptive sensors** measure the robot's *internal* state — its own motion — while **exteroceptive sensors** (cameras, LiDAR, RADAR, sonar) measure the *external* environment. The two proprioceptive sensors you will meet constantly in SLAM are:

- **IMU (Inertial Measurement Unit)**: measures linear acceleration $\mathbf{a}_m$ (3-axis accelerometer) and angular velocity $\boldsymbol{\omega}_m$ (3-axis gyroscope) at high rate (100-1000 Hz). Measurements are corrupted by white noise and by slowly-varying **biases** $\mathbf{b}^a, \mathbf{b}^g$ that must be estimated online; the accelerometer also senses gravity, which must be compensated.
- **Wheel encoders**: count wheel rotations on differential-drive or Ackermann vehicles, giving linear and angular velocity through the vehicle's kinematic model. Accurate on clean indoor floors, but degraded by wheel slip, uneven terrain, and tyre deformation outdoors.

Proprioceptive measurements feed the **motion model** of a SLAM system,

$$\mathbf{x}_{t+1} = f(\mathbf{x}_t, \mathbf{u}_t) + \mathbf{w}_t, \qquad \mathbf{w}_t \sim \mathcal{N}(\mathbf{0}, Q_t),$$

predicting the next state from the current one. Their defining strengths and weakness:

| Property | Consequence |
|---|---|
| High rate, low latency | Smooth pose prediction between camera/LiDAR frames; handles fast motion and motion blur |
| Self-contained | Works in darkness, fog, texture-less scenes — no dependence on the environment |
| Relative only | Pure integration drifts: gyro errors grow with time, double-integrated accelerometer errors grow quadratically |

Because they drift but never fail, and exteroceptive sensors are accurate but can fail (blur, low texture, occlusion), the two families are natural complements — this is the entire premise of visual-inertial odometry, where IMU pre-integration accumulates hundreds of inertial measurements between keyframes into a single relative-motion constraint.

## Why it matters for SLAM

Almost every deployed SLAM system is proprioceptive + exteroceptive fusion: VIO on phones and headsets (camera + IMU), wheel-inertial odometry on warehouse robots, LiDAR-inertial odometry on cars. Knowing what proprioceptive sensors measure, how fast they drift, and how their noise is modelled is prerequisite for understanding Kalman-filter and factor-graph fusion at Level 6.

## Related

- [Exteroceptive sensor](exteroceptive-sensor.md)
- [IMU](imu.md)
- [Odometry](odometry.md)
- [IMU noise model](../level-06-vio-vins/imu-noise-model.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
