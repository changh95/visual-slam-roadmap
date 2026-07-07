# DynaSLAM II

> Bescós 2021 · [Paper](https://arxiv.org/abs/2010.07820)

**One-line summary** — Tightly coupled multi-object tracking and SLAM: instead of discarding dynamic objects like DynaSLAM, it jointly optimises camera poses, the static map, and the trajectories of moving rigid objects in one bundle adjustment.

## Problem

Removing dynamic objects (DynaSLAM, DS-SLAM) protects camera tracking, but it throws information away — and many applications cannot afford that: "most scenarios including autonomous driving, multi-robot collaboration and augmented/virtual reality, require explicit motion information of the surroundings to help with decision making and scene understanding." DynaSLAM II therefore inverts the first paper's philosophy: rather than filtering dynamic content out, it estimates the moving objects' trajectories jointly with the camera, in a single tightly coupled optimisation for stereo and RGB-D configurations.

## Key ideas

- **From rejection to estimation**: dynamic objects are no longer outliers to remove; they are rigid bodies whose 6-DoF trajectories are estimated jointly with the camera, using "instance semantic segmentation and ORB features to track dynamic objects."
- **Instance segmentation + feature association**: instance masks identify objects, and ORB features on each object are tracked over time and associated to that object's own landmark set, exactly as static features are associated to the static map.
- **Tightly-coupled BA**: "the structure of the static scene and of the dynamic objects is optimized jointly with the trajectories of both the camera and the moving agents within a novel bundle adjustment proposal" — object observations directly constrain (and are constrained by) the camera estimate, rather than object tracking running as a separate downstream module.
- **Loosely-optimised 3D bounding boxes**: each object's 3D bounding box is "estimated and loosely optimized within a fixed temporal window," decoupling the object's coarse extent from the tightly optimised point structure.
- **Tracking objects helps the camera**: the paper demonstrates "that tracking dynamic objects does not only provide rich clues for scene understanding but is also beneficial for camera tracking" — moving structure, properly modelled, is signal rather than noise.

## Results & impact

The abstract's central claim is qualitative but important: jointly tracking dynamic objects benefits camera tracking itself, in addition to producing the object trajectories and 3D boxes that planning and scene-understanding modules need. DynaSLAM II — alongside the contemporaneous VDO-SLAM — defined the "second generation" of dynamic SLAM in which multi-object tracking and SLAM are one estimation problem, the formulation now standard in driving-oriented and embodied-AI SLAM research.

## Why it matters for SLAM

DynaSLAM II represents the second generation of dynamic SLAM: once removing dynamic content (DynaSLAM, DS-SLAM) was solved well enough, the frontier moved to *exploiting* it. Jointly estimating camera and object motion is essential for autonomous driving and human-populated environments, and this tightly-coupled formulation — shared with contemporaries like VDO-SLAM and prefigured by CubeSLAM — is the template that modern dynamic scene understanding systems build on.

## Related

- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [CubeSLAM](cubeslam.md)
- [MID-Fusion](mid-fusion.md)
- [MonST3R](monst3r.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
