# DSAC++

> Brachmann 2018 · [Paper](https://arxiv.org/abs/1711.10228)

**One-line summary** — Extends DSAC with self-supervised training that needs only camera poses (no 3D ground truth), plus improved training stability and RGB-D support, making scene coordinate regression practical to deploy.

## Problem

DSAC required ground-truth 3D scene coordinates for supervision — obtained from dense SfM reconstruction or registered RGB-D scans — which limits deployment to scenes where such data exists. Camera poses, by contrast, come for free from any SLAM or SfM system. Additionally, DSAC's training was unstable: the soft RANSAC selection is sensitive to initialization, and gradients from incorrect hypotheses can dominate early training. DSAC++ asks whether a single learned component, trained from poses alone, is enough for accurate 6-DoF localization.

## Key ideas

- **Learning less is more**: the paper's key contribution is demonstrating (and explaining) that learning a *single* component of the localization pipeline — a fully convolutional network densely regressing scene coordinates — is sufficient; everything else stays classical geometry.
- **Training without 3D ground truth**: instead of supervising scene coordinates directly, DSAC++ uses a reprojection loss — predicted 3D coordinates are projected through known camera poses and compared to pixel locations: $\mathcal{L}_{\text{reproj}} = \sum_i \|\pi(K[R|t]\hat{Y}_i) - p_i\|_1$.
- **The network discovers geometry**: trained only from single-view reprojection constraints, the network automatically discovers the 3D scene geometry — no 3D model of the scene is needed during training at all.
- **Careful initialization**: pre-training the network on a rough 3D model (sparse SfM points or rendered depth) prevents degenerate solutions before self-supervised fine-tuning takes over.
- **RGB-D support**: when depth is available it provides dense coordinate supervision directly, bypassing SfM and speeding up convergence.
- **Stabilized differentiable RANSAC**: an improved soft scoring function with temperature annealing tames the unstable gradients of the original DSAC training.

## Results & impact

- Exceeds the state of the art consistently on both indoor and outdoor localization datasets; on indoor benchmarks it remains competitive with the fully supervised DSAC while training from camera poses alone.
- Notably, it surpasses prior techniques even *without* a 3D scene model at training time, since the network discovers scene geometry from single-view constraints.
- Improved training stability reduced variance across runs; the recipe was adopted by DSAC\* and the ACE family.
- Showed early that an implicit neural scene map can be learned directly from a SLAM/SfM trajectory — an idea that later reappears throughout neural mapping.

## Why it matters for SLAM

DSAC++ removed the biggest practical barrier to scene coordinate regression — the need for 3D ground truth — making the approach compatible with the output of any SLAM system (e.g., poses from ORB-SLAM). Its stable training recipe was adopted by the successors DSAC\* and ACE, and it demonstrated early that an implicit neural scene map can be learned from SLAM trajectories alone.

## Related

- [DSAC](dsac.md) — the original differentiable-RANSAC formulation
- [DSAC\*](dsac-star.md) — unified and further improved framework (TPAMI)
- [ACE](ace.md) — accelerates SCR training from hours to minutes
- [ACE Zero](ace-zero.md) — removes even the pose supervision, learning maps from scratch
- [PoseNet](posenet.md) — the absolute pose regression approach SCR outperforms

[Back to Level 5](../README.md#level-5-applying-deep-learning)
