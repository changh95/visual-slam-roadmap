# DynaSLAM

> Bescós 2018 · [Paper](https://arxiv.org/abs/1806.05620)

**One-line summary** — Added Mask R-CNN-based dynamic-object removal and background inpainting on top of ORB-SLAM2, making tracking and mapping robust in scenes with moving objects (monocular, stereo, and RGB-D).

## Problem

"The assumption of scene rigidity is typical in SLAM algorithms. Such a strong assumption limits the use of most visual SLAM systems in populated real-world environments, which are the target of several relevant applications like service robotics or autonomous vehicles." Features on moving people and vehicles corrupt pose estimation, and dynamic content baked into the map produces stale landmarks and false loop-closure candidates. DynaSLAM adds two capabilities to ORB-SLAM2: dynamic object detection (by multi-view geometry, deep learning, or both) and background inpainting, so the map contains only the persistent scene.

## Method & architecture

- **CNN segmentation of a-priori dynamic classes.** Every RGB frame passes through Mask R-CNN (Matterport implementation, trained on MS COCO), segmenting 19 potentially movable classes (person, bicycle, car, ..., dog, etc.). For an $m \times n \times 3$ image it outputs $m \times n \times l$ binary masks ($l$ = object instances), combined into one dynamic mask. In monocular/stereo modes, keypoints on these masks are simply "neither tracked nor mapped".
- **Low-cost tracking.** A lightweight version of ORB-SLAM2 tracking localizes the camera on the static part only: project map features into the frame, match in static areas, minimize reprojection error. Features on mask contours (artificial high-gradient areas) are discarded.
- **Multi-view geometry check (RGB-D).** To catch movable-but-unlisted objects (a carried book, a moved chair), each new frame is compared with its 5 highest-overlap keyframes. A keypoint $x$ is projected into the current frame giving $x'$ with projected depth $z_{proj}$; if the parallax angle $\alpha > 30^{\circ}$ the point may be occluded and is ignored; otherwise the measured depth $z'$ is tested against

$$\Delta z = z_{proj} - z' > \tau_z, \qquad \tau_z = 0.4\ \text{m},$$

  labeling the point dynamic. $\tau_z$ was tuned on 30 hand-labeled TUM images by maximizing $0.7 \times Precision + 0.3 \times Recall$. Dynamic labels are cleaned via depth-patch variance, then grown into full masks by region growing in the depth image.
- **Fusing the two detectors.** Geometry alone misses distant people (poor depth, few features) and needs motion before it can respond; learning alone leaves a "floating book" in the map. If both fire, the geometric mask wins (it is tighter); learning-only detections are kept too. Segmented dynamic parts are removed from the frame and from the map, and ORB-SLAM2's tracking, local BA, and loop closing run on the static remainder.
- **Background inpainting.** The RGB and depth of the last 20 keyframes are projected into the dynamic segments of the current frame, synthesizing a static image of the occluded background (gaps remain where the background was never observed) — useful for AR/VR and for relocalization in lifelong maps.

## Results

- **TUM RGB-D** (ATE RMSE, median of 10 runs): on high-dynamic *walking* sequences DynaSLAM (N+G) vs RGB-D ORB-SLAM2 — w_halfsphere **0.025 vs 0.351 m**, w_xyz **0.015 vs 0.459 m**, w_rpy **0.035 vs 0.662 m**, w_static **0.006 vs 0.090 m** (92.9–96.7% error reduction); errors of ~1–2 cm, "similar to that of the state of the art in static scenes". On low-dynamic *sitting* sequences it is on par or slightly worse (s_xyz 0.015 vs 0.009) but the map is free of dynamic objects.
- **Variant study**: combining networks + geometry (N+G) beats either alone — geometry-only fails on w_xyz (0.312) because it needs motion and a delay before segmenting; doing background inpainting *before* tracking hurts rotational sequences (w_rpy 0.136).
- **Monocular TUM**: slightly higher ATE than ORB-SLAM (w_halfsphere 0.021 vs 0.017 m) but tracks far more of the trajectory (97.84% vs 87.16%; w_xyz 87.37% vs 57.63%) with much earlier initialization — ORB-SLAM only initializes once the moving objects leave the scene.
- **KITTI stereo**: slightly less accurate than ORB-SLAM2 (e.g. KITTI 00 ATE 1.4 vs 1.3 m) except where dynamic objects dominate (KITTI 01: 9.4 vs 10.4 m), while producing a reusable structure-only map.
- **Timing**: not real-time — Mask R-CNN ≈195 ms/image (Tesla M40), multi-view geometry 236–334 ms, inpainting 184–208 ms, vs 1.6–1.7 ms low-cost tracking; the paper positions this as an accuracy/speed trade-off study.

## Why it matters for SLAM

DynaSLAM is, together with DS-SLAM, the canonical dynamic-SLAM baseline: nearly every later paper on SLAM in dynamic environments compares against it on the TUM RGB-D dynamic sequences. It established the now-standard recipe of combining learned instance segmentation with geometric consistency checks, and its "remove and inpaint" idea pointed toward lifelong mapping, where the map should represent the persistent scene rather than transient occupants. DynaSLAM II later moved from discarding dynamic objects to tracking them.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [DS-SLAM](ds-slam.md)
- [DynaSLAM II](dynaslam-ii.md)
- [MaskFusion](maskfusion.md)
- [SAM](../level-05-deep-learning/sam.md)
