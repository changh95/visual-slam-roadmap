# SuperPoint

> DeTone 2017 · [Paper](https://arxiv.org/abs/1712.07629)

**One-line summary** — Self-supervised interest point detector and descriptor trained via Homographic Adaptation, producing keypoints and 256-dim descriptors for a full image in a single real-time forward pass.

## Problem

Classical detectors and descriptors (SIFT, ORB) are hand-crafted and brittle under illumination and viewpoint change, while supervised learning of keypoints is blocked by an awkward fact: there is no ground truth for "where the interest points are" in a real image — human annotation of keypoints is ill-defined.

Patch-based learned descriptors also required cropping around detections, preventing efficient full-image inference. SuperPoint asked how to train a joint detector + descriptor on real images *without any manual labels*, in a fully-convolutional model that computes pixel-level keypoints and descriptors in one forward pass.

## Key ideas

- **Shared encoder, two heads**: A VGG-style encoder feeds a *detector head* (a 65-channel map: one class per cell of an 8x8 pixel grid plus a "no keypoint" dustbin) and a *descriptor head* (dense 256-dim descriptors) — one forward pass on the full-sized image, no patch cropping.
- **Synthetic pre-training (MagicPoint)**: A base detector is first trained on synthetic renderings of simple shapes (lines, polygons, corners) where keypoint locations are known *by construction* — sidestepping the label problem entirely.
- **Homographic Adaptation**: To cross the synthetic-to-real domain gap without labels, the detector is run on many random homographic warps of each real image and the responses aggregated, $F_{\text{agg}} = \frac{1}{N}\sum_i \mathcal{H}_i^{-1}\, f(\mathcal{H}_i(I))$, producing pseudo-ground-truth keypoints (on MS-COCO) for self-supervised fine-tuning. The adapted model detects a much richer set of interest points than the pre-adapted model or any traditional corner detector.
- **Joint descriptor loss**: A hinge loss on $\ell_2$-normalized descriptors pulls correspondences (known exactly from the sampled homographies) together and pushes non-matches apart, trained jointly with detection.
- **Cheap dense descriptors**: The descriptor head predicts on a coarse grid and is interpolated to keypoint locations, keeping the full-image forward pass light enough for real-time use.
- **Multiple-view-geometry orientation**: The whole design targets geometric tasks — homography estimation, SfM, SLAM — rather than semantic recognition, which is why its features transfer so well to matching pipelines.

## Results & impact

- State-of-the-art homography estimation on HPatches compared with LIFT, SIFT, and ORB.
- Runs at roughly 70 FPS on GPU — fast enough for real-time SLAM front-ends.
- Became *the* learned local feature of the deep-SLAM era: the standard backbone under SuperGlue/LightGlue, the hloc localization ecosystem, and learned-feature SLAM systems (e.g., DXSLAM-style pipelines).
- Homographic Adaptation itself became a widely reused self-supervision recipe for geometric learning, and the "synthetic pre-train, self-label real data" pattern spread far beyond keypoints.

## Why it matters for SLAM

SuperPoint became *the* learned local feature of the deep-SLAM era: robust to illumination and viewpoint changes where ORB fails, yet fast enough for real-time front-ends. It is the standard backbone under SuperGlue/LightGlue and the hloc localization ecosystem, and has been dropped into ORB-SLAM-style systems (e.g., DXSLAM uses learned features in a classical pipeline). Homographic Adaptation itself became a widely reused self-supervision recipe for geometric learning.

## Related

- [SuperGlue](superglue.md) — the GNN matcher built on SuperPoint features
- [R2D2](r2d2.md) — reliability-aware alternative detector/descriptor
- [DISK](disk.md) — reinforcement-learning-trained alternative
- [XFeat](xfeat.md) — lightweight descendant for edge devices
- [hloc](hloc.md) — the localization ecosystem it anchors
- [DXSLAM](../level-03-monocular-slam/dxslam.md) — learned features inside a classical SLAM system

[Back to Level 5](../README.md#level-5-applying-deep-learning)
