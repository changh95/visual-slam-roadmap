# EDS

> Hidalgo-Carrió 2022 · [Paper](https://rpg.ifi.uzh.ch/docs/CVPR22_Hidalgo.pdf)

**One-line summary** — EDS (Event-aided Direct Sparse Odometry) integrates event data into a DSO-style direct sparse odometry framework, using events to keep photometric tracking alive in the "blind time" between frames where fast motion or HDR conditions break frame-only direct VO.

## Problem

DSO is one of the most accurate frame-based VO systems, thanks to photometric bundle adjustment over a sparse set of high-gradient points — but its tracking assumes consecutive frames overlap enough for photometric alignment. That assumption breaks under fast camera motion (large inter-frame displacement), motion blur, and HDR scenes where saturated regions erase the gradients the method depends on. Events carry exactly the missing signal in those gaps, but they cannot be plugged in naively: DSO's energy is written over absolute image intensity, while events encode brightness *changes*. EDS supplies the principled conversion between the two.

## Key ideas

- **Direct methods meet events**: DSO achieves excellent accuracy through photometric bundle adjustment over sparse high-gradient points, but its frame-to-frame photometric alignment fails when inter-frame motion is large, frames are blurred, or the scene saturates. Events — blur-free, HDR, microsecond-latency — carry exactly the signal missing between frames.
- **Warped event images bridge the modality gap**: events accumulated since the last keyframe are warped into the keyframe's coordinate system using the current pose estimate and DSO's depth map, producing an event image that approximates the temporal brightness change $\partial I / \partial t$. The events observed over an interval should match the intensity change predicted from the image gradients and the camera motion — which makes events usable inside a direct photometric objective.
- **Combined tracking energy**: the tracking objective combines DSO's standard photometric term with an event term, $E_{\text{total}} = \lambda_f E_{\text{frame}} + \lambda_e E_{\text{event}}$ — with $\lambda_f = 0$ between frames (event-only tracking) and $\lambda_f > 0$ when a good frame arrives. The two sources combine in a single direct framework rather than as separate systems.
- **Keyframe machinery retained**: DSO's sparse point selection, sliding-window photometric BA, and marginalization are kept unchanged — events only affect tracking between keyframes — so EDS inherits the accuracy characteristics of direct sparse VO while gaining event robustness.
- **New benchmark data**: the work also introduced a dedicated event+frame dataset for evaluating this class of hybrid systems.

## Results & impact

- On fast sequences where frame-only DSO loses tracking entirely, EDS keeps tracking; on ordinary sequences it matches DSO's accuracy closely while adding only a small per-frame overhead — you pay for event robustness almost nothing when it isn't needed.
- On HDR sequences (e.g., indoor–outdoor transitions), EDS substantially reduces the rate of tracking loss compared to DSO.
- The warp-based event-image generation is a general technique: it provides a blueprint for retrofitting event support onto any frame-based direct VO system, not just DSO.
- Published at CVPR 2022, it is the reference "events + direct methods" system, completing the trilogy alongside EKLT (events + feature tracking) and Ultimate-SLAM (events + tightly-coupled VIO).

## Why it matters for SLAM

EDS is the direct-method counterpart of the "events as enhancement" philosophy: where EKLT augments feature tracking and Ultimate-SLAM augments a feature-based VIO back-end, EDS shows the same complementarity holds for photometric, direct odometry. It demonstrated that a mature frame-based system can adopt events with targeted changes rather than a redesign — a blueprint for retrofitting event robustness onto existing direct SLAM pipelines.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [Event representations](event-representations.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
