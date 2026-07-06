# RAFT

> Teed 2020 · [Paper](https://arxiv.org/abs/2003.12039)

**One-line summary** — Builds a 4D all-pairs correlation volume and iteratively refines optical flow with a ConvGRU that looks up correlations around the current estimate — ECCV 2020 Best Paper and the defining architecture of modern optical flow.

## Key ideas

- **All-pairs correlation**: Per-pixel features $\mathbf{g}(\mathbf{x})$ are extracted at 1/8 resolution, and correlation $C(\mathbf{x}_1, \mathbf{x}_2) = \langle \mathbf{g}(\mathbf{x}_1), \mathbf{g}(\mathbf{x}_2) \rangle$ is precomputed for *every* pixel pair, then average-pooled into a 4-level pyramid. Unlike PWC-Net's windowed cost volume, no displacement is out of reach.
- **Iterative ConvGRU update**: A recurrent update operator repeatedly looks up correlation values around the current flow estimate and emits a residual update $\mathbf{f}^{k+1} = \mathbf{f}^k + \Delta\mathbf{f}$, mimicking the iterations of a classical optimizer — but learned.
- **Single resolution, many iterations**: Replaces the coarse-to-fine pyramid (where coarse errors are hard to undo) with iterative refinement at one resolution.
- **Supervision over all iterations**: Exponentially weighted $\ell_1$ loss $\mathcal{L} = \sum_i \gamma^{N-i}\|\mathbf{f}^i - \mathbf{f}^{gt}\|_1$ trains every refinement step.
- **Strong generalization**: Large error reductions on Sintel and KITTI with notably good cross-dataset transfer.

## Why it matters for SLAM

RAFT's "correlation volume + iterative recurrent refinement" recipe became the workhorse of learned data association in SLAM: DROID-SLAM and DPVO are essentially RAFT-style update operators wrapped around a differentiable bundle adjustment layer. Its descendants (RAFT-3D for scene flow, SEA-RAFT for real-time) dominate flow benchmarks, and the pattern of unrolled, learned optimization it popularized now appears across dense prediction and SLAM systems.

## Related

- [PWC-Net](pwc-net.md) — the coarse-to-fine predecessor it superseded
- [RAFT-3D](raft-3d.md) — extension to 3D scene flow with rigid-motion embeddings
- [SEA-RAFT](sea-raft.md) — simple, efficient, real-time RAFT variant
- [FlowFormer](flowformer.md) — Transformer-based successor for cost-volume reasoning
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — RAFT machinery turned into a full SLAM system

[Back to Level 5](../README.md#level-5-applying-deep-learning)
