# ESVO

> Zhou 2021 · [Paper](https://arxiv.org/abs/2007.15548)

**One-line summary** — ESVO is the first event-based *stereo* visual odometry system, using a parallel tracking-and-mapping design where stereo baselines resolve the depth/scale ambiguity of monocular event VO, running in real time on a CPU.

## Problem

Monocular event VO (EVO) recovers pose only up to scale; a stereo rig with a known baseline provides absolute metric depth without an IMU. But stereo matching for event cameras is non-trivial: the left and right event streams are asynchronous, fire at different rates, and carry no intensity to correlate — classical synchronized intensity-patch matching simply does not apply. ESVO set out to solve visual odometry from a stereo event rig with solutions that are both principled and efficient, targeting real-time operation on commodity hardware.

## Key ideas

- **Stereo event rig**: two event cameras with a known baseline provide metric depth without an IMU — removing the scale ambiguity inherent in monocular event odometry (EVO). The system follows the classic parallel tracking-and-mapping decomposition, with novel solutions to each subproblem.
- **Mapping via spatio-temporal consistency**: semi-dense depth is estimated by finding, for each pixel, the depth hypothesis most consistent with the event streams of both cameras over a time window — exploiting the temporal signature of events across the stereo pair instead of matching intensity patches.
- **Probabilistic depth fusion**: per-observation depth estimates from multiple local viewpoints are fused over time in a probabilistic fashion (a Gaussian depth filter), rejecting outliers and steadily improving the semi-dense map's coverage and accuracy.
- **Tracking by map registration**: the current pose of the stereo rig is recovered by solving a registration problem that arises naturally from the chosen map and event representation — recent event data (via time surfaces) is aligned against the semi-dense 3D map.
- **Simple, efficient representations**: the design goal throughout is to maximize the spatio-temporal consistency of stereo event data while keeping the representation simple enough for real-time CPU operation.

## Results & impact

- Experiments on publicly available datasets and the authors' own recordings demonstrate the system's versatility in natural scenes under general 6-DoF motion.
- ESVO successfully leverages event cameras' advantages to perform VO in challenging illumination — low-light and HDR conditions — while running in real time on a standard CPU, without GPU acceleration.
- The software and dataset were released open source (published in T-RO, 2021), making ESVO the standard stereo event VO baseline and a catalyst for research in event-based SLAM.
- It directly motivated ESVIO, which adds tightly-coupled IMU and image fusion on top of the stereo event design, and it remains a reference point that newer systems — including learned ones like DEVO — compare against.

## Why it matters for SLAM

ESVO demonstrated that the stereo recipe that matured frame-based SLAM (metric scale from a baseline, no IMU required) transfers to event cameras — but only after rethinking stereo matching around event timing rather than intensity. It handles the low-light and HDR scenarios event cameras are meant for, and directly motivated ESVIO, which adds inertial fusion on top of the stereo event design. It remains the reference point that newer systems, including learned ones like DEVO, compare against.

## Related

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [Event representations](event-representations.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
