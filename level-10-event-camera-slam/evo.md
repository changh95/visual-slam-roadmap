# EVO

> Rebecq 2017 · [Paper](https://rpg.ifi.uzh.ch/docs/RAL16_EVO.pdf)

**One-line summary** — EVO is the pioneering event-based visual odometry system: a geometric parallel tracking-and-mapping pipeline that estimates 6-DoF camera motion and reconstructs semi-dense 3D structure from an event stream alone, in real time on a CPU.

## Problem

Before EVO, event-based ego-motion estimation was largely confined to restricted settings — rotation-only motion, planar scenes, known maps, or pipelines that first reconstructed intensity images and then ran conventional vision on them. What was missing was a system that handles general 6-DoF motion in unknown natural scenes using *only* events: no frames, no depth sensor, and no intensity reconstruction as an intermediate step. The core difficulty is that events carry no absolute brightness, so neither classical feature matching nor photometric alignment applies directly.

## Key ideas

- **PTAM-style architecture for events**: like classic keyframe SLAM, EVO splits the problem into a tracking thread and a mapping thread that run in parallel, but both operate on event data instead of frames — evidence that the classical decomposition survives the change of sensor.
- **Tracking by image-to-model alignment**: recent events are aggregated into an event image (a picture of the currently moving edges), which is registered against a projection of the existing semi-dense 3D edge map to recover the current pose — a *geometric* alignment rather than a photometric one, since events carry no absolute intensity.
- **Mapping from events**: depth is estimated by aggregating events across many viewpoints along the trajectory (a space-sweep style approach), producing semi-dense depth maps of the intensity edges that generate events — no intensity reconstruction is required.
- **Events only, real time**: the system demonstrates that events alone suffice for metric-quality odometry and 3D reconstruction, running in real time on a standard CPU.
- **Robust where frames fail**: because the input has microsecond latency, no motion blur, and high dynamic range, EVO operates in high-speed and HDR conditions that defeat frame-based VO.

## Results & impact

- Published in RA-L (2017) by the Robotics and Perception Group at UZH, EVO was the first demonstration that a complete tracking-and-mapping loop can run on events alone, in real time, for general 6-DoF motion in unknown scenes.
- Qualitative demonstrations in high-speed and HDR conditions showed the system operating exactly where frame-based VO breaks — the result that made the robotics community take event cameras seriously as a SLAM sensor.
- Its architecture became the template that the field iterated on: ESVO carries the tracking-and-mapping split to stereo, Ultimate-SLAM adds frames and IMU on top, and learned systems (DEVO) use the classical event pipelines it started as their baselines.

## Why it matters for SLAM

EVO established the template for event-based SLAM: it showed that the classical tracking-and-mapping decomposition survives the transition to a radically different sensor, provided the front-end is redesigned around event geometry. Nearly every subsequent event odometry system positions itself relative to EVO — ESVO extends the idea to stereo (fixing monocular scale ambiguity), Ultimate-SLAM adds frames and IMU for robustness across all conditions, and learned systems like DEVO use it as the classical baseline to beat.

## Related

- [ESVO](esvo.md)
- [EDS](eds.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [PTAM](../level-03-monocular-slam/ptam.md)
- [Event-based Vision Survey](event-based-vision-survey.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
