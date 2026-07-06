# Stereo DSO

> Wang 2017 · [Paper](https://arxiv.org/abs/1708.07878)

**One-line summary** — Stereo DSO extends DSO's direct sparse photometric bundle adjustment to stereo cameras, using static stereo disparity for immediate metric depth on close points while retaining temporal multi-view refinement for distant ones — yielding highly accurate large-scale direct stereo odometry.

## Key ideas

- **Two kinds of photometric constraints**: *temporal* residuals between keyframes (as in monocular DSO) are combined with *static stereo* residuals between the left and right images of the same frame, coupled in one windowed photometric bundle adjustment: $E = \sum_{\text{temporal}} e_{\text{photo}}^2 + \lambda \sum_{\text{stereo}} e_{\text{stereo}}^2$.
- **Close/far dual point handling**: points with sufficient disparity are initialized from stereo depth with high confidence; far points (negligible disparity) start from the monocular depth filter and converge through temporal observations — so the system exploits stereo where it is informative and monocular geometry where it is not.
- **Metric scale from frame one**: the fixed baseline removes DSO's scale ambiguity and scale drift, and eliminates the slow monocular bootstrapping phase.
- **Full photometric model**: both cameras use DSO's photometric calibration (response function, vignetting, exposure), which is essential for the brightness-constancy assumption behind direct methods.
- Strong results on KITTI odometry, outperforming feature-based stereo baselines of the time while producing denser point clouds than sparse feature maps.

## Why it matters for SLAM

Stereo DSO showed that direct methods are not confined to small indoor scenes: with a stereo rig they achieve state-of-the-art large-scale outdoor odometry. Its dual close/far treatment became a standard design pattern for stereo direct systems, and the "virtual stereo" idea in DVSO (CNN-predicted right images) and the inertial extension VI-DSO both build directly on this work. Study it after DSO to see how a direct pipeline absorbs a second camera.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [DVSO](../level-03-monocular-slam/dvso.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)

---
[Back to Level 7](../README.md#level-7-stereo-slam)
