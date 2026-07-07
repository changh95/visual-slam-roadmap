# VDO-SLAM

> Zhang 2020 · [Paper](https://arxiv.org/abs/2005.11052)

**One-line summary** — A dynamic object-aware SLAM system that jointly estimates the camera trajectory and the SE(3) motions of rigid moving objects in a single factor graph, without requiring prior object models.

## Problem

Robot path planning and obstacle avoidance in dynamic environments rely on accurate estimates of how the dynamic objects around the robot are moving — yet classical SLAM assumes a static world, and most "dynamic SLAM" systems merely detect moving content and throw it away. VDO-SLAM instead combines SLAM estimation with dynamic scene modelling: it identifies and tracks dynamic rigid objects and integrates them into the estimation problem, without any prior knowledge of the objects' shapes or geometric models.

## Key ideas

- **Dynamic objects as state, not noise**: instead of masking out moving objects (as DynaSLAM does), VDO-SLAM tracks them and estimates their full SE(3) motion jointly with the camera pose — dynamic content becomes measurement, not outlier.
- **Unified factor graph**: points on the static background constrain the camera; points on each rigid moving object constrain that object's SE(3) motion between frames; camera poses, static structure, dynamic points, and object motions are all optimized in one graph.
- **Semantics + dense flow front-end**: instance-level semantic segmentation associates pixels to objects, and dense optical flow maintains point tracks on both static and dynamic regions, so even moderately textured objects carry enough tracked points to estimate their motion.
- **Model-free rigid-body motion**: no prior object shape, CAD model, or category-level pose estimator is required — an object's motion is recovered purely from the rigid-body constraint on the points it carries.
- **Spatiotemporal map with velocities**: the output is the robot trajectory, the full SE(3) motion of every tracked object, and a spatiotemporal map; linear velocity estimates are extracted directly from the object motions — precisely the quantity navigation stacks need for planning around moving agents.

## Results & impact

Demonstrated on a number of real indoor and outdoor datasets, the system shows consistent and substantial improvements over state-of-the-art algorithms, delivering highly accurate robot trajectories along with object motion estimates and velocity extraction. An open-source version of the code is available, which helped make it a standard baseline for the "estimate, don't discard" school of dynamic SLAM.

## Why it matters for SLAM

Classical SLAM assumes a static world, and most "dynamic SLAM" systems simply detect and discard moving content. VDO-SLAM is a landmark in the alternative direction: treating dynamic objects as first-class estimation targets. This matters for autonomous driving and mobile robotics, where knowing how other agents move is as important as localizing yourself. It helped establish the joint camera/object factor-graph formulation that later dynamic SLAM systems (e.g. DynaSLAM II) also adopted.

## Related

- [DynaSLAM](dynaslam.md) — dynamic content detection and removal approach
- [DynaSLAM II](dynaslam-ii.md) — tightly-coupled multi-object tracking and SLAM in the same spirit
- [MID-Fusion](mid-fusion.md) — object-level dense tracking of dynamic objects with RGB-D
- [MaskFusion](maskfusion.md) — real-time recognition and reconstruction of moving objects
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the machinery that hosts both camera and object states

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
