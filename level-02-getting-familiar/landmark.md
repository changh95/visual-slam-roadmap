# Landmark

A **landmark** is a fixed, re-observable feature of the environment that the SLAM system estimates and stores in its map. In visual SLAM, the archetypal landmark is a 3D point $\mathbf{X}_j \in \mathbb{R}^3$: a keypoint detected in multiple images, triangulated into 3D, and associated with a descriptor so it can be recognized again. The collection of landmarks *is* the map (in sparse, feature-based systems).

Landmarks close the loop between the two halves of the SLAM problem:

- **Localization uses landmarks**: given 2D observations of known 3D landmarks, the camera pose is estimated (2D-3D correspondence / PnP). The observation model is $\mathbf{z}_{ij} = \pi(T_i \mathbf{X}_j) + \mathbf{v}$ — landmark $j$ projected through pose $i$ should land where we observed it.
- **Mapping creates landmarks**: from poses and 2D-2D correspondences, new landmarks are triangulated and added to the map.

This mutual dependence — poses need landmarks, landmarks need poses — is exactly why SLAM is a joint estimation problem: in the factor graph, poses and landmarks are both variable nodes, tied together by observation factors, and bundle adjustment refines them jointly.

A practical landmark carries more than coordinates. A typical map point in an ORB-SLAM-style system stores: its 3D position, a representative descriptor (for matching), viewing direction statistics (from which angles it is visible), scale/depth range (at which image pyramid levels it can be detected), and bookkeeping (observation count, outlier ratio) used to cull unreliable points. Landmark management — creating, merging, and deleting points — is a large part of what keeps a real system healthy.

Landmarks need not be points. Systems have used lines and planes (richer geometry in man-made scenes), and object-level landmarks (recognized objects with pose), trading detection complexity for more descriptive, more semantically meaningful maps. Whatever the form, the defining requirements are the same: it must be *static* (or handled specially if not), *re-observable*, and *distinguishable* enough for reliable data association. Wrong data association — matching an observation to the wrong landmark — is among the most damaging errors in SLAM, which is why robust matching and outlier rejection get so much attention.

## Why it matters for SLAM

"Landmark" is the concept that turns odometry into SLAM: because landmarks persist, re-observing one after a long excursion constrains the current pose against the old map, enabling drift correction, loop closure, and relocalization. When you read any feature-based system's paper, the design of its landmarks — what they store, how they are created and culled, how they are matched — is the design of its map.

## Related

- [Keypoints](keypoints.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [Factor graph](factor-graph.md)
- [Odometry](odometry.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
