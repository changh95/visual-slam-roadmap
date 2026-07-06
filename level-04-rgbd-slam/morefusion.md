# MoreFusion

> Wada 2020 · [Paper](https://arxiv.org/abs/2004.04336)

**One-line summary** — Fuses RGB-D video into per-object TSDF volumes and jointly refines the 6D poses of multiple known objects with collision-based constraints, enabling accurate pose estimation for objects in contact and under occlusion.

## Key ideas

- **DL instance segmentation + volumetric pose prediction**: Mask-RCNN segments object instances, and a CNN operating on each masked RGB-D crop predicts 6D pose proposals that initialize multi-view refinement.
- **Object-level volumetric fusion**: depth within each instance mask is fused into a per-object TSDF as the camera moves, accumulating 3D scene reconstruction of each object — including surfaces that were occluded in earlier views.
- **Occupancy reasoning**: unobserved-but-likely-occupied space is tracked conservatively, providing collision geometry even for parts of the scene never directly seen.
- **Collision-based refinement**: all object poses are jointly optimized by aligning fused volumes to known CAD models under non-intersection constraints, relaxed into a differentiable penalty — eliminating physically impossible interpenetrating configurations that single-view methods produce.
- **CAD object fitting**: like SLAM++, final poses come from fitting known object models, but initialization is learned rather than hand-crafted, and reasoning is explicitly multi-object.

## Why it matters for SLAM

MoreFusion connects semantic SLAM to robot manipulation: cluttered tabletop scenes with touching, occluding objects are exactly where single-view 6D pose estimators fail and where a SLAM-style multi-view, map-centric approach shines. It extends the Fusion++ per-object TSDF idea from reconstruction to precise 6D pose estimation, and its collision-aware joint optimization is a principled treatment of mutual occlusion that later object-level and manipulation-oriented systems build on.

## Related

- [Fusion++](fusionpp.md)
- [SLAM++](slampp.md)
- [PointFusion / DenseFusion](pointfusion-densefusion.md)
- [DSP-SLAM](dsp-slam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
