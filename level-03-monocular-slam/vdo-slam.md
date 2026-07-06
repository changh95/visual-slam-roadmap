# VDO-SLAM

> Zhang 2020 · [Paper](https://arxiv.org/abs/2005.11052)

**One-line summary** — A dynamic object-aware SLAM system that jointly estimates the camera trajectory and the SE(3) motions of rigid moving objects in a single factor graph, without requiring prior object models.

## Key ideas

- **Dynamic objects as state, not noise**: instead of masking out moving objects (as DynaSLAM does), VDO-SLAM tracks them and estimates their motion jointly with the camera pose.
- **Joint camera + object motion estimation**: points on static background constrain the camera; points on each rigid moving object constrain that object's SE(3) motion between frames; both live in one unified graph optimization.
- **Segmentation + dense flow front-end**: instance-level segmentation associates pixels to objects, and dense optical flow maintains point tracks on both static and dynamic regions across frames.
- **Model-free**: no prior knowledge of object shape or category-level pose models is required — objects are handled purely through the motion of the points they carry.
- **Useful dynamic outputs**: because object motions are explicit variables, the system can report object trajectories and speed estimates, not just a cleaned-up camera path.

## Why it matters for SLAM

Classical SLAM assumes a static world, and most "dynamic SLAM" systems simply detect and discard moving content. VDO-SLAM is a landmark in the alternative direction: treating dynamic objects as first-class estimation targets. This matters for autonomous driving and mobile robotics, where knowing how other agents move is as important as localizing yourself. It helped establish the joint camera/object factor-graph formulation that later dynamic SLAM systems (e.g. DynaSLAM II) also adopted.

## Related

- [DynaSLAM](dynaslam.md) — dynamic content detection and removal approach
- [DynaSLAM II](dynaslam-ii.md) — tightly-coupled multi-object tracking and SLAM in the same spirit
- [MID-Fusion](mid-fusion.md) — object-level dense tracking of dynamic objects with RGB-D
- [MaskFusion](maskfusion.md) — real-time recognition and reconstruction of moving objects

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
