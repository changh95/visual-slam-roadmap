# MonST3R

> Zhang 2024 · [Paper](https://arxiv.org/abs/2410.03825)

**One-line summary** — Extends DUSt3R-style pointmap estimation to *dynamic* scenes by predicting a pointmap per timestep, enabling geometry, depth, and camera pose estimation from videos with moving objects.

## Key ideas

- **Pointmaps over time**: DUSt3R's pointmap representation assumes a rigid scene; MonST3R's key insight is that the same representation can simply be estimated *per timestep*, so moving content is represented at each moment rather than being forced into one inconsistent static reconstruction.
- **Adaptation, not redesign**: rather than building an explicit motion model, the approach fine-tunes the pointmap network for dynamic data — identifying suitable (scarce) dynamic training datasets and a training strategy that adapts the model without large-scale dynamic ground truth.
- **Dynamic-scene downstream tasks**: the time-varying pointmaps directly support video depth estimation, camera pose estimation in dynamic scenes, and feed-forward 4D-ish dense reconstruction, where static-assumption pipelines degrade or fail.
- **Robustness where geometry breaks**: classical SfM/SLAM treats moving objects as outliers to be rejected; MonST3R instead reconstructs them, which is essential when large portions of the image are dynamic.

## Why it matters for SLAM

Dynamic environments are the standing failure mode of geometry-based SLAM, traditionally handled by masking movers out (DynaSLAM, DS-SLAM). MonST3R points to a different path: foundation models that natively estimate geometry *in the presence of motion*, providing per-frame dense geometry that downstream trackers and dynamic-object SLAM systems can consume. It is a key stepping stone from the static DUSt3R/MASt3R family toward 4D scene understanding.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [Align3R](../level-05-deep-learning/align3r.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
