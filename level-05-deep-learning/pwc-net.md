# PWC-Net

> Sun 2018 · [Paper](https://arxiv.org/abs/1709.02371)

**One-line summary** — Compact 8.4M-parameter optical flow network built on three classical principles — Pyramid, Warping, and Cost volume — that was 17x smaller than FlowNet2 while more accurate.

## Key ideas

- **Learned feature pyramid**: A shared encoder extracts multi-scale features from both images, replacing fixed image pyramids used in classical coarse-to-fine flow.
- **Warping layer**: At each pyramid level, the second image's features are warped by the current (upsampled) flow estimate, so the network only needs to estimate a residual flow.
- **Partial cost volume**: Correlation between first-image features and warped second-image features is computed only within a small $D \times D$ search window per level, keeping memory and compute low.
- **Estimator CNN per level**: A small network on the cost volume + features predicts a flow update, which is upsampled and refined at the next finer level.
- **Design lesson**: Embedding domain knowledge (pyramid, warping, cost volume) into the architecture beats brute-force stacking of generic CNNs (FlowNet2) on both size and accuracy.

## Why it matters for SLAM

Dense optical flow provides data association for direct/dense SLAM front-ends, dynamic object reasoning, and self-supervised depth training. PWC-Net made high-quality flow cheap enough for real-time robotics pipelines and established the pyramid-warp-cost-volume design as the canonical deep flow architecture — the standard against which RAFT's all-pairs correlation was later defined. Its coarse-to-fine limitation (small displacements missed at fine levels, errors locked in at coarse levels) is precisely what RAFT fixed.

## Related

- [FlowNet](flownet.md) — first end-to-end deep optical flow network
- [FlowNet 2.0](flownet-2-0.md) — the large stacked predecessor PWC-Net shrank
- [RAFT](raft.md) — the all-pairs successor that superseded coarse-to-fine designs

[Back to Level 5](../README.md#level-5-applying-deep-learning)
