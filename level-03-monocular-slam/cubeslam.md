# CubeSLAM

> Yang 2019 · [Paper](https://arxiv.org/abs/1806.00557)

**One-line summary** — Introduced 3D cuboid object landmarks into monocular SLAM, providing long-range geometric and scale constraints that reduce drift, while modelling dynamic objects rather than rejecting them.

## Problem

Monocular SLAM suffers from scale ambiguity and accumulating drift, especially over long trajectories, and traditional systems treat dynamic objects purely as outliers to reject. CubeSLAM's observation is that objects carry geometric information that points do not: their physical sizes constrain absolute scale, their poses persist across many frames as long-range constraints, and their motion can be modelled instead of discarded. The paper demonstrates that single-image 3D object detection and multi-view object SLAM "can improve each other."

## Key ideas

- **Single-image 3D cuboid detection**: from a 2D bounding box and sampled vanishing points, multiple high-quality cuboid proposals are generated; proposals are "scored and selected based on the alignment with image edges" — how well the projected cuboid wireframe matches detected edges.
- **9-DoF object representation**: each object is a cuboid with position $(x, y, z)$, yaw orientation $\theta$, and dimensions $(l, w, h)$ — 9 degrees of freedom in total.
- **Joint object-camera-point bundle adjustment**: a "multi-view bundle adjustment with new object measurements" jointly optimises poses of cameras, objects, and points; objects observed across many frames provide long-range constraints that plain point landmarks cannot.
- **Objects supply scale**: object measurements provide "long-range geometric and scale constraints to improve camera pose estimation and reduce monocular drift," attacking monocular SLAM's fundamental scale ambiguity.
- **Dynamic objects as landmarks**: "instead of treating dynamic regions as outliers," moving objects get their own motion-model constraints and are tracked jointly with the camera, turning dynamics from a nuisance into a source of information.
- **Mutual benefit**: SLAM's multi-view consistency improves single-image 3D detection, while object landmarks improve camera pose estimation — the two halves of the system reinforce each other.

## Results & impact

From the abstract: 3D detection experiments on SUN RGB-D and KITTI show better accuracy and robustness than existing approaches, and on TUM, KITTI odometry, and the authors' own collected datasets, the SLAM method "achieves the state-of-the-art monocular camera pose estimation and at the same time, improves the 3D object detection accuracy." Object landmarks in particular help contain the scale drift that plagues point-only monocular SLAM. CubeSLAM became the canonical reference for object-level monocular SLAM and, together with QuadricSLAM (ellipsoid landmarks), defined the object-as-landmark research direction.

## Why it matters for SLAM

CubeSLAM pioneered object-level monocular SLAM, showing that semantic object detection and geometric SLAM are mutually beneficial: SLAM's multi-view consistency improves 3D object detection, and objects reduce SLAM drift and scale error. Its treatment of dynamic objects as first-class citizens foreshadowed later dynamic-SLAM systems such as DynaSLAM II and VDO-SLAM, and its cuboid representation influenced subsequent object-SLAM work.

## Related

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [SLAM++](../level-04-rgbd-slam/slampp.md)
- [DynaSLAM II](dynaslam-ii.md)
- [VDO-SLAM](vdo-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
