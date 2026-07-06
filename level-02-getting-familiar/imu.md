# IMU

An **IMU (Inertial Measurement Unit)** measures the platform's own motion: a 3-axis **accelerometer** gives linear acceleration (including gravity) and a 3-axis **gyroscope** gives angular velocity, both at high rate — typically 100–1000 Hz. It is the canonical proprioceptive sensor: it senses the body, not the world.

Three characteristics define how IMUs behave in estimation:

- **Bias**: each axis has a slowly-varying DC offset $\mathbf{b}^a, \mathbf{b}^g$ that must be estimated online — it changes with temperature and time, so a factory calibration is never enough.
- **Noise**: white Gaussian noise on every measurement axis.
- **Integration drift**: to get pose from an IMU you integrate — once for orientation and velocity, twice for position. Small errors (noise, residual bias, gravity misalignment) accumulate rapidly, so pure inertial dead-reckoning with a consumer MEMS IMU diverges within seconds.

This is why an IMU alone cannot do SLAM, but an IMU *paired with a camera* is one of the most successful sensor combinations in robotics. The two are perfectly complementary:

| | Camera | IMU |
|---|---|---|
| Rate | 10–60 Hz | 100–1000 Hz |
| Measures | External world (drift-correcting) | Self-motion (drifting) |
| Fails when | Fast motion, blur, darkness, low texture | Never "fails," but drifts |
| Scale | Unobservable (monocular) | Observable (via accelerometer) |

The IMU bridges the gaps between camera frames, predicts motion for feature tracking, makes metric scale and gravity direction observable, and rides through short visual outages; the camera in turn keeps the IMU's biases estimated and its drift in check.

In the SLAM formulation, IMU measurements enter the *motion model*: $\mathbf{x}_{t+1} = f(\mathbf{x}_t, \mathbf{u}_t) + \mathbf{w}_t$, with the state extended to include velocity and biases. Because hundreds of IMU samples arrive between keyframes, modern systems use **preintegration**: measurements between two keyframes are accumulated into a single relative-motion constraint, compensating for bias and gravity, so the optimizer touches one factor instead of a thousand raw samples. This topic — along with noise models, kinematics, and observability — is the heart of Level 6 (VIO/VINS).

## Why it matters for SLAM

Virtually every deployed visual tracking system — phone AR, drones, headsets, robot vacuum navigation — is visual-*inertial*, not vision-only, because the IMU is what makes tracking robust at real-world motion speeds and metric in scale. Understanding what an IMU measures, how its errors behave, and why integration drifts is the prerequisite for everything in the VIO level.

## Related

- [Proprioceptive sensor](proprioceptive-sensor.md)
- [IMU noise model](../level-06-vio-vins/imu-noise-model.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Introduction to Inertial Navigation](../level-06-vio-vins/introduction-to-inertial-navigation.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
