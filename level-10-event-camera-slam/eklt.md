# EKLT

> Gehrig 2020 · [Paper](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf)

**One-line summary** — EKLT brings Lucas-Kanade (KLT) style feature tracking to event cameras: features are initialized on standard frames and then tracked asynchronously between frames using events, giving high-rate, blur-free tracks that plug into conventional feature-based pipelines.

## Key ideas

- **Why extend KLT**: KLT tracking is the workhorse front-end of feature-based VO/VIO, but at high speeds features move many pixels between 30–120 Hz frames and blur destroys the brightness-constancy assumption. Events, firing at microsecond resolution with no blur, carry exactly the missing inter-frame motion signal.
- **Generative event model**: the core insight is that the events fired around a feature patch are predictable from the frame's image gradient and the patch's motion — moving edges generate events in a pattern determined by $\nabla I$ and the optical flow. EKLT exploits this by comparing a *predicted* brightness-increment patch (from the frame gradient and a motion hypothesis) with the *observed* increment accumulated from events.
- **Asynchronous photometric alignment**: the feature's warp parameters are updated by minimizing the mismatch between predicted and observed event patches — a KLT-style optimization that runs whenever enough events have accumulated near the feature, decoupling tracking rate from the camera frame rate.
- **Frames and events in their best roles**: frames provide well-textured reference patches and easy feature detection; events provide the high-speed motion signal between frames. Each modality does what it is good at.
- **Drop-in front-end**: because the output is ordinary sub-pixel feature tracks, EKLT can feed standard feature-based estimators without architectural changes to the back-end.

## Why it matters for SLAM

EKLT is the most practical entry point for event cameras into existing SLAM systems: rather than replacing the whole pipeline, it upgrades only the feature tracker, extending a classical VIO front-end into speed regimes where frame-based KLT loses its tracks. It also crystallized the "events + frames are complementary" principle at the feature level, the same philosophy Ultimate-SLAM applies at the estimator level and EDS applies to direct methods.

## Related

- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [ESVIO](esvio.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
