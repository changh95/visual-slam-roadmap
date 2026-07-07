# IMU

An **IMU (Inertial Measurement Unit)** measures the platform's own motion: a 3-axis **accelerometer** gives linear acceleration (including gravity) and a 3-axis **gyroscope** gives angular velocity, both at high rate — typically 100–1000 Hz. It is the canonical proprioceptive sensor: it senses the body, not the world.

## What the IMU actually measures

The standard measurement models, written in the body frame $B$ with world frame $W$:

$$
\boldsymbol{\omega}_m = \boldsymbol{\omega} + \mathbf{b}^g + \mathbf{n}^g, \qquad
\mathbf{a}_m = R_{BW}\,(\mathbf{a}_W - \mathbf{g}_W) + \mathbf{b}^a + \mathbf{n}^a
$$

Two things surprise newcomers. First, the accelerometer measures **specific force**, not acceleration: gravity is always in the measurement, which is why a stationary IMU reads about $9.81\,\text{m/s}^2$ upward rather than zero. This is a curse (gravity must be tracked and subtracted before integrating) and a blessing (the gravity direction makes roll and pitch observable). Second, every axis carries a **bias** — a slowly-varying offset that changes with temperature and time, so a factory calibration is never enough and $\mathbf{b}^a, \mathbf{b}^g$ are estimated online as part of the SLAM state.

Three characteristics define how IMUs behave in estimation:

- **Bias**: the slowly-varying DC offsets $\mathbf{b}^a, \mathbf{b}^g$ above, typically modeled as random walks.
- **Noise**: white Gaussian noise on every measurement axis. (Noise densities and bias instability are characterized with an Allan variance analysis — covered in the IMU noise model note at Level 6.)
- **Integration drift**: to get pose from an IMU you integrate — once for orientation and velocity, twice for position — so errors accumulate rather than average out.

## Why dead reckoning diverges

Follow the integration chain and the failure mode becomes concrete. Orientation comes from integrating the gyro; velocity and position come from rotating the measured specific force into the world frame, adding gravity back, and integrating twice:

- A **gyro bias** error makes the orientation error grow roughly linearly with time.
- An orientation (tilt) error misaligns the gravity subtraction, so a component of $g$ "leaks" into the estimated horizontal acceleration — a constant fake acceleration, whose double integration grows **quadratically** in time.
- An **accelerometer bias** $b$ alone contributes a position error of order $\tfrac{1}{2} b t^2$ — quadratic again.

This is why pure inertial dead-reckoning with a consumer MEMS IMU diverges within seconds, while navigation-grade units (with bias stability orders of magnitude better) can dead-reckon far longer — at orders-of-magnitude higher cost, size, and power.

## The camera-IMU marriage

An IMU alone cannot do SLAM, but an IMU *paired with a camera* is one of the most successful sensor combinations in robotics. The two are perfectly complementary:

| | Camera | IMU |
|---|---|---|
| Rate | 10–60 Hz | 100–1000 Hz |
| Measures | External world (drift-correcting) | Self-motion (drifting) |
| Fails when | Fast motion, blur, darkness, low texture | Never "fails," but drifts |
| Scale | Unobservable (monocular) | Observable (via accelerometer) |

The IMU bridges the gaps between camera frames, predicts motion for feature tracking, makes metric scale and gravity direction observable, and rides through short visual outages; the camera in turn keeps the IMU's biases estimated and its drift in check.

## How IMU data enters the estimator

In the SLAM formulation, IMU measurements enter the *motion model*: $\mathbf{x}_{t+1} = f(\mathbf{x}_t, \mathbf{u}_t) + \mathbf{w}_t$, with the state extended to include velocity and biases. Because hundreds of IMU samples arrive between keyframes, modern systems use **preintegration**: measurements between two keyframes are accumulated into a single relative-motion constraint, compensating for bias and gravity, so the optimizer touches one factor instead of a thousand raw samples — and the factor can be cheaply corrected when the bias estimate changes, without re-integrating. This topic — along with noise models, kinematics, and observability — is the heart of Level 6 (VIO/VINS).

Practical notes that matter before Level 6: camera-IMU fusion is only as good as the **extrinsic calibration** (the rigid transform between camera and IMU) and the **time synchronization** between the two sensor clocks — both are estimated with tools like Kalibr, and both are classic sources of mysterious VIO failures.

## Why it matters for SLAM

Virtually every deployed visual tracking system — phone AR, drones, headsets, robot vacuum navigation — is visual-*inertial*, not vision-only, because the IMU is what makes tracking robust at real-world motion speeds and metric in scale. Understanding what an IMU measures, how its errors behave, and why integration drifts is the prerequisite for everything in the VIO level.

## Related

- [Proprioceptive sensor](proprioceptive-sensor.md)
- [IMU noise model](../level-06-vio-vins/imu-noise-model.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Introduction to Inertial Navigation](../level-06-vio-vins/introduction-to-inertial-navigation.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
