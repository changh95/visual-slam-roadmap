# MonST3R

> Zhang 2024 · [Paper](https://arxiv.org/abs/2410.03825)

**One-line summary** — Extends DUSt3R-style pointmap estimation to *dynamic* scenes by predicting a pointmap per timestep, enabling geometry, depth, and camera pose estimation from videos with moving objects.

## Problem

Estimating geometry from dynamic scenes "remains a core challenge in computer vision. Current approaches often rely on multi-stage pipelines or global optimizations that decompose the problem into subtasks, like depth and flow, leading to complex systems prone to errors" (abstract). DUSt3R's pointmap representation had unified static reconstruction into a single feed-forward prediction, but it assumes a rigid scene: feed it a video with movers and the moving content is forced into one inconsistent static reconstruction. MonST3R (Motion DUSt3R) asks whether the pointmap idea can survive motion without adding an explicit motion model.

## Key ideas

- **Pointmaps per timestep**: the key insight is "that by simply estimating a pointmap for each timestep, we can effectively adapt DUSt3R's representation, previously only used for static scenes, to dynamic scenes" (abstract) — moving content is represented where it is at each moment, and geometry becomes a time-indexed sequence rather than a single rigid model.
- **Geometry-first, no motion decomposition**: unlike pipelines that split the problem into depth + optical flow + segmentation stages, MonST3R directly estimates per-timestep geometry — fewer stages, fewer places for errors to compound.
- **Fine-tuning beats redesign**: the central obstacle is data — "the scarcity of suitable training data, namely dynamic, posed videos with depth labels". Posing the problem as a fine-tuning task, "identifying several suitable datasets, and strategically training the model on this limited data" surprisingly suffices to handle dynamics, "even without an explicit motion representation" (abstract).
- **Video-specific downstream optimisations**: on top of the per-timestep pointmaps, the paper introduces new optimisations for video tasks — enabling video depth estimation and camera pose estimation in dynamic scenes where static-assumption pipelines degrade or fail.
- **Reconstructing movers instead of rejecting them**: classical SfM/SLAM treats moving objects as outliers to be masked out; MonST3R reconstructs them, which is essential when large portions of the image are dynamic and mask-and-ignore would leave too little static structure to track.

## Results & impact

- Demonstrates "strong performance on video depth and camera pose estimation, outperforming prior work in terms of robustness and efficiency" (abstract).
- Shows "promising results for primarily feed-forward 4D reconstruction" (abstract) — pointing toward single-pass reconstruction of dynamic scenes over time.
- Became the reference adaptation of the DUSt3R family to dynamics, with follow-ups (e.g., Align3R for temporally consistent video depth) building on the per-timestep pointmap idea.

## Why it matters for SLAM

Dynamic environments are the standing failure mode of geometry-based SLAM, traditionally handled by masking movers out (DynaSLAM, DS-SLAM). MonST3R points to a different path: foundation models that natively estimate geometry *in the presence of motion*, providing per-frame dense geometry that downstream trackers and dynamic-object SLAM systems can consume. It is a key stepping stone from the static DUSt3R/MASt3R family toward 4D scene understanding — and a hint that the static-world assumption baked into forty years of SLAM may be dissolved at the representation level rather than patched at the pipeline level.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [Align3R](../level-05-deep-learning/align3r.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
