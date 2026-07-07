# FlowNet

> Dosovitskiy 2015 · [Paper](https://arxiv.org/abs/1504.06852)

**One-line summary** — First end-to-end CNN for optical flow estimation, introducing the correlation layer and the synthetic FlyingChairs training dataset that became standard across the field.

## Problem

By 2015 CNNs had transformed recognition tasks, but optical flow was not among their successes: classical variational methods (Horn-Schunck lineage, EpicFlow-era pipelines) still ruled, at the cost of seconds per frame and hand-tuned energy functions. Two obstacles stood in the way of learning flow: nobody knew what architecture could express dense two-frame correspondence, and no dataset existed with dense ground-truth flow at training scale — real-world dense flow ground truth is nearly impossible to acquire. FlowNet attacked both.

## Key ideas

- **Two architectures**: *FlowNetSimple* stacks both images into a 6-channel input and lets a generic encoder-decoder learn the comparison implicitly; *FlowNetCorr* processes each image in a separate branch and compares them with an explicit correlation layer:
  $$c(\mathbf{x}_1, \mathbf{x}_2) = \sum_{\mathbf{o} \in [-k,k]^2} \langle f_1(\mathbf{x}_1 + \mathbf{o}),\; f_2(\mathbf{x}_2 + \mathbf{o}) \rangle$$
- **Correlation layer**: this explicit patch-similarity operation encodes visual matching directly into the network — it became a fundamental building block reused by PWC-Net, RAFT, and essentially every later flow network.
- **Encoder-decoder with skip connections**: a contracting path extracts multi-scale features and an expanding path with skip connections recovers resolution, with multi-scale flow supervision at each decoder level.
- **Synthetic training data**: the authors rendered FlyingChairs — 22k synthetic image pairs of chairs over random backgrounds with exact ground-truth flow. Networks trained on this deliberately unrealistic data still generalize well to real imagery.
- **Synthetic-to-real transfer as a recipe**: training on synthetic data and evaluating on Sintel/KITTI became the universal deep-flow methodology (FlyingThings3D, AutoFlow, Kubric all follow it).

## Results & impact

- Competitive accuracy with classical methods on Sintel and KITTI at frame rates of 5 to 10 fps — orders of magnitude faster than variational optimization.
- FlowNetCorr's edge over FlowNetSimple validated building explicit matching operations into the architecture.
- Launched the entire deep optical flow field; its two core artifacts — the correlation layer and the synthetic-data training pipeline — remain load-bearing a decade later.

## Why it matters for SLAM

FlowNet launched the entire deep optical flow field, whose descendants (RAFT and its variants) now serve as the dense correspondence engines inside learned visual odometry and SLAM systems such as DROID-SLAM. Its two core contributions — the correlation layer and synthetic-data pretraining — are still load-bearing in today's SLAM front-ends a decade later.

## Related

- [FlowNet 2.0](flownet-2-0.md) — stacked refinement that reached classical-method accuracy
- [PWC-Net](pwc-net.md) — compact pyramid/warping/cost-volume successor
- [RAFT](raft.md) — all-pairs correlation architecture that superseded this lineage
- [FlowNet3D](flownet3d.md) — the same idea transplanted to 3D point clouds

[Back to Level 5](../README.md#level-5-applying-deep-learning)
