# ACE Zero

> Brachmann 2024 · [Paper](https://arxiv.org/abs/2404.14351)

**One-line summary** — ACE Zero (ACE0) re-interprets incremental structure-from-motion as the iterated training and application of a scene coordinate regression relocalizer, recovering camera poses for unposed image collections without any pre-built 3D map.

## Problem

Scene coordinate regression (SCR) relocalizers such as DSAC\* and ACE are accurate and compact, but training their scene-specific networks requires ground-truth camera poses — which in practice come from a feature-based SfM tool like COLMAP. That is a circular dependency: you need a map to train the localizer, but a localizer to build the map. ACE Zero asks whether the relocalizer itself can bootstrap reconstruction — estimating camera parameters for a set of images with no pose priors, no sequential ordering, and no pre-built 3D map.

## Key ideas

- **SfM = iterated relocalization.** Feature-based incremental SfM repeats two steps: triangulate sparse 3D points, then register more camera views against them. ACE0 re-interprets this loop as "an iterated application and refinement of a visual relocalizer" — which opens the door to relocalizers that are *not* rooted in local feature matching.
- **The relocalizer is an SCR network.** Starting from a small seed set of images, an ACE-style scene coordinate regression head is trained on the currently registered images. The trained network implicitly encodes the scene's 3D structure — an implicit neural scene representation, with no explicit sparse point cloud or feature database stored.
- **Incremental registration.** The trained relocalizer estimates poses for the still-unregistered images (scene coordinate prediction + robust pose solving); confidently posed images join the training set, the network is retrained/refined, and the loop repeats until the whole collection is posed.
- **Joint pose refinement.** After new images are registered, all poses are refined together by minimizing the reprojection error through the SCR network,

  $$\min_{\{T_i\},\,\theta} \sum_i \sum_{\mathbf{p}} \big\| \pi\big(T_i \cdot f_\theta(I_i, \mathbf{p})\big) - \mathbf{p} \big\|,$$

  where $f_\theta$ predicts the 3D scene coordinate of pixel $\mathbf{p}$ and $\pi$ is the camera projection — the SCR analogue of bundle adjustment.
- **No priors, thousands of images.** Unlike other learning-based reconstruction methods, ACE0 requires neither pose priors nor sequential inputs, and it optimizes efficiently over thousands of images — inheriting ACE's fast scene-specific training.

## Results & impact

- The abstract's headline claim: "In many cases, our method, ACE0, estimates camera poses with an accuracy close to feature-based SfM, as demonstrated by novel view synthesis" — i.e., poses good enough to train neural rendering models on unposed collections.
- Published at ECCV 2024; demonstrated on unposed image collections where it reaches pose accuracy comparable to an ACE relocalizer trained on SfM ground-truth poses, while starting from zero.
- Because the map lives entirely in network weights, no raw images or explicit 3D points need to be stored — attractive for privacy-preserving and crowd-sourced mapping.

## Why it matters for SLAM

ACE Zero completes the SCR lineage (DSAC → DSAC\* → ACE) by removing its last classical dependency: the SfM-generated ground-truth poses needed for training. This makes learning-based relocalization self-contained — an appealing property for crowd-sourced mapping, privacy-preserving maps, and as a learning-based alternative to COLMAP-style reconstruction pipelines. It also inspired follow-ups that push SCR into real-time SLAM (ACE-SLAM) and toward better generalization (ACE-G).

## Related

- [ACE](ace.md)
- [DSAC*](dsac-star.md)
- [ACE-SLAM](ace-slam.md)
- [ACE-G](ace-g.md)
- [COLMAP](../level-03-monocular-slam/colmap.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
