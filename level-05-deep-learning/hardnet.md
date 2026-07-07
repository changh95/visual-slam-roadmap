# HardNet

> Mishchuk 2017 · [Paper](https://arxiv.org/abs/1705.10872)

**One-line summary** — Learns a compact 128-dim local patch descriptor by maximizing the margin between the hardest positive and the hardest negative within each training batch, showing that mining strategy beats architecture complexity.

## Problem

Classical descriptors like SIFT are hand-crafted and limited in discriminative power under strong appearance change, while early learned descriptors (MatchNet, DeepCompare) trained with contrastive or standard triplet losses that sample *random* negatives — wasting most gradient updates on pairs that are already easy to separate. HardNet's starting point is Lowe's matching criterion for SIFT (the first-to-second-nearest-neighbor ratio test): a good descriptor is one whose correct match is closer than its *closest incorrect* match, so that is exactly what training should optimize.

## Key ideas

- **Hardest-in-batch triplet loss**: for a batch of $N$ matching pairs $\{(a_i, p_i)\}$, each anchor is contrasted against its closest impostor:
  $$\mathcal{L} = \frac{1}{N}\sum_{i=1}^{N} \max\bigl(0,\; 1 + d(a_i, p_i) - \min_{j \neq i} d(a_i, p_j)\bigr)$$
  Focusing on the hardest negatives forces the most discriminative descriptor space — analogous to SVMs concentrating on support vectors.
- **Loss over architecture**: the paper shows this simple loss beats complex regularization schemes, and that it works for both shallow and deep convolutional architectures — mining design dominates network design.
- **Simple architecture**: an L2Net-style 7-layer CNN (channels growing 32 → 128, stride-2 convolutions instead of pooling, batch norm) on $32 \times 32$ grayscale patches, outputting an $\ell_2$-normalized 128-dim descriptor — deliberately SIFT-compatible in dimensionality.
- **Large batches enable good mining**: training on the Brown/UBC patch dataset with batch size 1024 gives each anchor a big pool of candidate negatives, making "hardest-in-batch" a strong approximation of truly hard negatives.

## Results & impact

- State-of-the-art at publication in wide-baseline stereo, patch verification, and instance retrieval benchmarks, improving over SIFT across illumination and viewpoint changes — competitive with much larger networks despite its compact size.
- Fast: computing a descriptor takes about 1 millisecond on a low-end GPU.
- Its hardest-in-batch mining became the standard descriptor-learning recipe, adopted by SOSNet, HyNet, and the descriptor branches of joint detector-descriptor networks like DISK; the 128-dim compact format kept it drop-in compatible with SIFT-based SfM/SLAM pipelines.

## Why it matters for SLAM

HardNet descriptors became a popular drop-in replacement for SIFT in SfM and SLAM pipelines: same 128-dim interface, better robustness to appearance change. More influentially, its hardest-in-batch mining became the standard training recipe for descriptor learning, adopted by SOSNet, HyNet, and the descriptor branches of joint detector-descriptor networks like DISK. It marks the "learned descriptors on classical keypoints" step in the evolution toward fully learned front-ends.

## Related

- [SuperPoint](superpoint.md) — joint detector + descriptor successor paradigm
- [DISK](disk.md) — end-to-end feature learning influenced by HardNet's loss design
- [R2D2](r2d2.md) — adds reliability-aware detection to descriptor learning
- [Keypoints](../level-02-getting-familiar/keypoints.md) — classical feature background these methods replace
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md) — the matching problem descriptors exist to solve

[Back to Level 5](../README.md#level-5-applying-deep-learning)
