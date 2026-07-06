# ESVO

> Zhou 2021 · [Paper](https://arxiv.org/abs/2007.15548)

**One-line summary** — ESVO is the first event-based *stereo* visual odometry system, using a parallel tracking-and-mapping design where stereo baselines resolve the depth/scale ambiguity of monocular event VO, running in real time on a CPU.

## Key ideas

- **Stereo event rig**: two event cameras with a known baseline provide metric depth without an IMU — removing the scale ambiguity inherent in monocular event odometry (EVO). The catch is that left and right event streams are asynchronous and fire at different rates, so classical synchronized stereo matching does not apply.
- **Mapping via spatio-temporal consistency**: semi-dense depth is estimated by finding, for each pixel, the depth hypothesis most consistent with the event streams of both cameras over a time window — exploiting the temporal signature of events across the stereo pair instead of matching intensity patches.
- **Probabilistic depth fusion**: per-observation depth estimates are fused over time with a probabilistic filter, rejecting outliers and steadily improving the semi-dense map's coverage and accuracy.
- **Tracking by map registration**: the current pose is recovered by registering recent event data (via time-surface representations) against the semi-dense 3D map — the classic tracking-and-mapping split adapted to event data.
- **Real-time on CPU, open source**: the full pipeline runs in real time without a GPU, and the code and datasets were released, making it the standard stereo event VO baseline.

## Why it matters for SLAM

ESVO demonstrated that the stereo recipe that matured frame-based SLAM (metric scale from a baseline, no IMU required) transfers to event cameras — but only after rethinking stereo matching around event timing rather than intensity. It handles the low-light and HDR scenarios event cameras are meant for, and directly motivated ESVIO, which adds inertial fusion on top of the stereo event design. It remains the reference point that newer systems, including learned ones like DEVO, compare against.

## Related

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [Event representations](event-representations.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
