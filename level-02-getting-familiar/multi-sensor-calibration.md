# Multi-sensor calibration

Modern SLAM systems rarely rely on a single sensor. A camera-IMU rig, a camera-LiDAR car, or a full camera-IMU-LiDAR-wheel platform only works if you know, precisely, how the sensors are related to each other. Multi-sensor calibration estimates two things:

- **Extrinsic calibration**: the rigid-body transformation $T_{AB} \in SE(3)$ between the frames of sensor A and sensor B (e.g. where the camera sits relative to the IMU).
- **Temporal calibration**: the time offset between sensor clocks. Sensors timestamp their data with different latencies, and even a few milliseconds of offset is fatal for a fast-moving platform.

The most common pairings and tools:

| Pairing | Typical approach | Tool |
|---|---|---|
| Camera-IMU | Continuous-time B-spline trajectory jointly fit to image and inertial data; estimates extrinsics, time offset, and IMU noise/bias parameters | [Kalibr](https://github.com/ethz-asl/kalibr) (Furgale et al., 2013) |
| Camera-LiDAR | Target-based (checkerboard corners visible to both sensors) or targetless (align planar surfaces / edges between image and point cloud) | Autoware calibration tools, and many research toolkits |
| Multi-camera | Overlapping views of a calibration target (AprilGrid/checkerboard) | Kalibr multi-cam |

A few practical notes. Camera-IMU calibration needs *excitation*: you must rotate and translate the rig aggressively on all axes so that the extrinsics and time offset become observable. Camera-LiDAR calibration is harder because the two sensors do not observe the same primitive directly — a LiDAR sees geometry, a camera sees appearance — so methods align shared structure such as planes, edges, or reflective targets. Finally, calibration is not a one-time event: mounts flex, temperatures change, and good VIO/SLAM systems (e.g. VINS-Mono, OpenVINS) refine extrinsics and time offset online.

## How the estimation actually works

**Hand-eye formulation.** The classical starting point is the hand-eye calibration equation. Move the rig through a sequence of poses; sensor A measures its own relative motions $A_k$ (e.g. camera poses from a checkerboard) and sensor B measures its own $B_k$ (e.g. integrated gyro rotation). If $X = T_{AB}$ is the fixed unknown extrinsic, every motion pair must satisfy

$$A_k X = X B_k,$$

because going "through A's motion then across the rig" must equal "across the rig then through B's motion". Stacking many motion pairs gives a solvable system — rotation first (a linear problem in quaternion or rotation-matrix form), then translation. This is also why excitation matters: if all motions are pure translations, the rotation part of $X$ never appears in the equations, and rotations about a single axis leave one degree of freedom unobservable.

**Continuous-time joint optimisation (Kalibr).** Discrete pose pairs waste information and handle asynchronous sensors poorly. Kalibr instead represents the rig trajectory as a **continuous-time B-spline** $T_{WB}(t)$, which can be evaluated — and differentiated to give angular velocity and acceleration — at *any* timestamp. One big nonlinear least-squares problem then jointly minimises:

- reprojection errors of calibration-target corners at each image timestamp,
- accelerometer residuals between spline-derived and measured acceleration (including gravity and bias),
- gyroscope residuals between spline-derived and measured angular velocity,

over the spline, the extrinsics $T_{\text{cam,imu}}$, the gravity direction, IMU biases, and the **time offset** $t_d$ — which enters simply by evaluating the spline at $t + t_d$. This is why the continuous-time formulation handles temporal calibration so naturally.

**Verifying a calibration.** Never trust a calibration you have not checked. Useful sanity checks: reprojection/residual plots from the calibration report (residuals should be white, not structured); projecting LiDAR points onto images and checking that depth edges align with intensity edges; running your VIO and watching whether the estimator's online extrinsics/time-offset states drift away from the calibrated values; and physically measuring the rig with a ruler — a camera-IMU translation that comes back 30 cm long on a 5 cm rig is wrong no matter what the optimizer says.

## Common pitfalls

- **Insufficient excitation** — smooth, slow, planar motions leave extrinsics and time offset weakly observable; Kalibr will still return numbers, just bad ones with optimistic covariances.
- **Poor time synchronisation assumptions** — hardware triggering and a shared clock beat any software fix; if you must use software timestamps, calibrate $t_d$ and expect it to change with driver/OS load.
- **Rolling shutter ignored** — fast rotation during readout distorts features; either use a global-shutter camera for calibration or a rolling-shutter-aware model.
- **Calibrating once, deploying forever** — vibration, thermal cycles, and remounting change extrinsics; recalibrate after any mechanical change and let the estimator refine online.
- **A blurry or flexing target** — the calibration is only as good as the target: print an AprilGrid rigidly mounted (glass/aluminium), keep it fully visible and in focus, and cover the whole image with observations.

## Why it matters for SLAM

Every sensor-fusion SLAM formulation — VIO, LiDAR-visual-inertial odometry, RADAR fusion — assumes measurements can be expressed in a common frame at a common time. Errors in extrinsics or time offset show up as systematic, unmodelled residuals that the optimizer tries to absorb into poses and biases, producing drift and inconsistency that no amount of tuning fixes. Getting calibration right (and knowing how to verify it) is usually the first step of any real-world SLAM deployment.

## Hands-on

- [Sensor calibration](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch04_07)
- [Kalibr hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch04_08)

## Related

- [Camera calibration](../level-01-beginner/camera-calibration.md)
- [IMU](imu.md)
- [LiDAR](lidar.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
