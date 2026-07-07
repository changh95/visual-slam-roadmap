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

## Measurement models

The standard IMU measurement model makes the noise structure explicit. With body frame $B$, world frame $W$, and $R_{WB}$ the body orientation:

$$\boldsymbol{\omega}_m = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{n}^g, \qquad \mathbf{a}_m = R_{WB}^T(\mathbf{a}_W - \mathbf{g}) + \mathbf{b}^a + \mathbf{n}^a$$

Three things to notice. The accelerometer measures **specific force**, not acceleration: gravity $\mathbf{g}$ appears inside the model, so an IMU sitting still reads $\approx 9.81\,\text{m/s}^2$ upward, and orientation error leaks gravity into the estimated acceleration — a $1°$ tilt error injects a phantom horizontal acceleration of $9.81 \sin(1°) \approx 0.17\,\text{m/s}^2$, which double-integrates into metres within seconds. The noises $\mathbf{n}$ are modelled as white Gaussian; the biases $\mathbf{b}$ as slow random walks, which is why estimators carry bias states and update them continuously. And everything is expressed in the body frame — using it requires the very orientation you are trying to estimate, which is what couples inertial navigation into one joint estimation problem.

For wheel encoders on a differential-drive base (wheel radius $r$, wheel separation $L$, measured wheel rates $\omega_l, \omega_r$):

$$v = \frac{r(\omega_r + \omega_l)}{2}, \qquad \omega = \frac{r(\omega_r - \omega_l)}{L},$$

with noise dominated not by the encoder resolution (which is excellent) but by *model violations*: slip, skid, uneven ground, tyre compression — errors that are systematic and terrain-dependent rather than white.

## How fast do they drift?

A useful back-of-envelope hierarchy: gyroscope-only orientation drifts linearly with time; velocity from an accelerometer drifts linearly (plus orientation-induced gravity leakage); position drifts quadratically from accelerometer error and *cubically* from gyro-induced tilt error. This is why consumer MEMS IMUs cannot provide standalone position for more than a few seconds, while tactical/navigation-grade units (fibre-optic gyros) hold for minutes to hours — at orders of magnitude more cost, size, and power. Wheel odometry drifts with *distance travelled* rather than time, so a stationary wheeled robot doesn't drift at all — one reason wheel+IMU fusion is so effective indoors.

## Common pitfalls

- **Ignoring biases** — treating $\mathbf{a}_m, \boldsymbol{\omega}_m$ as bias-free measurements works on a datasheet and fails on a robot; biases change with temperature and from power-cycle to power-cycle, so they must be states, not constants.
- **Bad gravity initialization** — VIO systems estimate initial orientation from accelerometer gravity while stationary; initializing while moving (or on a vibrating platform) corrupts the tilt estimate and everything downstream.
- **Vibration and aliasing** — motors and propellers inject vibration above the IMU's sampling assumptions; mechanical damping and appropriate low-pass filtering matter as much as algorithms.
- **Kinematic parameters are calibration too** — wheel radius and wheel base errors produce systematic curvature in "straight" trajectories; calibrate them (and re-calibrate when tyres change).

## Why it matters for SLAM

Almost every deployed SLAM system is proprioceptive + exteroceptive fusion: VIO on phones and headsets (camera + IMU), wheel-inertial odometry on warehouse robots, LiDAR-inertial odometry on cars. Knowing what proprioceptive sensors measure, how fast they drift, and how their noise is modelled is prerequisite for understanding Kalman-filter and factor-graph fusion at Level 6.

## Related

- [Exteroceptive sensor](exteroceptive-sensor.md)
- [IMU](imu.md)
- [Odometry](odometry.md)
- [IMU noise model](../level-06-vio-vins/imu-noise-model.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
