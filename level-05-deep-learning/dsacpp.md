# DSAC++

> Brachmann 2018 · [Paper](https://arxiv.org/abs/1711.10228)

**One-line summary** — Extends DSAC with self-supervised training that needs only camera poses (no 3D ground truth), plus improved training stability and RGB-D support, making scene coordinate regression practical to deploy.

## Key ideas

- **Training without 3D ground truth**: DSAC required ground-truth scene coordinates from dense SfM or registered RGB-D scans. DSAC++ instead supervises through a reprojection loss — predicted 3D coordinates are projected through known camera poses and compared to pixel locations: $\mathcal{L}_{\text{reproj}} = \sum_i \|\pi(K[R|t]\hat{Y}_i) - p_i\|_1$.
- **Poses are cheap**: camera poses come for free from any SLAM or SfM system, so the method can learn a scene representation directly from a mapping session's trajectory.
- **Careful initialization**: pre-training the network on a rough 3D model (sparse SfM points or rendered depth) prevents degenerate solutions before self-supervised fine-tuning takes over.
- **RGB-D support**: when depth is available it provides dense coordinate supervision directly, bypassing SfM and speeding up convergence.
- **Stabilized differentiable RANSAC**: an improved soft scoring function with temperature annealing tames the unstable gradients of the original DSAC training.

## Why it matters for SLAM

DSAC++ removed the biggest practical barrier to scene coordinate regression — the need for 3D ground truth — making the approach compatible with the output of any SLAM system (e.g., poses from ORB-SLAM). Its stable training recipe was adopted by the successors DSAC\* and ACE, and it demonstrated early that an implicit neural scene map can be learned from SLAM trajectories alone.

## Related

- [DSAC](dsac.md) — the original differentiable-RANSAC formulation
- [DSAC\*](dsac-star.md) — unified and further improved framework (TPAMI)
- [ACE](ace.md) — accelerates SCR training from hours to minutes
- [ACE Zero](ace-zero.md) — removes even the pose supervision, learning maps from scratch

[Back to Level 5](../README.md#level-5-applying-deep-learning)
