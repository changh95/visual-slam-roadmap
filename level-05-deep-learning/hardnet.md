# HardNet

> Mishchuk 2017 · [Paper](https://arxiv.org/abs/1705.10872)

**One-line summary** — Learns a compact 128-dim local patch descriptor by maximizing the margin between the hardest positive and the hardest negative within each training batch, showing that mining strategy beats architecture complexity.

## Key ideas

- **Hardest-in-batch triplet loss**: for a batch of matching pairs $\{(a_i, p_i)\}$, each anchor is contrasted against its closest impostor:
  $$\mathcal{L} = \frac{1}{N}\sum_{i=1}^{N} \max\bigl(0,\; 1 + d(a_i, p_i) - \min_{j \neq i} d(a_i, p_j)\bigr)$$
  Random-negative triplet losses waste capacity on easy examples; focusing on the hardest negatives forces the most discriminative descriptor space (analogous to SVMs focusing on support vectors).
- **Simple architecture**: an L2Net-style 7-layer CNN on $32 \times 32$ grayscale patches, outputting an $\ell_2$-normalized 128-dim descriptor — deliberately SIFT-compatible in dimensionality.
- **Loss over architecture**: the paper's central lesson is that negative mining design dominates network design for descriptor learning.
- Clear improvements over SIFT on HPatches matching across illumination and viewpoint changes, with fast per-patch GPU inference.

## Why it matters for SLAM

HardNet descriptors became a popular drop-in replacement for SIFT in SfM and SLAM pipelines: same 128-dim interface, better robustness to appearance change. More influentially, its hardest-in-batch mining became the standard training recipe for descriptor learning, adopted by SOSNet, HyNet, and the descriptor branches of joint detector-descriptor networks like DISK. It marks the "learned descriptors on classical keypoints" step in the evolution toward fully learned front-ends.

## Related

- [SuperPoint](superpoint.md) — joint detector + descriptor successor paradigm
- [DISK](disk.md) — end-to-end feature learning influenced by HardNet's loss design
- [R2D2](r2d2.md) — adds reliability-aware detection to descriptor learning
- [Keypoints](../level-02-getting-familiar/keypoints.md) — classical feature background these methods replace

[Back to Level 5](../README.md#level-5-applying-deep-learning)
