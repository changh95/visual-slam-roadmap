# DynaSLAM II

> Bescós 2021 · [Paper](https://arxiv.org/abs/2010.07820)

**One-line summary** — Tightly coupled multi-object tracking and SLAM: instead of discarding dynamic objects like DynaSLAM, it jointly optimises camera poses, the static map, and the trajectories of moving rigid objects in one bundle adjustment.

## Key ideas

- **From rejection to estimation**: dynamic objects are no longer outliers to remove; they are rigid bodies whose 6-DoF trajectories are estimated jointly with the camera.
- **Instance segmentation + feature association**: instance masks identify objects, and features on each object are tracked over time and associated to that object's landmark set.
- **Tightly-coupled BA**: a joint bundle adjustment optimises camera poses, static map points, per-object poses, and object points together, so object observations directly constrain (and are constrained by) the camera estimate.
- **Object-level outputs**: the system produces object trajectories and bounding boxes usable for downstream tasks, effectively unifying SLAM with multi-object tracking rather than running them as separate modules.

## Why it matters for SLAM

DynaSLAM II represents the second generation of dynamic SLAM: once removing dynamic content (DynaSLAM, DS-SLAM) was solved well enough, the frontier moved to *exploiting* it. Jointly estimating camera and object motion is essential for autonomous driving and human-populated environments, and this tightly-coupled formulation — shared with contemporaries like VDO-SLAM and prefigured by CubeSLAM — is the template that modern dynamic scene understanding systems build on.

## Related

- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [CubeSLAM](cubeslam.md)
- [MID-Fusion](mid-fusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
