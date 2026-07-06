# FlowNet

> Dosovitskiy 2015 · [Paper](https://arxiv.org/abs/1504.06852)

**One-line summary** — First end-to-end CNN for optical flow estimation, introducing the correlation layer and the synthetic FlyingChairs training dataset that became standard across the field.

## Key ideas

- **Two architectures**: *FlowNetSimple* stacks both images into a 6-channel input and lets an encoder-decoder learn the comparison implicitly; *FlowNetCorr* processes each image in a separate branch and compares them with an explicit correlation layer:
  $$c(\mathbf{x}_1, \mathbf{x}_2) = \sum_{\mathbf{o} \in [-k,k]^2} \langle f_1(\mathbf{x}_1 + \mathbf{o}),\; f_2(\mathbf{x}_2 + \mathbf{o}) \rangle$$
- **Correlation layer**: this explicit patch-similarity operation encodes visual matching directly into the network — it became a fundamental building block reused by PWC-Net, RAFT, and essentially every later flow network.
- **Encoder-decoder with skip connections** and multi-scale flow supervision at each decoder level recovers dense full-resolution flow.
- **Synthetic training data**: dense real-world flow ground truth is nearly impossible to collect, so the authors rendered FlyingChairs — 22k synthetic image pairs with exact ground-truth flow. Training on synthetic data and transferring to real imagery became the universal recipe (FlyingThings3D, AutoFlow, Kubric).
- Competitive with classical variational methods while running at interactive rates on a GPU — orders of magnitude faster.

## Why it matters for SLAM

FlowNet launched the entire deep optical flow field, whose descendants (RAFT and its variants) now serve as the dense correspondence engines inside learned visual odometry and SLAM systems such as DROID-SLAM. Its two core contributions — the correlation layer and synthetic-data pretraining — are still load-bearing in today's SLAM front-ends a decade later.

## Related

- [FlowNet 2.0](flownet-2-0.md) — stacked refinement that reached classical-method accuracy
- [PWC-Net](pwc-net.md) — compact pyramid/warping/cost-volume successor
- [RAFT](raft.md) — all-pairs correlation architecture that superseded this lineage
- [FlowNet3D](flownet3d.md) — the same idea transplanted to 3D point clouds

[Back to Level 5](../README.md#level-5-applying-deep-learning)
