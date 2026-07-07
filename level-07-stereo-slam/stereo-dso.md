# Stereo DSO

> Wang 2017 · [Paper](https://arxiv.org/abs/1708.07878)

**One-line summary** — Stereo DSO extends DSO's direct sparse photometric bundle adjustment to stereo cameras, using static stereo disparity for immediate metric depth on close points while retaining temporal multi-view refinement for distant ones — yielding highly accurate large-scale direct stereo odometry.

## Problem

Monocular direct methods like DSO accumulate scale drift, and direct image alignment has two further known shortcomings: sensitivity to large optical flow (fast motion makes the photometric linearization break down) and to rolling-shutter effects. For highly accurate real-time visual odometry in large-scale environments — the autonomous-driving regime — these weaknesses had kept direct methods behind feature-based stereo pipelines. Stereo DSO asks how a fixed-baseline stereo rig can be integrated into direct sparse bundle adjustment to fix all three issues at once.

## Key ideas

- **Two kinds of photometric constraints**: *temporal* residuals between keyframes (as in monocular DSO) are combined with *static stereo* residuals between the left and right images of the same instant, coupled in one windowed photometric bundle adjustment: $E = \sum_{\text{temporal}} e_{\text{photo}}^2 + \lambda \sum_{\text{stereo}} e_{\text{stereo}}^2$. Integrating static-stereo constraints into the bundle adjustment of temporal multi-view stereo is the paper's core technical contribution.
- **Everything in the window is optimized jointly**: the active window optimizes all model parameters together — the intrinsic/extrinsic camera parameters of all keyframes and the depth values of all selected pixels — rather than fixing geometry while tracking poses.
- **Close/far dual point handling**: points with sufficient disparity are initialized from stereo depth with high confidence; far points (negligible disparity) start from the monocular depth filter and converge through temporal observations — so the system exploits stereo where it is informative and monocular geometry where it is not.
- **Metric scale from frame one, no scale drift**: the fixed baseline removes DSO's scale ambiguity and its slow monocular bootstrapping phase; it also reduces the sensitivity to large optical flow and rolling shutter that plagues purely temporal direct alignment.
- **Real time via gradient-based pixel selection**: candidate pixels are sampled uniformly from image regions with sufficient intensity gradient, keeping the point set sparse enough for real-time optimization while covering the whole image.
- **Full photometric model**: both cameras use DSO's photometric calibration (response function, vignetting, exposure), which is essential for the brightness-constancy assumption behind direct methods.

## Results & impact

The paper's quantitative evaluation shows Stereo DSO outperforming existing state-of-the-art visual odometry methods in both tracking accuracy and robustness, with experiments on large-scale driving benchmarks (KITTI-style sequences). It also delivers a more precise metric 3D reconstruction than previous dense/semi-dense direct approaches while providing higher reconstruction density than feature-based methods — a sweet spot between sparse feature maps and expensive dense mapping. The close/far point treatment and the static-plus-temporal stereo coupling became standard design patterns, reused by the "virtual stereo" of DVSO and complementing the inertial extension VI-DSO.

## Why it matters for SLAM

Stereo DSO showed that direct methods are not confined to small indoor scenes: with a stereo rig they achieve state-of-the-art large-scale outdoor odometry. Its dual close/far treatment became a standard design pattern for stereo direct systems, and the "virtual stereo" idea in DVSO (CNN-predicted right images) and the inertial extension VI-DSO both build directly on this work. Study it after DSO to see how a direct pipeline absorbs a second camera.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [DVSO](../level-03-monocular-slam/dvso.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)

[Back to Level 7](../README.md#level-7-stereo-slam)
