# EKLT

> Gehrig 2020 · [Paper](https://rpg.ifi.uzh.ch/docs/IJCV19_Gehrig.pdf)

**One-line summary** — EKLT brings Lucas-Kanade (KLT) style feature tracking to event cameras: features are initialized on standard frames and then tracked asynchronously between frames using events, giving high-rate, blur-free tracks that plug into conventional feature-based pipelines.

## Problem

KLT tracking is the workhorse front-end of feature-based VO/VIO (VINS-Mono, MSCKF, ORB-SLAM-style pipelines): it tracks feature patches between consecutive frames by minimizing photometric error under a brightness-constancy assumption. At high speeds this breaks down — features move many pixels between 30–120 Hz frames, motion blur destroys the patch appearance, and the iterative minimization diverges. Events fire with microsecond latency and no blur, carrying exactly the missing inter-frame motion signal, but they are sparse and asynchronous — not the image arrays standard KLT consumes. EKLT reformulates KLT so the event stream itself drives the patch update.

## Key ideas

- **Generative event model**: the core insight is that the events fired around a feature patch are predictable from the frame's image gradient and the patch's motion — moving edges generate events in a pattern determined by $\nabla I$ and the optical flow. EKLT exploits this by comparing a *predicted* brightness-increment patch (from the frame gradient and a motion hypothesis) with the *observed* increment accumulated from events.
- **Asynchronous photometric alignment**: the feature's warp parameters are updated by minimizing the mismatch between predicted and observed event patches — a KLT-style Gauss–Newton optimization that runs whenever enough events (on the order of a hundred to a thousand) have accumulated near the feature, decoupling tracking rate from the camera frame rate.
- **Frames and events in their best roles**: standard frames provide well-textured reference patches and easy corner detection (Harris/Shi–Tomasi); events provide the high-speed motion signal between frames. When a new frame arrives, features whose event tracking has degraded are re-initialized from it. Each modality does what it is good at.
- **Warp estimation, not just translation**: the alignment estimates a parametric patch warp (translation plus rotation), so tracks stay consistent under the patch deformations that fast motion induces.
- **Drop-in front-end**: because the output is ordinary sub-pixel feature tracks, EKLT can feed standard feature-based estimators without architectural changes to the back-end.

## Results & impact

- At moderate speeds EKLT is comparable to frame-based KLT; at high speeds — where blur sharply cuts KLT track lifetimes — EKLT maintains the large majority of its tracks, with sub-pixel mean tracking error.
- Because updates run at the event packet rate rather than the frame rate, effective tracking rates in the hundreds to ~1000 Hz range are achievable — an order of magnitude beyond frame-based front-ends.
- Published in IJCV (2020), EKLT established the "predict events from frame gradients, align against observed events" paradigm for asynchronous feature tracking, and became the standard event-based feature tracker to compare against.
- Its practical significance is architectural: it upgrades only the tracking component of a classical pipeline, making it the most direct path for event cameras into existing feature-based SLAM systems.

## Why it matters for SLAM

EKLT is the most practical entry point for event cameras into existing SLAM systems: rather than replacing the whole pipeline, it upgrades only the feature tracker, extending a classical VIO front-end into speed regimes where frame-based KLT loses its tracks. It also crystallized the "events + frames are complementary" principle at the feature level, the same philosophy Ultimate-SLAM applies at the estimator level and EDS applies to direct methods.

## Related

- [EVO](evo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [ESVIO](esvio.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [Event cameras (DVS)](event-cameras-dvs.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
