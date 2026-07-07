# KeyNet

> Barroso-Laguna 2019 · [Paper](https://arxiv.org/abs/1904.00889)

**One-line summary** — Learned keypoint detector (Key.Net) that combines handcrafted and learned CNN filters in a shallow multi-scale architecture, trained to maximize keypoint repeatability across scales.

## Problem

Classical detectors (Harris, DoG) are built from handcrafted derivative filters and scale-space heuristics: interpretable and cheap, but not optimized for the property that actually matters downstream — repeatability under real viewpoint and scale changes. Fully learned detectors go to the other extreme, discarding decades of detector design and forcing a deep network to rediscover gradient structure from data, which costs capacity, data, and inference time. Key.Net asks whether a small network *seeded* with the right handcrafted structure can beat both.

## Key ideas

- **Handcrafted + learned filters**: Handcrafted derivative-based filters (image gradients and their combinations, in the spirit of Harris/Hessian structures) provide anchor structures; learned CNN filters on top of them localize, score, and rank repeatable features. This hybrid keeps the network shallow and cheap.
- **Scale-space inside the network**: A multi-scale pyramid representation is used within the architecture so keypoints are extracted at different levels, giving scale robustness by construction rather than by external pyramid post-processing.
- **Repeatability-driven loss**: The loss function is designed to detect robust features that exist across a range of scales and to maximize the repeatability score directly, rather than to imitate the responses of an existing detector.
- **Cheap training data**: Trained on data synthetically created from ImageNet images under known geometric transformations, so ground-truth correspondence is available for free and no manual annotation is required.
- **Detector only**: Key.Net detects and scores keypoints; it is typically paired with a learned descriptor such as HardNet to form a complete matching front-end.

## Results & impact

Trained on synthetic ImageNet-derived data and evaluated on the HPatches benchmark, Key.Net outperforms state-of-the-art detectors in repeatability, matching performance, *and* complexity — the shallow hybrid architecture wins on all three axes at once. The Key.Net + HardNet combination became a common strong baseline in feature-matching and localization evaluations, and the paper is a standard reference for the "inject classical priors into small learned models" design philosophy.

## Why it matters for SLAM

SLAM front-ends live or die by detector repeatability: if the same 3D point is not re-detected across frames, no descriptor can save the match. Key.Net showed that injecting classical detector priors (handcrafted filters, scale space) into a small learned model beats both purely handcrafted and purely learned detectors on repeatability while staying light enough for real-time pipelines — a design point directly relevant to embedded SLAM.

## Related

- [SuperPoint](superpoint.md) — self-supervised joint detector-descriptor
- [HardNet](hardnet.md) — learned descriptor commonly paired with Key.Net
- [R2D2](r2d2.md) — reliability-aware detection and description
- [DISK](disk.md) — reinforcement-learning-trained alternative
- [Keypoints](../level-02-getting-familiar/keypoints.md) — classical background on detection
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — the trade-off Key.Net deliberately straddles

[Back to Level 5](../README.md#level-5-applying-deep-learning)
