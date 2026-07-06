# ACE-SLAM

> Alzugaray 2025 · [Paper](https://arxiv.org/abs/2512.14032)

**One-line summary** — The first neural implicit RGB-D SLAM system to use scene coordinate regression as its core map representation, achieving strict real-time operation with the network weights themselves serving as the map.

## Key ideas

- **Network weights = map**: the scene is represented entirely by an SCR network that maps 2D image features to 3D global coordinates — no point clouds, voxels, meshes, or stored keyframe images. This is compact, low-memory, and inherently privacy-preserving.
- **Mapping as online training**: as RGB-D frames arrive, the lightweight scene-specific network is continuously updated so its predictions match the observed geometry under the current pose estimates.
- **Tracking and relocalization unified**: pose estimation for every frame is SCR-based (predict scene coordinates, solve PnP with robust estimation), so relocalization after tracking loss is not a separate subsystem — it is the same, extremely fast mechanism.
- **Tailored SCR architecture**: the authors introduce an SCR design and the integration choices (following ACE's frozen-encoder + small-head recipe) needed to make online training fast enough for strict real-time SLAM, supporting both sparse and dense features.
- **Robust in dynamic scenes**: the paper reports reliable operation in dynamic environments without special adaptation, evaluated on established synthetic and real benchmarks with performance competitive with the neural implicit SLAM state of the art.

## Why it matters for SLAM

Neural implicit SLAM systems in the iMAP/NICE-SLAM line demonstrated that a network can be the map, but struggled with real-time budgets and needed separate machinery for relocalization. ACE-SLAM shows that scene coordinate regression — matured through DSAC, ACE, and ACE Zero as an offline relocalization technique — can serve as the *single* representation for tracking, mapping, and relocalization in a live SLAM loop. It is a clean demonstration of a relocalizer-centric SLAM design and a natural endpoint (so far) of the ACE lineage.

## Related

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
