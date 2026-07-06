# CubeSLAM

> Yang 2019 · [Paper](https://arxiv.org/abs/1806.00557)

**One-line summary** — Introduced 3D cuboid object landmarks into monocular SLAM, providing long-range geometric and scale constraints that reduce drift, while modelling dynamic objects rather than rejecting them.

## Key ideas

- **Single-image 3D cuboid detection**: from a 2D bounding box and vanishing points, multiple cuboid proposals are generated and scored by how well their projected edges align with detected image edges.
- **9-DoF object representation**: each object is a cuboid with position $(x, y, z)$, yaw orientation, and dimensions $(l, w, h)$ — 9 degrees of freedom in total.
- **Joint object-camera-point bundle adjustment**: camera poses, point landmarks, and object poses are optimised together; objects observed across many frames provide long-range constraints that plain points cannot.
- **Objects supply scale**: known typical object sizes constrain absolute scale, attacking monocular SLAM's fundamental scale ambiguity.
- **Dynamic objects as landmarks**: moving objects get their own motion models and are tracked jointly with the camera, turning dynamics from a nuisance into a source of information.

## Why it matters for SLAM

CubeSLAM pioneered object-level monocular SLAM, showing that semantic object detection and geometric SLAM are mutually beneficial: SLAM's multi-view consistency improves 3D object detection, and objects reduce SLAM drift and scale error. Its treatment of dynamic objects as first-class citizens foreshadowed later dynamic-SLAM systems such as DynaSLAM II and VDO-SLAM, and its cuboid representation influenced subsequent object-SLAM work.

## Related

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [SLAM++](../level-04-rgbd-slam/slampp.md)
- [DynaSLAM II](dynaslam-ii.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
