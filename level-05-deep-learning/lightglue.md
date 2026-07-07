# LightGlue

> Lindenberger 2023 · [Paper](https://arxiv.org/abs/2306.13643)

**One-line summary** — Redesigned SuperGlue that is substantially faster through adaptive depth and width: easy image pairs exit the network early, and confidently matched or rejected keypoints are pruned from further computation.

## Problem

SuperGlue established learned sparse matching as the state of the art, but it spends a *fixed* compute budget: every keypoint passes through every transformer layer regardless of how easy the image pair is, and its optimal-transport formulation is notoriously difficult to train. That fixed cost made deep matchers awkward for latency-sensitive applications like real-time SLAM and large-scale 3D reconstruction. LightGlue revisits SuperGlue's design decisions one by one and asks how much can be simplified — and whether compute can be made proportional to problem difficulty.

## Key ideas

- **Revisit and simplify**: LightGlue derives simple but effective improvements over SuperGlue that cumulatively make it more efficient in memory and computation, more accurate, and much easier to train — no optimal-transport layer, cleaner supervision, stabler recipe.
- **Adaptive depth (early exit)**: A learned per-keypoint confidence at each transformer layer decides whether the matcher can stop early — pairs with large visual overlap or limited appearance change need only a few layers, hard pairs use the full depth.
- **Adaptive width (keypoint pruning)**: Keypoints that are confidently matched or confidently unmatchable are removed from later layers, cutting the quadratic attention cost on the tokens that remain.
- **Architecture cleanup**: Simplified positional encodings and attention blocks compatible with efficient (flash) attention implementations.
- **Multi-feature support**: One design works with SuperPoint, DISK, SIFT, and ALIKED descriptors, making it a plug-in matcher across front-ends.

## Results & impact

LightGlue matches or exceeds SuperGlue's accuracy while being substantially faster and lighter in memory and computation, with inference speed that adapts to pair difficulty — the key property the abstract highlights for deploying deep matchers in latency-sensitive applications like 3D reconstruction. Code and trained models are publicly available, and LightGlue replaced SuperGlue as the default matcher in the hloc localization toolbox.

## Why it matters for SLAM

SuperGlue proved learned matching is more robust than nearest-neighbor + ratio test, but its fixed compute budget made it awkward for real-time SLAM. LightGlue's insight — spend compute proportional to problem difficulty — made learned matching practical on embedded and mobile platforms, and it replaced SuperGlue as the default matcher in the hloc localization toolbox. If you are building a modern feature-based SLAM or relocalization pipeline today, SuperPoint (or similar) + LightGlue is the standard starting point.

## Related

- [SuperGlue](superglue.md) — the predecessor it accelerates
- [SuperPoint](superpoint.md) — the most common feature paired with it
- [LoFTR](loftr.md) — detector-free dense alternative
- [XFeat](xfeat.md) — lightweight features for the same efficiency goal
- [HF-Net](hf-net.md) — the hierarchical localization pipeline it slots into

[Back to Level 5](../README.md#level-5-applying-deep-learning)
