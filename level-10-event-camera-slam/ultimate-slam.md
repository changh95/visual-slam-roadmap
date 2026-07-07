# Ultimate-SLAM

> Vidal 2018 · [Paper](https://arxiv.org/abs/1709.06310)

**One-line summary** — Ultimate-SLAM tightly fuses events, standard frames, and IMU in a single state estimation pipeline, exploiting the complementary strengths of the three sensors to stay accurate across HDR and high-speed scenarios where any one modality fails.

## Problem

No single sensor covers the whole operating envelope. Standard cameras provide instant, rich information most of the time — in low-speed, well-lit scenarios — but fail severely under fast motion (blur) and difficult lighting (HDR, low light). Event cameras do not suffer from motion blur and have very high dynamic range, but output only little information when motion is limited, such as near-still hovering. The IMU provides high-rate dynamics but drifts without visual correction. Before this work, no state estimation pipeline had fused all three modalities in a tightly-coupled manner.

## Key ideas

- **Complementary sensing**: frames are rich and stable in good light at moderate speeds; events thrive exactly where frames fail and go quiet where frames are comfortable; the IMU bridges both. Fusing all three covers the full operating envelope — each modality patches the others' blind spots.
- **Shared-optics platform**: the DAVIS sensor co-locates the event array, a standard frame sensor, and an IMU on one chip with shared optics, giving perfectly registered multi-modal data — the hardware enabler for tight fusion.
- **Feature tracks from both visual modalities**: the front-end tracks features both on motion-compensated event frames and on standard frames, so visual constraints keep flowing regardless of which modality is currently informative.
- **Tightly-coupled keyframe optimization**: event-based tracks, frame-based tracks, and preintegrated IMU measurements are jointly optimized in a single keyframe-based nonlinear back-end — one factor graph over heterogeneous residuals, rather than loosely combining separate pose estimates.
- **Fusion at the estimator, not the pixel**: events are not used to reconstruct images or enhance frames; they enter the estimator as first-class measurements. This is what makes the pipeline degrade gracefully as conditions shift between the modalities' comfort zones.

## Results & impact

- On the publicly available Event Camera Dataset, the hybrid pipeline improves accuracy by about 130% over event-only pipelines and 85% over standard-frames-plus-IMU visual-inertial systems — while remaining computationally tractable.
- It demonstrated the first autonomous quadrotor flight using an event camera for state estimation, unlocking flight scenarios that were not reachable with traditional VIO, such as low-light environments and high-dynamic-range scenes.
- The tightly-coupled events+frames+IMU factor-graph formulation became the standard template for subsequent event VIO work (ESVIO and later hybrids), and the DAVIS became the community-standard platform for multi-modal event research.
- Strategically, the paper settled the "replace or complement?" debate of the early event-camera field firmly on the side of *complement*.

## Why it matters for SLAM

Ultimate-SLAM settled an early strategic question of the event-camera field: events are most powerful as a *complement* to frames and IMU, not as a wholesale replacement. Its tightly-coupled events+frames+IMU formulation became the standard template for subsequent event VIO work (ESVIO, EDS-style hybrids), and its quadrotor experiments were a landmark demonstration that event sensing extends the safe operating envelope of real robots.

## Related

- [EVO](evo.md)
- [ESVIO](esvio.md)
- [EDS](eds.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Event cameras (DVS)](event-cameras-dvs.md)

[Back to Level 10](../README.md#level-10-event-camera-slam)
