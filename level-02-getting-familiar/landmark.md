# Landmark

A **landmark** is a fixed, re-observable feature of the environment that the SLAM system estimates and stores in its map. In visual SLAM, the archetypal landmark is a 3D point $\mathbf{X}_j \in \mathbb{R}^3$: a keypoint detected in multiple images, triangulated into 3D, and associated with a descriptor so it can be recognized again. The collection of landmarks *is* the map (in sparse, feature-based systems).

Landmarks close the loop between the two halves of the SLAM problem:

- **Localization uses landmarks**: given 2D observations of known 3D landmarks, the camera pose is estimated (2D-3D correspondence / PnP). The observation model is $\mathbf{z}_{ij} = \pi(T_i \mathbf{X}_j) + \mathbf{v}$ — landmark $j$ projected through pose $i$ should land where we observed it.
- **Mapping creates landmarks**: from poses and 2D-2D correspondences, new landmarks are triangulated and added to the map.

This mutual dependence — poses need landmarks, landmarks need poses — is exactly why SLAM is a joint estimation problem: in the factor graph, poses and landmarks are both variable nodes, tied together by observation factors, and bundle adjustment refines them jointly.

## Parameterizations

The obvious representation — Euclidean coordinates $\mathbf{X} = (x, y, z)$ — is not the only one, and not always the best:

- **Euclidean XYZ**: simple, minimal, ideal once a point is well-triangulated with sufficient parallax.
- **Inverse depth**: represent the point relative to an *anchor* camera as a viewing direction plus inverse depth $\rho = 1/d$. Distant points ($\rho \to 0$) and points observed with little parallax have wildly asymmetric depth uncertainty in Euclidean space, but near-Gaussian uncertainty in inverse depth — so the estimator can use faraway features (which constrain rotation beautifully) from the first observation, long before their depth is resolved. Systems typically switch a point to XYZ once parallax makes it well-conditioned.

## Data association

Matching an observation to the right landmark is the front-end's core responsibility, and the standard machinery stacks several filters:

1. **Projection search**: predict where the landmark should appear using the current pose estimate, and only consider keypoints within a search window around that prediction.
2. **Appearance check**: descriptor distance between the landmark's stored descriptor and the candidate keypoint must be small (and pass a ratio/second-best test).
3. **Compatibility checks**: the observation must be consistent with the landmark's scale range (pyramid level) and mean viewing direction.
4. **Statistical gating**: after estimation, a chi-square test on the reprojection residual rejects associations inconsistent with the predicted uncertainty.

Wrong data association — matching an observation to the wrong landmark — is among the most damaging errors in SLAM, which is why robust matching and outlier rejection get so much attention.

## The landmark lifecycle

A practical landmark carries more than coordinates. A typical map point in an ORB-SLAM-style system stores: its 3D position, a representative descriptor (for matching), viewing direction statistics (from which angles it is visible), scale/depth range (at which image pyramid levels it can be detected), and bookkeeping (observation count, outlier ratio) used to cull unreliable points. Landmark management is a large part of what keeps a real system healthy:

- **Creation**: triangulate only with sufficient parallax, positive depth in both views, and small reprojection error — otherwise the new point is noise wearing a landmark costume.
- **Culling**: newly created points must quickly prove themselves (be found in a minimum fraction of the frames that should see them, collect a minimum number of observations) or be deleted.
- **Fusion**: when two map points turn out to be the same physical point (e.g., after a loop closure), they are merged and their observations combined.

Landmarks need not be points. Systems have used lines and planes (richer geometry in man-made scenes), and object-level landmarks (recognized objects with pose), trading detection complexity for more descriptive, more semantically meaningful maps. Whatever the form, the defining requirements are the same: it must be *static* (or handled specially if not), *re-observable*, and *distinguishable* enough for reliable data association.

## Why it matters for SLAM

"Landmark" is the concept that turns odometry into SLAM: because landmarks persist, re-observing one after a long excursion constrains the current pose against the old map, enabling drift correction, loop closure, and relocalization. When you read any feature-based system's paper, the design of its landmarks — what they store, how they are created and culled, how they are matched — is the design of its map.

## Related

- [Keypoints](keypoints.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [Factor graph](factor-graph.md)
- [Odometry](odometry.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
