# LoFTR

> Sun 2021 · [Paper](https://arxiv.org/abs/2104.00680)

**One-line summary** — Detector-free dense feature matching with Transformers: self- and cross-attention condition features on both images, producing reliable matches even in texture-poor regions where keypoint detectors fail.

## Problem

The classical pipeline performs feature detection, description, and matching *sequentially*, so everything hinges on the detector producing repeatable interest points in both images — which detectors notoriously fail to do in low-texture areas (blank walls, floors) and under repetitive patterns. Existing dense alternatives searched correspondences through cost volumes, which is expensive and still relies on local evidence. LoFTR asks: can we skip detection entirely and let a Transformer's global receptive field decide what matches, conditioned on both images at once?

## Key ideas

- **Detector-free paradigm**: Establish pixel-wise dense matches at a coarse level first, then refine the good ones at a fine level — sidestepping the repeatability bottleneck of sparse detectors entirely.
- **Coarse-to-fine matching**: A CNN (ResNet + FPN) extracts coarse (1/8 resolution) and fine (1/2 resolution) feature maps; mutual-nearest-neighbor selection on the coarse level proposes matches that are refined to sub-pixel accuracy using local 5x5 windows on the fine features.
- **Transformer conditioning**: Alternating self-attention and cross-attention layers (a linear-attention Transformer for $O(n)$ complexity) yield feature descriptors conditioned on *both* images. The global receptive field is what lets textureless regions be matched from surrounding context.
- **Two-stage supervision**: Coarse matches are trained with cross-entropy on the match grid; fine offsets with sub-pixel $\ell_2$ regression.
- **Where it wins**: The gains are largest exactly where sparse pipelines (SuperPoint + SuperGlue) lose the most — low-texture indoor scenes.

## Results & impact

The experiments on indoor (ScanNet) and outdoor (MegaDepth) datasets show LoFTR outperforming state-of-the-art methods by a large margin, with gains most pronounced in low-texture indoor scenes where sparse pipelines like SuperPoint+SuperGlue struggle. At publication it ranked first among published methods on two public visual localization benchmarks. It established the detector-free matching paradigm and inspired a family of successors including EfficientLoFTR, RoMa, and GIM.

## Why it matters for SLAM

Indoor SLAM constantly fails where there is nothing to detect — blank walls, floors, repetitive surfaces. LoFTR showed that a global-context matcher can produce correspondences there anyway, and it established the detector-free paradigm that RoMa, EfficientLoFTR, and many others build on. In practice it is a go-to choice for indoor reconstruction, wide-baseline relocalization, and loop-closure verification when sparse matching is too brittle, at the cost of more compute than sparse matchers.

## Related

- [SuperGlue](superglue.md) — the sparse learned-matching counterpart
- [LightGlue](lightglue.md) — fast sparse matcher; the efficiency-focused alternative
- [RoMa](roma.md) — dense matching with foundation-model features
- [SuperPoint](superpoint.md) — the detector-based paradigm LoFTR sidesteps
- [HF-Net](hf-net.md) — visual localization pipeline where detector-free matchers slot in

[Back to Level 5](../README.md#level-5-applying-deep-learning)
