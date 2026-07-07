# DynaSLAM

> Bescós 2018 · [Paper](https://arxiv.org/abs/1806.05620)

**One-line summary** — Added Mask R-CNN-based dynamic-object removal and background inpainting on top of ORB-SLAM2, making tracking and mapping robust in scenes with moving objects (monocular, stereo, and RGB-D).

## Problem

"The assumption of scene rigidity is typical in SLAM algorithms. Such a strong assumption limits the use of most visual SLAM systems in populated real-world environments, which are the target of several relevant applications like service robotics or autonomous vehicles." Features on moving people and vehicles corrupt pose estimation, and dynamic content baked into the map produces stale landmarks and false loop-closure candidates. DynaSLAM adds two capabilities to ORB-SLAM2: dynamic object detection (so moving things never pollute tracking or the map) and background inpainting (so the map shows the scene behind them).

## Key ideas

- **A-priori dynamic classes via learning**: Mask R-CNN segments instances of classes likely to move (people, cars, etc.), and features on those masks are excluded from tracking and mapping — the "deep learning" detection route.
- **Multi-view geometry for the rest**: objects that move but are not in the known class list (e.g. a chair being carried) are detected geometrically, by checking depth/reprojection inconsistency of points across views. The abstract is explicit that moving objects are detected "either by multi-view geometry, deep learning or both."
- **All three sensor modes**: DynaSLAM "is robust in dynamic scenarios for monocular, stereo and RGB-D configurations" — the segmentation-based filtering applies to all, while the geometric check leverages depth where available.
- **Static-only map**: because dynamic content never enters the map, the system avoids corrupted landmarks and false loop closures — and the paper stresses that "a static map of the scene ... is a must for long-term applications in real-world environments."
- **Background inpainting**: the parts of the background occluded by removed dynamic objects are synthesised from previous views, producing a clean static reconstruction of the scene rather than a map full of person-shaped holes.
- **Built on ORB-SLAM2**: all of ORB-SLAM2's machinery (tracking, local BA, loop closure) is preserved; DynaSLAM acts as a front-end filter plus map-repair stage.

## Results & impact

From the abstract: evaluated on public monocular, stereo, and RGB-D datasets, DynaSLAM "outperforms the accuracy of standard visual SLAM baselines in highly dynamic scenarios," while also producing the static map needed for long-term operation; the paper additionally studies "several accuracy/speed trade-offs to assess the limits of the proposed methodology" (Mask R-CNN is expensive, so the study of what robustness costs matters in practice). DynaSLAM became — with DS-SLAM — the reference baseline for the entire dynamic-SLAM literature on the TUM RGB-D dynamic sequences.

## Why it matters for SLAM

DynaSLAM is, together with DS-SLAM, the canonical dynamic-SLAM baseline: nearly every later paper on SLAM in dynamic environments compares against it on the TUM RGB-D dynamic sequences. It established the now-standard recipe of combining learned instance segmentation with geometric consistency checks, and its "remove and inpaint" idea pointed toward lifelong mapping, where the map should represent the persistent scene rather than transient occupants. DynaSLAM II later moved from discarding dynamic objects to tracking them.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [DS-SLAM](ds-slam.md)
- [DynaSLAM II](dynaslam-ii.md)
- [MaskFusion](maskfusion.md)
- [SAM](../level-05-deep-learning/sam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
