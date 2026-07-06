# EDS

> Hidalgo-Carrió 2022 · [Paper](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf)

**One-line summary** — EDS (Event-aided Direct Sparse Odometry) integrates event data into a DSO-style direct sparse odometry framework, using events to keep photometric tracking alive in the "blind time" between frames where fast motion or HDR conditions break frame-only direct VO.

## Key ideas

- **Direct methods meet events**: DSO achieves excellent accuracy through photometric bundle adjustment over sparse high-gradient points, but its frame-to-frame photometric alignment fails when inter-frame motion is large, frames are blurred, or the scene saturates. Events — blur-free, HDR, microsecond-latency — carry exactly the signal missing between frames.
- **Bridging the modality gap**: events encode brightness *changes* while DSO's energy is written over absolute intensity. EDS links the two through a brightness-increment model: the events accumulated over an interval should match the intensity change predicted from the image gradients and the camera motion, which makes events usable inside a direct photometric objective.
- **Event-based tracking between frames**: between (and in place of degraded) frames, camera pose is estimated directly from events against the photometric map; when good frames arrive, standard direct alignment resumes — the two sources combine in a single direct framework rather than as separate systems.
- **Keyframe machinery retained**: DSO's sparse point selection, sliding-window photometric BA, and marginalization are kept, so EDS inherits the accuracy characteristics of direct sparse VO while gaining event robustness.
- **New benchmark data**: the work also introduced a dedicated event+frame dataset for evaluating this class of hybrid systems.

## Why it matters for SLAM

EDS is the direct-method counterpart of the "events as enhancement" philosophy: where EKLT augments feature tracking and Ultimate-SLAM augments a feature-based VIO back-end, EDS shows the same complementarity holds for photometric, direct odometry. It demonstrated that a mature frame-based system can adopt events with targeted changes rather than a redesign — a blueprint for retrofitting event robustness onto existing direct SLAM pipelines.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
