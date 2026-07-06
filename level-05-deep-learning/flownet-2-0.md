# FlowNet 2.0

> Ilg 2017 · [Paper](https://arxiv.org/abs/1612.01925)

**One-line summary** — Stacks multiple FlowNet modules with intermediate warping and adds a dedicated small-displacement sub-network, becoming the first deep method to match classical variational optical flow accuracy at near real-time speed.

## Key ideas

- **Stacked refinement**: chains FlowNet modules (FlowNetC followed by FlowNetS stages); each stage receives the first image, the second image warped by the current flow estimate, and the estimate itself, and learns to correct the residual error. Simply making a single FlowNet deeper did not work.
- **Warping between stages**: the second image is resampled with the current flow, $I_2^w(\mathbf{x}) = I_2(\mathbf{x} + \mathbf{f}(\mathbf{x}))$, bringing the classical coarse-to-fine warping idea into a learnable pipeline.
- **Small-displacement sub-network (FlowNet-SD)**: a specialized branch with smaller strides handles subtle motions that the main stack misses; a fusion module merges both outputs.
- **Training curriculum matters**: training first on the simple FlyingChairs, then the more complex FlyingThings3D, then the target domain proved critical — this schedule became standard practice for deep flow and stereo networks.
- Matched or exceeded classical variational methods on Sintel and KITTI while running near real time — roughly two orders of magnitude faster than the classical state of the art.

## Why it matters for SLAM

FlowNet 2.0 was the moment deep optical flow became genuinely usable: accurate enough to trust and fast enough for online pipelines, which made dense flow a realistic ingredient for visual odometry front-ends. Its stack-and-warp iterative refinement paradigm led directly to PWC-Net and ultimately to RAFT's recurrent updates — the mechanism at the heart of today's learned SLAM systems.

## Related

- [FlowNet](flownet.md) — the original end-to-end flow network it refines
- [PWC-Net](pwc-net.md) — distilled the same ideas into a far smaller architecture
- [RAFT](raft.md) — modern successor with all-pairs correlation and recurrent updates
- [FlowFormer](flowformer.md) — Transformer-era continuation of the accuracy race

[Back to Level 5](../README.md#level-5-applying-deep-learning)
