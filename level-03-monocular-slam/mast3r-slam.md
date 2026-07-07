# MASt3R-SLAM

> Murai 2024 · [Paper](https://arxiv.org/abs/2412.12392)

**One-line summary** — The first real-time dense SLAM system designed bottom-up from a two-view 3D reconstruction prior (MASt3R), producing globally consistent poses and dense maps from uncalibrated monocular video at 15 FPS.

## Problem

Classical dense monocular SLAM needs a calibrated camera, and gets its geometry either from a depth sensor or from fragile multi-view stereo; it degrades badly on in-the-wild video. MASt3R offers the opposite trade-off: a powerful two-view reconstruction and matching prior that is robust and calibration-free, but with no notion of keyframes, global consistency, or real-time operation — and far too slow to run naively on every frame pair. MASt3R-SLAM builds a full SLAM system "bottom-up" from this prior, keeping its generality while adding everything SLAM requires.

## Key ideas

- **Foundation model as the frontend**: MASt3R's feed-forward pointmap and matching predictions replace the classical stack of feature extraction, matching, and multi-view stereo — each new frame is related to keyframes through the network's dense two-view geometry.
- **Efficient pointmap machinery**: the paper introduces "efficient methods for pointmap matching, camera tracking and local fusion, graph construction and loop closure, and second-order global optimisation" (abstract) — the engineering layer that turns a slow two-view prior into a 15 FPS SLAM system.
- **Almost no camera model assumed**: the system makes "no assumption on a fixed or parametric camera model beyond a unique camera centre" (abstract), so it runs on uncalibrated, in-the-wild video — even footage whose intrinsics vary — where classical dense SLAM cannot start.
- **Keyframe graph + loop closure**: covisibility-based graph construction and loop closing align the pairwise predictions into a consistent global trajectory, correcting the drift of purely sequential pairwise estimation; a second-order optimiser refines the whole graph.
- **Calibrated mode as a special case**: "with known calibration, a simple modification to the system achieves state-of-the-art performance across various benchmarks" (abstract) — the general uncalibrated design does not sacrifice the standard-benchmark setting.

## Results & impact

- Runs at 15 FPS while "producing globally-consistent poses and dense geometry" (abstract); with known calibration it reaches state-of-the-art performance across various benchmarks.
- Robust "on in-the-wild video sequences" — the setting that motivated the design and where prior dense SLAM systems fail.
- From Davison's lab (published at CVPR 2025), it established the "3D foundation model as SLAM frontend" paradigm and is the reference point against which follow-ups (VGGT-SLAM and other pointmap-based systems) are measured; MASt3R-Fusion extends it with IMU/GNSS.

## Why it matters for SLAM

MASt3R-SLAM is described by its authors as plug-and-play: point it at video from an arbitrary camera and get dense, globally consistent geometry — no depth sensor, no calibration procedure, no feature engineering, no per-scene training. That combination redefined the baseline for what monocular dense SLAM should be expected to do, and its architecture (learned two-view prior + classical graph optimisation) is the template most foundation-model SLAM systems now follow.

## Related

- [MASt3R](mast3r.md)
- [DUSt3R](dust3r.md)
- [DROID-SLAM](droid-slam.md)
- [VGGT-SLAM](vggt-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [Covisibility graph](covisibility-graph.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
