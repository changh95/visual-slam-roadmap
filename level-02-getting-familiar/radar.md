# RADAR

**RADAR** (Radio Detection and Ranging) emits radio waves — millimetre-wave (mmWave) in automotive sensors — and measures the reflections. For each detection it returns **range** and, thanks to the Doppler effect, **radial velocity**: how fast the target is moving towards or away from the sensor. That per-detection velocity is something neither cameras nor LiDAR provide directly.

Where RADAR sits among exteroceptive sensors:

| Property | RADAR | LiDAR | Camera |
|---|---|---|---|
| Rain / fog / dust / snow | Robust | Degrades | Degrades |
| Darkness | Works | Works | Fails (passive RGB) |
| Angular resolution | Low | High | High |
| Direct velocity measurement | Yes (Doppler) | No | No |
| Measurement density | Sparse, noisy | Dense | Dense |

The weaknesses shape how RADAR is used. Returns are sparse, cluttered with multipath reflections and ghost targets, and angular resolution is far below LiDAR — so a raw RADAR scan is a poor basis for detailed mapping. Instead, RADAR is almost always one input to **sensor fusion**: its range-Doppler detections are combined with wheel odometry, IMU, camera, or LiDAR data, classically through an **Extended Kalman Filter** (and increasingly through factor-graph back-ends). The Doppler velocities are particularly valuable — with enough detections of the static world, the sensor's own ego-velocity can be estimated from a single scan, and moving objects can be separated from the static background before mapping.

Modern **4D imaging RADARs** add elevation and much denser point clouds, and RADAR-only odometry/SLAM (both spinning and automotive RADAR) is an active research area, attractive exactly where cameras and LiDAR fail: fire smoke, dusty mines, heavy weather, and long highway ranges.

## How the measurements arise (FMCW in one paragraph)

Automotive RADARs are typically **FMCW** (frequency-modulated continuous wave): the sensor transmits a "chirp" whose frequency ramps linearly, and mixes the echo with the outgoing signal. The **range** is encoded in the beat frequency between the two (proportional to the round-trip delay), and the **radial velocity** in the Doppler shift observed across consecutive chirps — for wavelength $\lambda$, a target closing at radial speed $v_r$ shifts the return by $f_d = 2 v_r / \lambda$. Angle comes from an antenna array (phase differences across receivers), which is exactly why angular resolution is the weak axis: it is limited by the physical aperture, a few centimetres on a bumper-mounted sensor. Processing the chirp data yields the *range-Doppler-angle* detections that arrive as a sparse "point cloud" with per-point velocity.

## Doppler ego-velocity: the free odometry measurement

The Doppler channel makes a single RADAR scan surprisingly informative. For a *static* point of the world seen along unit direction $\mathbf{d}_i$ from a sensor moving with velocity $\mathbf{v}$, the measured radial velocity is

$$v_{r,i} = -\,\mathbf{d}_i^{T} \mathbf{v}.$$

Each static detection gives one linear equation in the three unknowns of $\mathbf{v}$; with three or more well-spread static detections, least squares recovers the full ego-velocity from *one scan*, no correspondences or scan matching needed. Because moving objects violate the equation, running this inside RANSAC does two jobs at once: it estimates ego-motion from the static-world consensus set *and* labels the outliers as moving objects — a clean dynamic/static segmentation that camera and LiDAR pipelines have to work much harder for. This "Doppler odometry" is the standard entry point for RADAR-inertial odometry.

## Common pitfalls

- **Treating RADAR points like LiDAR points** — a RADAR detection is a processed peak in a range-Doppler-angle spectrum, not a surface sample; naive ICP on RADAR "point clouds" fights sparsity, clutter, and huge angular uncertainty.
- **Multipath and ghost targets** — radio waves bounce off guardrails, trucks, and tunnel walls, producing detections *behind* or *beside* real objects; robust association and outlier gating are mandatory.
- **Forgetting Doppler is radial only** — a target moving perpendicular to the line of sight has zero Doppler; tangential motion is invisible to a single scan.
- **Anisotropic noise** — range is measured far more precisely than azimuth (and elevation, if present); using an isotropic covariance throws away the sensor's best axis and over-trusts its worst.
- **Extrinsic and mounting errors** — the ego-velocity equation above assumes the sensor's direction vectors are correct; a small mounting-angle error biases every velocity estimate, so RADAR extrinsic calibration matters as much as camera-IMU calibration.

## Why it matters for SLAM

RADAR is the all-weather sensor: when perception must keep working in rain, fog, dust, or darkness, it is often the only exteroceptive sensor still returning useful data. For SLAM engineers in automotive and field robotics, that makes RADAR fusion — and understanding its unusual noise characteristics and Doppler measurements — an increasingly demanded skill.

## Related

- [LiDAR](lidar.md)
- [Sonar](sonar.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)
- [Multi-sensor calibration](multi-sensor-calibration.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
