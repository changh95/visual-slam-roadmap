# FlowNet 2.0

> Ilg 2017 · [Paper](https://arxiv.org/abs/1612.01925)

**One-line summary** — Stacks multiple FlowNet modules with intermediate warping and adds a dedicated small-displacement sub-network, becoming the first deep method to match classical variational optical flow accuracy at near real-time speed.

## Problem

FlowNet demonstrated that optical flow estimation can be cast as a learning problem, but the state of the art in flow *quality* was still defined by traditional variational methods — particularly on small displacements and real-world data, where FlowNet could not compete. Simply making a single FlowNet deeper or wider did not help due to optimization difficulties. The missing ingredient was iterative refinement: classical methods progressively refine a coarse estimate, and FlowNet 2.0 rebuilds that mechanism inside a learnable pipeline.

## Key ideas

- **Stacked refinement**: chains FlowNet modules (FlowNetC followed by FlowNetS stages); each stage receives the first image, the second image warped by the current flow estimate, and the estimate itself, and learns to correct the residual error.
- **Warping between stages**: the second image is resampled with the current flow via bilinear interpolation, $I_2^w(\mathbf{x}) = I_2(\mathbf{x} + \mathbf{f}(\mathbf{x}))$, bringing the classical coarse-to-fine warping idea into a learnable pipeline.
- **Small-displacement sub-network (FlowNet-SD)**: a specialized branch with smaller strides and no correlation layer handles the subtle motions the main stack misses; a fusion module merges both outputs.
- **Training data schedules matter**: one of the paper's three headline contributions is showing that the *order* of presenting training data is critical — first the simple FlyingChairs, then the more complex FlyingThings3D, then the target domain. This curriculum became standard practice for deep flow and stereo networks.
- **Speed/accuracy family**: alongside the full model, faster variants trade accuracy for throughput, giving practitioners a spectrum of deployable models from one design.

## Results & impact

- The paper reports a decrease of FlowNet's estimation error by more than 50% while being only marginally slower, performing on par with state-of-the-art classical methods at interactive frame rates (published Sintel test EPE: 4.16 clean / 5.74 final).
- The faster variants compute flow at up to 140 fps while matching the original FlowNet's accuracy.
- First deep method to genuinely rival classical variational flow — the moment learned flow became a practical component; its stack-and-warp refinement led directly to PWC-Net and ultimately RAFT's recurrent updates.

## Why it matters for SLAM

FlowNet 2.0 was the moment deep optical flow became genuinely usable: accurate enough to trust and fast enough for online pipelines, which made dense flow a realistic ingredient for visual odometry front-ends. Its stack-and-warp iterative refinement paradigm led directly to PWC-Net and ultimately to RAFT's recurrent updates — the mechanism at the heart of today's learned SLAM systems.

## Related

- [FlowNet](flownet.md) — the original end-to-end flow network it refines
- [PWC-Net](pwc-net.md) — distilled the same ideas into a far smaller architecture
- [RAFT](raft.md) — modern successor with all-pairs correlation and recurrent updates
- [FlowFormer](flowformer.md) — Transformer-era continuation of the accuracy race

[Back to Level 5](../README.md#level-5-applying-deep-learning)
