# Ultimate-SLAM

> Vidal 2018 · [Paper](https://arxiv.org/abs/1709.06310)

**One-line summary** — Ultimate-SLAM tightly fuses events, standard frames, and IMU in a single state estimation pipeline, exploiting the complementary strengths of the three sensors to stay accurate across HDR and high-speed scenarios where any one modality fails.

## Key ideas

- **Complementary sensing**: standard frames are rich and stable in good light at moderate speeds but fail under motion blur and HDR; event cameras thrive exactly there but output little during slow or near-static motion; the IMU provides high-rate dynamics but drifts. Fusing all three covers the full operating envelope.
- **Shared-optics platform**: the DAVIS sensor co-locates the event array, a standard frame sensor, and an IMU on one chip, giving perfectly registered multi-modal data — the hardware enabler for tight fusion.
- **Feature tracks from both visual modalities**: the front-end tracks features both on motion-compensated event frames and on standard frames, so visual constraints keep flowing regardless of which modality is currently informative.
- **Tightly-coupled keyframe optimization**: event-based tracks, frame-based tracks, and preintegrated IMU measurements are jointly optimized in a keyframe-based nonlinear back-end (rather than loosely combining separate pose estimates).
- **Demonstrated payoff**: the paper reports about 130% accuracy improvement over an event-only pipeline and 85% over a frames-plus-IMU pipeline, and demonstrates the first autonomous quadrotor flight using this kind of hybrid estimation in low-light and HDR conditions where frame-based VIO fails.

## Why it matters for SLAM

Ultimate-SLAM settled an early strategic question of the event-camera field: events are most powerful as a *complement* to frames and IMU, not as a wholesale replacement. Its tightly-coupled events+frames+IMU formulation became the standard template for subsequent event VIO work (ESVIO, EDS-style hybrids), and its quadrotor experiments were a landmark demonstration that event sensing extends the safe operating envelope of real robots.

## Related

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [EDS](eds.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
