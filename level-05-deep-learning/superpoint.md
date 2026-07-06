# SuperPoint

> DeTone 2017 · [Paper](https://arxiv.org/abs/1712.07629)

**One-line summary** — Self-supervised interest point detector and descriptor trained via Homographic Adaptation, producing keypoints and 256-dim descriptors for a full image in a single real-time forward pass.

## Key ideas

- **Shared encoder, two heads**: A VGG-style encoder feeds a *detector head* (a 65-channel map: one class per cell of an 8x8 pixel grid plus a "no keypoint" dustbin) and a *descriptor head* (dense 256-dim descriptors) — one pass, no patch cropping.
- **Synthetic pre-training**: A base detector (MagicPoint) is first trained on synthetic shapes (corners of lines, polygons) where keypoint locations are known by construction.
- **Homographic Adaptation**: To transfer to real images without labels, the detector is run on many random homographic warps of each image and the responses aggregated, $F_{\text{agg}}(x) = \frac{1}{N}\sum_i \mathcal{H}_i^{-1}[f(\mathcal{H}_i(I))](x)$, producing pseudo-ground-truth keypoints for self-supervised fine-tuning.
- **Joint descriptor loss**: A hinge loss on $\ell_2$-normalized descriptors pulls correspondences (known from the homographies) together and pushes non-matches apart.
- Outperformed SIFT/ORB/LIFT on HPatches homography estimation while running at roughly 70 FPS on GPU.

## Why it matters for SLAM

SuperPoint became *the* learned local feature of the deep-SLAM era: robust to illumination and viewpoint changes where ORB fails, yet fast enough for real-time front-ends. It is the standard backbone under SuperGlue/LightGlue and the hloc localization ecosystem, and has been dropped into ORB-SLAM-style systems (e.g., DXSLAM uses learned features in a classical pipeline). Homographic Adaptation itself became a widely reused self-supervision recipe for geometric learning.

## Related

- [SuperGlue](superglue.md) — the GNN matcher built on SuperPoint features
- [R2D2](r2d2.md) — reliability-aware alternative detector/descriptor
- [DISK](disk.md) — reinforcement-learning-trained alternative
- [XFeat](xfeat.md) — lightweight descendant for edge devices
- [DXSLAM](../level-03-monocular-slam/dxslam.md) — learned features inside a classical SLAM system

[Back to Level 5](../README.md#level-5-applying-deep-learning)
