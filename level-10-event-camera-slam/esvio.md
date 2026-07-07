# ESVIO

> Chen 2023 · [Paper](https://arxiv.org/abs/2212.13184)

**One-line summary** — ESVIO is the first event-based *stereo* visual-inertial odometry system, tightly fusing stereo event streams, standard stereo images, and IMU measurements for robust state estimation in aggressive-motion and low-light conditions.

## Problem

Event cameras' low-latency, asynchronous output is a great fit for state estimation in challenging situations, but although event-based visual odometry had been studied extensively, most of it was monocular — stereo event vision had seen little research. The existing design space had a hole: ESVO offered stereo event odometry without an IMU (limiting robustness to aggressive motion), while Ultimate-SLAM fused events, frames, and IMU but only monocularly (no direct metric depth). A stereo event VIO would combine stereo's instantaneous metric depth, the IMU's dynamic robustness, and events' HDR/no-blur properties in one system.

## Key ideas

- **Filling the gap in the design space**: ESVIO combines all the pieces — stereo metric depth, inertial robustness, and events' HDR/no-blur properties — in one tightly-coupled pipeline that leverages the complementary advantages of event streams, standard images, and inertial measurements.
- **Temporal tracking + instantaneous matching**: the event front-end tracks features *temporally* between consecutive stereo event streams (for motion) and matches events *instantaneously* across the left-right pair (for depth), sidestepping the fact that the two event streams are asynchronous and never fire at the same instants.
- **IMU-aided motion compensation**: each event is warped to a reference moment using IMU information and the ESVIO back-end's estimates, $\mathbf{x}_k^{\text{ref}} = \pi\!\left(\mathbf{T}(t_{\text{ref}}, t_k)\, \pi^{-1}(\mathbf{x}_k, d_k)\right)$, sharpening the accumulated scene edges. Better event representations improve the state estimate, which in turn improves the compensation — a closed loop between front-end and back-end.
- **Two variants**: ESIO (purely event-inertial) and ESVIO (event with image-aided), which isolates how much the standard images contribute on top of events and IMU.
- **Aimed at deployment**: the pipeline is designed as a real-time, accurate system for robust state estimation under challenging environments, not just a benchmark exercise.

## Results & impact

- Both ESIO (events-only) and ESVIO (image-aided) show superior performance compared with image-based and event-based baseline methods on public and self-collected datasets.
- The system flew onboard quadrotors in low-light environments, and a real-world large-scale experiment demonstrated long-term effectiveness — field evidence that is still rare in the event-camera literature.
- Published in RA-L (2023) with open-source code from the HKU MaRS Lab, it became a common baseline for subsequent event-based VIO research.
- It completed the stereo-event lineage started by ESVO, showing the full stereo events + frames + IMU combination is practical on real aerial platforms.

## Why it matters for SLAM

ESVIO completes the sensor-fusion lineage of event SLAM: it shows the full stereo + events + frames + IMU combination is practical on real aerial platforms, in exactly the dark and fast conditions the sensor was designed for. It is a natural study target after ESVO and Ultimate-SLAM, and its open-source release makes it a common baseline for subsequent event VIO work.

## Related

- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
