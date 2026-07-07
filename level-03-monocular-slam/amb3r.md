# AMB3R

> Wang 2025 · [Paper](https://arxiv.org/abs/2511.20343)

**One-line summary** — A feed-forward 3D reconstruction model in the DUSt3R/VGGT lineage that predicts accurate, *metric-scale* geometry and pairs it with a compact volumetric backend, so one network can serve as the engine for multi-view reconstruction, SfM, and SLAM.

## Problem

Pointmap-based feed-forward models (DUSt3R, MASt3R, VGGT) regress 3D geometry directly from images, but two gaps remained between them and a deployable SfM/SLAM engine. First, their predictions are typically not reliably *metric-scale*, so downstream robotics use still needs an external scale source. Second, feed-forward predictions lack a mechanism for global geometric consistency across many views — the role a backend plays in classical pipelines — and prior models usually needed task-specific fine-tuning or test-time optimization to serve as VO or SfM. AMB3R ("Accurate feed-forward Metric-scale 3D reconstruction with Backend") addresses both within a single model.

## Key ideas

- **Feed-forward, metric-scale, multi-view**: AMB3R is a multi-view feed-forward model for dense 3D reconstruction on a metric scale — geometry and cameras come out of a forward pass with physically meaningful units, rather than up-to-scale geometry that must be rescaled later.
- **A sparse volumetric backend**: the key idea is a sparse yet compact *volumetric scene representation* used as a backend, enabling geometric reasoning with spatial compactness — a shared 3D structure that predictions are reasoned against, unlike pointmap models whose per-view predictions are only loosely coupled.
- **One model, several problem settings**: although trained solely for multi-view reconstruction, AMB3R extends *without task-specific fine-tuning or test-time optimization* to uncalibrated visual odometry (online) and to large-scale structure-from-motion — evidence that the 3D-foundation-model recipe can cover the roles traditionally split between a SLAM front-end and a COLMAP-style SfM pipeline.
- **Part of the pointmap lineage**: builds on the paradigm started by DUSt3R (pairwise pointmap regression), sharpened by MASt3R (matching + metric grounding) and VGGT (multi-view feed-forward transformer), pushing it toward the accuracy and scale correctness of classical optimization-based pipelines.

## Results & impact

Per the paper, AMB3R achieves state-of-the-art performance among pointmap-based models in camera pose, depth, and metric-scale estimation and 3D reconstruction, and even surpasses optimization-based SLAM and SfM methods equipped with dense reconstruction priors on common benchmarks. The significant claim for the field is the last one: a purely feed-forward model with a compact backend outperforming optimization-based pipelines on their own turf, while remaining a single network usable online (VO) or offline (SfM).

(Recent paper — expansion here is limited to what the abstract states.)

## Why it matters for SLAM

The pointmap foundation-model line is progressively absorbing the classical SfM/SLAM stack — first two-view geometry, then multi-view pose, and here metric scale plus a backend for global consistency. For monocular SLAM specifically, metric-scale feed-forward geometry attacks scale ambiguity head-on: instead of needing an IMU or stereo rig, the prior learned from data supplies approximate absolute scale. AMB3R is a useful reference point for where "SLAM as a neural network plus a lightweight backend" currently stands.

## Related

- [DUSt3R](dust3r.md)
- [MASt3R](mast3r.md)
- [VGGT](vggt.md)
- [MASt3R-SLAM](mast3r-slam.md)
- [COLMAP](colmap.md)
- [Scale ambiguity](scale-ambiguity.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
