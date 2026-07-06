# AMB3R

> Wang 2025 · [Paper](https://arxiv.org/abs/2511.20343)

**One-line summary** — A feed-forward 3D reconstruction model in the DUSt3R/VGGT lineage that predicts accurate, *metric-scale* geometry and pairs it with a backend, so one network can serve as the engine for multi-view reconstruction, SfM, and SLAM.

## Key ideas

- **Feed-forward metric-scale reconstruction**: rather than recovering geometry up-to-scale and fixing units later, the model directly regresses metric-scale 3D geometry and camera poses from images in a forward pass — no per-scene optimization required to get an initial reconstruction.
- **Backend on top of learned predictions**: a backend enforces global consistency across many views, addressing the classic weakness of pairwise/feed-forward models (DUSt3R, MASt3R), whose independent predictions drift and disagree as the number of images grows.
- **One model, several problem settings**: the same reconstruction core supports offline structure-from-motion over unordered collections and online, incremental SLAM-style operation — evidence that the "3D foundation model" recipe can cover the roles traditionally split between COLMAP-style SfM and a SLAM system.
- **Part of the pointmap lineage**: builds on the paradigm started by DUSt3R (pointmap regression), sharpened by MASt3R (matching + metric grounding) and VGGT (multi-view feed-forward transformer), pushing it toward accuracy and scale correctness competitive with classical pipelines.

## Why it matters for SLAM

The pointmap foundation-model line is progressively absorbing the classical SfM/SLAM stack — first two-view geometry, then multi-view pose, and here metric scale plus a backend for global consistency. For monocular SLAM specifically, metric-scale feed-forward geometry attacks scale ambiguity head-on: instead of needing an IMU or stereo rig, the prior learned from data supplies approximate absolute scale. AMB3R is a useful reference point for where "SLAM as a neural network plus a lightweight backend" currently stands.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [VGGT](vggt.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [COLMAP](colmap.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
