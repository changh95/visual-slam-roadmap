# LightGlue

> Lindenberger 2023 · [Paper](https://arxiv.org/abs/2306.13643)

**One-line summary** — Redesigned SuperGlue that is 5-10x faster through adaptive depth and width: easy image pairs exit the network early, and confidently matched or rejected keypoints are pruned from further computation.

## Key ideas

- **Adaptive depth (early exit)**: A learned per-keypoint confidence at each transformer layer decides whether the matcher can stop early — easy pairs need only a few layers, hard pairs use the full depth.
- **Adaptive width (keypoint pruning)**: Keypoints that are confidently matched or confidently unmatchable are removed from later layers, cutting the quadratic attention cost.
- **Architecture cleanup**: Simplified positional encodings and attention blocks compatible with efficient (flash) attention, plus a more stable training recipe than SuperGlue.
- **Multi-feature support**: Works with SuperPoint, DISK, SIFT, and ALIKED descriptors, making it a plug-in matcher across front-ends.
- Matches SuperGlue accuracy while running fast enough for real-time use, including on modest hardware.

## Why it matters for SLAM

SuperGlue proved learned matching is more robust than nearest-neighbor + ratio test, but its fixed compute budget made it awkward for real-time SLAM. LightGlue's insight — spend compute proportional to problem difficulty — made learned matching practical on embedded and mobile platforms, and it replaced SuperGlue as the default matcher in the hloc localization toolbox. If you are building a modern feature-based SLAM or relocalization pipeline today, SuperPoint (or similar) + LightGlue is the standard starting point.

## Related

- [SuperGlue](superglue.md) — the predecessor it accelerates
- [SuperPoint](superpoint.md) — the most common feature paired with it
- [LoFTR](loftr.md) — detector-free dense alternative
- [XFeat](xfeat.md) — lightweight features for the same efficiency goal
- [HF-Net](hf-net.md) — the hierarchical localization pipeline it slots into

[Back to Level 5](../README.md#level-5-applying-deep-learning)
