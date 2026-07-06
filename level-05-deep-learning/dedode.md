# DeDoDe

> Edstedt 2024 · [Paper](https://arxiv.org/abs/2308.08479)

**One-line summary** — DeDoDe ("Detect, Don't Describe — Describe, Don't Detect") decouples keypoint detection from description, training the detector directly for 3D consistency from SfM tracks and the descriptor separately for matching.

## Key ideas

- Joint detect-and-describe methods (SuperPoint, R2D2, DISK) define keypoints via descriptor mutual-nearest-neighbors — a proxy objective that does not guarantee 3D-consistent detections and ties keypoints to one specific descriptor.
- DeDoDe's detector is instead trained to fire on points that belong to **tracks from large-scale SfM reconstructions** — i.e., points empirically proven to be 3D-consistent across views.
- Since SfM tracks are overly sparse, a semi-supervised two-view detection objective expands the supervision to the desired number of detections.
- The descriptor is trained independently to maximize matching performance for given keypoints; detector and descriptor can be swapped or upgraded separately (decoupled inference).
- The result is a modular front-end that plugs into matchers (e.g., LightGlue-style pipelines) and localization stacks as a drop-in replacement for joint detector-descriptors.

## Why it matters for SLAM

Keypoint quality bounds everything downstream in feature-based SLAM: triangulation, BA, relocalization. DeDoDe's insight — supervise detection with 3D consistency rather than descriptor-matching proxies — gives keypoints that survive wide baselines and viewpoint change, which is exactly what long-term SLAM and mapping need. It also exemplifies the modern trend of decomposing the learned front-end into independently optimized, composable pieces.

## Related

- [SuperPoint](superpoint.md)
- [DISK](disk.md)
- [R2D2](r2d2.md)
- [LightGlue](lightglue.md)
- [RoMa](roma.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
