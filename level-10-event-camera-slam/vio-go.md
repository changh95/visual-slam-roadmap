# VIO-GO

> Sakhrieh 2025 · [Paper](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1541017/full)

**One-line summary** — VIO-GO wraps an event-based VIO pipeline (Ultimate SLAM) in a gradient-based parameter optimizer: Batch Gradient Descent with momentum automatically tunes front-end and back-end parameters per scenario, cutting mean position error by 60% versus fixed-parameter operation in HDR and dynamic scenes.

## Problem

Event-based VIO systems that represent events as motion-compensated edge images (Ultimate SLAM and its lineage) are notoriously sensitive to configuration: the number of events per frame, noise-rate thresholds, feature-detector settings, and back-end keyframe counts all depend on scene texture, event rate, and sensor unit. Per-sequence manual tuning produces the published headline numbers but is impractical in the field — exactly the Industry 4.0 warehouse/logistics settings with low light and fast motion where event cameras are most attractive. VIO-GO targets this quieter failure mode: not a new estimator, but automated tuning of the one we have.

## Method & architecture

- **Base estimator.** VIO-GO is implemented on top of Ultimate SLAM: the front-end builds edge images from spatiotemporal windows of motion-compensated events, detects FAST corners, and tracks them (together with standard-frame features) with the Lucas-Kanade tracker; the back-end runs keyframe-based visual-inertial nonlinear optimization whose cost combines two weighted reprojection-error terms (event-frame features and standard-frame features) and an inertial error term.
- **VIO-GO block.** An auxiliary optimization loop runs the full VIO pipeline on a sequence, measures mean position error (MPE) against ground truth, and updates the selected parameters by **Batch Gradient Descent** — gradients of the objective computed over the whole dataset for stable convergence — augmented with a **momentum** term that damps oscillations and helps escape local minima. Parameters are initialized at the upper bounds of their ranges; IMU biases are fixed from the dataset calibration.
- **Scalable parameter sets.** Four configurations are compared: VIO-GO2 (event frame size — the number of events drawn per frame — and noise event rate), VIO-GO4 (+ event packet size, frame normalization factor), VIO-GO6 (+ median landmark depth, FAST detector threshold, pyramid levels, number of back-end keyframes), and VIO-GO8 (+ keyframe-selection feature-count thresholds). The event window size is treated as the most critical knob, since it controls whether edge images are sharp or motion-blurred.

## Results

- **Benchmark**: Event Camera Dataset (DAVIS; boxes, dynamic, hdr, poster, shapes sequences), MPE (%) with SE(3) alignment over 5 s segments via the EVO tool; run on an Apple M1 laptop with Ubuntu 20.04 / ROS Noetic.
- **Parameter scaling**: average MPE drops from 0.47% (VIO-GO2) to 0.45% (GO4), 0.38% (GO6), and 0.36% (VIO-GO8) — a 24% reduction from 2 to 8 tuned parameters; on hdr_boxes the mean APE falls from 0.031 m to 0.020 m. VIO-GO8 is also fastest (16.39 s average elapsed time vs 18.98 s for GO2, a 13.6% gain) because tuned feature/keyframe thresholds cut redundant work.
- **Versus baselines**: VIO-GO8's 0.36% average MPE beats fixed-parameter Ultimate SLAM (0.89%; the abstract's 60% improvement), Rebecq 2017 events+IMU (0.43%), EKLT-VIO (0.54%), and EVIO (2.57%) — best in 7 of 10 sequences among the practical (non-hand-tuned) methods.
- Against Ultimate SLAM's *raw* per-sequence hand-tuned results (avg 0.30%), VIO-GO8 still wins on boxes_translation (0.25%), hdr_boxes (0.35%), and hdr_poster (0.25%) — while tuning automatically.

## Why it matters for SLAM

Most event-VIO papers introduce new estimators; VIO-GO instead addresses the quieter reason such systems underperform in practice — poorly matched parameters for the scenario at hand — and shows that automated tuning can recover (and in HDR scenes exceed) hand-tuned performance. For a practitioner deploying event-based VIO, it is a useful reference for which knobs dominate performance (event window size first). It sits at the applied end of the event-SLAM literature, complementing the architectural advances of ESVIO and DEVO.

## Related

- [ESVIO](esvio.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [Advantages](advantages.md)
- [Challenges](challenges.md)
