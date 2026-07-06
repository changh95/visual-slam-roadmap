# ACE Zero

> Brachmann 2024 · [Paper](https://arxiv.org/abs/2404.14351)

**One-line summary** — ACE Zero (ACE0) re-interprets incremental structure-from-motion as the iterated training and application of a scene coordinate regression relocalizer, recovering camera poses for unposed image collections without any pre-built 3D map.

## Key ideas

- Prior scene coordinate regression (SCR) methods such as DSAC* and ACE need pre-computed camera poses (from SfM or SLAM) to train the scene-specific head — a circular dependency: you need a map to train the localizer, but a localizer to build the map. ACE Zero breaks this loop.
- Incremental SfM is re-framed as iteratively training and applying a visual relocalizer: register a seed set of images, train an ACE relocalizer on them, use it to register more images, refine, and repeat until the whole collection is posed.
- The trained SCR network itself is the map — an implicit neural scene representation, with no explicit sparse point cloud or feature database stored.
- After new images are registered, all poses are jointly refined by minimizing the reprojection loss through the SCR network.
- Requires no pose priors and no sequential input ordering, and optimizes efficiently over thousands of images; in many cases the estimated poses approach feature-based SfM accuracy, as demonstrated via novel view synthesis.

## Why it matters for SLAM

ACE Zero completes the SCR lineage (DSAC → DSAC* → ACE) by removing its last classical dependency: the SfM-generated ground-truth poses needed for training. This makes learning-based relocalization self-contained — an appealing property for crowd-sourced mapping, privacy-preserving maps (no raw images or explicit 3D points need to be stored), and as a learning-based alternative to COLMAP-style reconstruction pipelines. It also inspired follow-ups that push SCR into real-time SLAM.

## Related

- [ACE](ace.md)
- [DSAC*](dsac-star.md)
- [ACE-SLAM](ace-slam.md)
- [ACE-G](ace-g.md)
- [COLMAP](../level-03-monocular-slam/colmap.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
