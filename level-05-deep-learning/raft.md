# RAFT

> Teed 2020 · [Paper](https://arxiv.org/abs/2003.12039)

**One-line summary** — Builds a 4D all-pairs correlation volume and iteratively refines optical flow with a ConvGRU that looks up correlations around the current estimate — ECCV 2020 Best Paper and the defining architecture of modern optical flow.

## Problem

The dominant deep flow architecture (PWC-Net) inherited the classical coarse-to-fine pyramid: estimate flow at low resolution, then warp and refine. That design has structural blind spots — the cost volume at each level only covers a small search window, small fast-moving objects disappear at coarse resolutions, and mistakes made early in the pyramid are difficult to undo at finer levels.

RAFT asked: what if the network precomputes matching costs between *all* pixel pairs, and a learned iterative optimizer refines a single high-resolution flow field by querying that volume as needed — the deep-learning analogue of a classical variational solver iterating on a data term?

## Key ideas

- **All-pairs correlation**: Per-pixel features $\mathbf{g}(\mathbf{x})$ are extracted at 1/8 resolution, and correlation $C(\mathbf{x}_1, \mathbf{x}_2) = \langle \mathbf{g}(\mathbf{x}_1), \mathbf{g}(\mathbf{x}_2) \rangle$ is precomputed for *every* pixel pair, then average-pooled into a 4-level pyramid $\{C^1, C^2, C^4, C^8\}$. Unlike PWC-Net's windowed cost volume, no displacement is out of reach.
- **Iterative ConvGRU update**: A recurrent update operator repeatedly looks up correlation values in a local grid around the current flow estimate and emits a residual update $\mathbf{f}^{k+1} = \mathbf{f}^k + \Delta\mathbf{f}$ — mimicking the iterations of a classical first-order optimizer, but with learned update rules. Weights are shared across iterations.
- **Single resolution, many iterations**: Replaces the coarse-to-fine pyramid (where coarse errors are hard to undo) with iterative refinement of one high-resolution field; a separate context encoder feeds scene information into the update operator.
- **Correlation pyramid ≠ image pyramid**: Pooling the *correlation volume* (not the image) preserves fine spatial resolution in the first image while still capturing large displacements — the lookup radius covers big motions at coarse correlation levels without sacrificing localization.
- **Supervision over all iterations**: Exponentially weighted $\ell_1$ loss $\mathcal{L} = \sum_i \gamma^{N-i}\|\mathbf{f}^i - \mathbf{f}^{gt}\|_1$ trains every refinement step, so the trajectory of estimates converges quickly and extra inference iterations still help.
- **Learned optimization as a pattern**: The recipe — build a matching-cost data structure, then unroll a learned recurrent optimizer over it — generalizes far beyond flow, which is exactly why it propagated into SLAM.

## Results & impact

- On KITTI, F1-all error of 5.10%, a 16% error reduction from the best published result (6.10%); on Sintel (final pass), 2.855 px end-point-error, a 30% reduction from the best published result (4.098 px).
- Strong cross-dataset generalization and high efficiency in inference time, training speed, and parameter count — it did not buy accuracy with scale.
- ECCV 2020 Best Paper; RAFT variants and descendants (RAFT-3D, SEA-RAFT, FlowFormer and other transformer hybrids) have dominated flow benchmarks since.
- The all-pairs-correlation + ConvGRU update operator became the backbone of learned SLAM: DROID-SLAM and DPVO are RAFT-style update operators wrapped around differentiable bundle adjustment.

## Why it matters for SLAM

RAFT's "correlation volume + iterative recurrent refinement" recipe became the workhorse of learned data association in SLAM: DROID-SLAM and DPVO are essentially RAFT-style update operators wrapped around a differentiable bundle adjustment layer. Its descendants (RAFT-3D for scene flow, SEA-RAFT for real-time) dominate flow benchmarks, and the pattern of unrolled, learned optimization it popularized now appears across dense prediction and SLAM systems.

## Related

- [PWC-Net](pwc-net.md) — the coarse-to-fine predecessor it superseded
- [RAFT-3D](raft-3d.md) — extension to 3D scene flow with rigid-motion embeddings
- [SEA-RAFT](sea-raft.md) — simple, efficient, real-time RAFT variant
- [FlowFormer](flowformer.md) — Transformer-based successor for cost-volume reasoning
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — RAFT machinery turned into a full SLAM system
- [DPVO](../level-03-monocular-slam/dpvo.md) — sparse patch-based odometry from the same lineage

[Back to Level 5](../README.md#level-5-applying-deep-learning)
