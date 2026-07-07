# PWC-Net

> Sun 2018 · [Paper](https://arxiv.org/abs/1709.02371)

**One-line summary** — Compact 8.4M-parameter optical flow network built on three classical principles — Pyramid, Warping, and Cost volume — that was 17x smaller than FlowNet2 while more accurate.

## Problem

FlowNet showed optical flow could be learned end-to-end, but reaching classical-method accuracy required FlowNet2 — a stack of networks so large it was hard to train and impractical to deploy.

Decades of classical flow research had already identified what makes flow estimation work: coarse-to-fine pyramids, image warping, and matching-cost volumes. PWC-Net asked whether baking these simple, well-established principles *into the architecture* could produce a model that is simultaneously smaller, easier to train, and more accurate than brute-force network stacking.

## Key ideas

- **Learned feature pyramid**: A shared encoder extracts multi-scale features from both images, replacing the fixed image pyramids of classical coarse-to-fine flow — learnable features are more robust to shadows and lighting change than raw pixels.
- **Warping layer**: At each pyramid level, the second image's features are warped by the current upsampled flow estimate, $c_2^l(\mathbf{x} + \mathbf{w}^{l+1}(\mathbf{x}))$, so the network only needs to estimate a *residual* flow at each level — large motions are handled at coarse levels where they are small in pixels.
- **Partial cost volume**: Correlation between first-image features and warped second-image features is computed only within a small $D \times D$ search window per level. Because warping has already compensated for the coarse motion, a small window suffices, keeping memory and compute low.
- **Estimator CNN per level**: A small network on the cost volume + features predicts a flow update, which is upsampled and refined at the next finer level.
- **Context network**: A final stack of dilated convolutions post-processes the flow with a large receptive field, sharpening motion boundaries without another pyramid pass.
- **Design lesson**: Embedding domain knowledge (pyramid, warping, cost volume) into the architecture beats brute-force stacking of generic CNNs on size, trainability, and accuracy alike.

## Results & impact

- 17x smaller than FlowNet2 and easier to train.
- Outperformed all published optical flow methods at the time on the MPI Sintel final pass and KITTI 2015 benchmarks.
- Runs at about 35 fps on Sintel-resolution (1024x436) images — fast enough for real-time robotics pipelines.
- Became the canonical deep flow architecture for the pre-RAFT era; its coarse-to-fine limitation (small fast-moving objects vanish at coarse levels, and coarse errors are locked in) is precisely the failure mode RAFT's all-pairs correlation was designed to fix.

## Why it matters for SLAM

Dense optical flow provides data association for direct/dense SLAM front-ends, dynamic object reasoning, and self-supervised depth training. PWC-Net made high-quality flow cheap enough for real-time robotics pipelines and established the pyramid-warp-cost-volume design as the canonical deep flow architecture — the standard against which RAFT's all-pairs correlation was later defined. Its coarse-to-fine limitation (small displacements missed at fine levels, errors locked in at coarse levels) is precisely what RAFT fixed.

## Related

- [FlowNet](flownet.md) — first end-to-end deep optical flow network
- [FlowNet 2.0](flownet-2-0.md) — the large stacked predecessor PWC-Net shrank
- [RAFT](raft.md) — the all-pairs successor that superseded coarse-to-fine designs
- [SEA-RAFT](sea-raft.md) — where the efficiency-focused flow lineage stands today

[Back to Level 5](../README.md#level-5-applying-deep-learning)
