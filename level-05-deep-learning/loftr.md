# LoFTR

> Sun 2021 · [Paper](https://arxiv.org/abs/2104.00680)

**One-line summary** — Detector-free dense feature matching with Transformers: self- and cross-attention condition features on both images, producing reliable matches even in texture-poor regions where keypoint detectors fail.

## Key ideas

- **Detector-free paradigm**: Skips keypoint detection entirely — match densely first on a coarse grid, then filter by confidence — sidestepping the repeatability bottleneck of sparse detectors.
- **Coarse-to-fine matching**: A CNN extracts coarse (1/8) and fine (1/2) feature maps; coarse matches from mutual nearest neighbors are refined to sub-pixel accuracy with local cross-attention on 5x5 fine-feature windows.
- **Transformer conditioning**: Alternating self-attention and cross-attention (linear-attention Transformer for $O(n)$ complexity) gives every feature a global receptive field over both images, so textureless walls and floors can still be matched from context.
- **Two-stage supervision**: Coarse matches trained with cross-entropy on the grid, fine offsets with sub-pixel $\ell_2$ regression.
- Strongest gains on low-texture indoor scenes, where sparse pipelines like SuperPoint+SuperGlue lose the most.

## Why it matters for SLAM

Indoor SLAM constantly fails where there is nothing to detect — blank walls, floors, repetitive surfaces. LoFTR showed that a global-context matcher can produce correspondences there anyway, and it established the detector-free paradigm that RoMa, EfficientLoFTR, and many others build on. In practice it is a go-to choice for indoor reconstruction, wide-baseline relocalization, and loop-closure verification when sparse matching is too brittle, at the cost of more compute than sparse matchers.

## Related

- [SuperGlue](superglue.md) — the sparse learned-matching counterpart
- [LightGlue](lightglue.md) — fast sparse matcher; the efficiency-focused alternative
- [RoMa](roma.md) — dense matching with foundation-model features
- [SuperPoint](superpoint.md) — the detector-based paradigm LoFTR sidesteps

[Back to Level 5](../README.md#level-5-applying-deep-learning)
