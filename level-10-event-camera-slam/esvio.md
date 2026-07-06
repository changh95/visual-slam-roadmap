# ESVIO

> Chen 2023 · [Paper](https://arxiv.org/abs/2212.13184)

**One-line summary** — ESVIO is the first event-based *stereo* visual-inertial odometry system, tightly fusing stereo event streams, standard stereo images, and IMU measurements for robust state estimation in aggressive-motion and low-light conditions.

## Key ideas

- **Filling the gap in the design space**: ESVO gave stereo event odometry without IMU; Ultimate-SLAM gave monocular events+frames+IMU. ESVIO combines all the pieces — stereo metric depth, inertial robustness, and events' HDR/no-blur properties — in one tightly-coupled pipeline.
- **Temporal tracking + instantaneous matching**: the event front-end tracks features *temporally* between consecutive event windows (for motion) and matches events *instantaneously* across the left-right stereo pair (for depth), sidestepping the fact that the two event streams are asynchronous.
- **IMU-aided motion compensation**: events are warped to a common reference time using IMU-derived motion, sharpening the accumulated event edges; better event representations improve the state estimate, which in turn improves the compensation — a closed loop between front-end and back-end.
- **Two variants**: ESIO (purely event-inertial) and ESVIO (event + image aided), which isolates how much the standard images contribute on top of events and IMU.
- **Field-proven**: evaluated against image-based and event-based baselines on public and self-collected datasets, including onboard quadrotor flight in low light and large-scale outdoor experiments — deployment evidence that is still rare in the event-camera literature.

## Why it matters for SLAM

ESVIO completes the sensor-fusion lineage of event SLAM: it shows the full stereo + events + frames + IMU combination is practical on real aerial platforms, in exactly the dark and fast conditions the sensor was designed for. It is a natural study target after ESVO and Ultimate-SLAM, and its open-source release makes it a common baseline for subsequent event VIO work.

## Related

- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
