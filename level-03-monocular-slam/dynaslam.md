# DynaSLAM

> Bescós 2018 · [Paper](https://arxiv.org/abs/1806.05620)

**One-line summary** — Added Mask R-CNN-based dynamic-object removal and background inpainting on top of ORB-SLAM2, making tracking and mapping robust in scenes with moving objects (monocular, stereo, and RGB-D).

## Key ideas

- **A-priori dynamic classes**: Mask R-CNN segments instances of classes likely to move (people, cars, etc.), and features on those masks are excluded from tracking and mapping.
- **Multi-view geometry for the rest**: objects that move but are not in the known class list (e.g. a chair being carried) are detected geometrically, by checking depth/reprojection inconsistency of points across views (in the RGB-D setting).
- **Static-only map**: because dynamic content never enters the map, the system avoids the corrupted landmarks and false loop closures that plague static-world SLAM in populated environments.
- **Background inpainting**: the parts of the background occluded by removed dynamic objects are synthesised from previous views, producing a clean static reconstruction of the scene.
- **Built on ORB-SLAM2**: all of ORB-SLAM2's machinery (tracking, local BA, loop closure) is preserved; DynaSLAM acts as a front-end filter plus map-repair stage.

## Why it matters for SLAM

DynaSLAM is, together with DS-SLAM, the canonical dynamic-SLAM baseline: nearly every later paper on SLAM in dynamic environments compares against it on the TUM RGB-D dynamic sequences. It established the now-standard recipe of combining learned instance segmentation with geometric consistency checks, and its "remove and inpaint" idea pointed toward lifelong mapping, where the map should represent the persistent scene rather than transient occupants. DynaSLAM II later moved from discarding dynamic objects to tracking them.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [DS-SLAM](ds-slam.md)
- [DynaSLAM II](dynaslam-ii.md)
- [MaskFusion](maskfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
