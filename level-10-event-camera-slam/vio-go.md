# VIO-GO

> Sakhrieh 2025 · [Paper](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1541017/full)

**One-line summary** — VIO-GO is a recent event-based visual-inertial odometry approach that focuses on optimizing the pipeline's parameters for high-dynamic-range (HDR) scenarios, targeting the practical tuning sensitivity that limits event VIO deployment.

## Key ideas

- **HDR as the target regime**: high dynamic range scenes (harsh sunlight, tunnels, indoor-outdoor transitions) are where event cameras hold the clearest advantage over frames, so the work optimizes an event-based VIO pipeline specifically for these conditions rather than for average-case benchmarks.
- **Parameters matter as much as architecture**: event-based pipelines are notoriously sensitive to configuration — contrast-threshold assumptions, event accumulation window sizes, and noise handling all change with the sensor and the scene. VIO-GO's contribution is in systematically optimizing these parameters instead of treating them as fixed defaults.
- **Events + IMU fusion**: as in the broader event VIO lineage (Ultimate-SLAM, ESVIO), inertial measurements anchor scale and dynamics while events supply the visual constraints that survive HDR conditions.
- **Deployability focus**: the emphasis on tuned, robust operation in adverse illumination reflects a field-wide shift from proof-of-concept event odometry toward configurations that can be trusted outside the lab.

## Why it matters for SLAM

Most event-VIO papers introduce new estimators; VIO-GO instead addresses the quieter reason such systems underperform in practice — poorly matched parameters for the scenario at hand. For a practitioner deploying event-based VIO in HDR environments, it is a useful reference for which knobs dominate performance. It sits at the applied end of the event-SLAM literature, complementing the architectural advances of ESVIO and DEVO.

## Related

- [ESVIO](esvio.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [Advantages](advantages.md)
- [Challenges](challenges.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
