# MASt3R-SLAM

> Murai 2024 · [Paper](https://arxiv.org/abs/2412.12392)

**One-line summary** — The first real-time dense SLAM system built on a 3D reconstruction prior (MASt3R), producing globally consistent poses and dense maps from uncalibrated monocular video.

## Key ideas

- **Foundation model as the frontend**: MASt3R's feed-forward pointmap and matching predictions replace the classical stack of feature extraction, matching, and multi-view stereo — each new frame is related to keyframes through the network's dense two-view geometry.
- **Efficient pointmap matching**: naive use of MASt3R is far too slow for SLAM; the system contributes efficient techniques for matching, tracking, and local fusion of pointmaps to reach real-time rates.
- **Keyframe graph + global optimisation**: covisibility-based keyframe selection, loop closing, and global optimisation align the pairwise predictions into a consistent global trajectory and dense map, correcting the drift of purely sequential pairwise estimation.
- **No calibration required**: because the prior predicts geometry directly from images, the system can operate without known camera intrinsics, handling generic (even time-varying) cameras — something classical dense SLAM cannot do.

## Why it matters for SLAM

MASt3R-SLAM (from Davison's lab, CVPR 2025) established the "3D foundation model as SLAM frontend" paradigm: dense, robust geometry without depth sensors, feature engineering, or per-scene training. It is the reference point against which the wave of follow-ups (VGGT-SLAM and other pointmap-based systems) is measured, and its extensions (e.g., MASt3R-Fusion) show the design slots cleanly into multi-sensor pipelines.

## Related

- [MASt3R](mast3r.md)
- [DUSt3R](dust3r.md)
- [DROID-SLAM](droid-slam.md)
- [VGGT-SLAM](vggt-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
