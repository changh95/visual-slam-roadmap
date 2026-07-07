# RAFT

> Teed 2020 · [Paper](https://arxiv.org/abs/2003.12039)

**One-line summary** — Builds a 4D all-pairs correlation volume and iteratively refines a single high-resolution optical flow field with a weight-tied ConvGRU that looks up correlations around the current estimate — ECCV 2020 Best Paper and the defining architecture of modern optical flow.

## Problem

The dominant deep flow architectures (PWC-Net and kin) inherited the classical coarse-to-fine pyramid: estimate flow at low resolution, then warp and refine. That design has structural blind spots — the cost volume at each level covers only a small search window, small fast-moving objects disappear at coarse resolutions, mistakes made early in the pyramid are difficult to undo, and multi-stage cascades often need over 1M training iterations. Prior iterative-refinement schemes did not tie weights across iterations (or, like IRR, were limited by their large recurrent unit). RAFT asks: what if the network precomputes matching costs between *all* pixel pairs, and a lightweight learned optimizer refines one high-resolution flow field by querying that volume as needed?

## Method & architecture

Three stages, all differentiable and trained end-to-end:

1. **Feature extraction**: an encoder $g_\theta : \mathbb{R}^{H \times W \times 3} \mapsto \mathbb{R}^{H/8 \times W/8 \times D}$ ($D = 256$, 6 residual blocks) encodes both frames; a context network $h_\theta$ of identical architecture encodes $I_1$ only. Both run once per pair.
2. **All-pairs correlation**: visual similarity is precomputed for every pixel pair as a single matrix multiplication,

$$C_{ijkl} = \sum_h g_\theta(I_1)_{ijh} \cdot g_\theta(I_2)_{klh}, \qquad \mathbf{C} \in \mathbb{R}^{H \times W \times H \times W}$$

   then the last two dimensions are average-pooled with kernels 1, 2, 4, 8 into a pyramid $\{\mathbf{C}^1, \mathbf{C}^2, \mathbf{C}^3, \mathbf{C}^4\}$. Pooling only the $I_2$ dimensions keeps the $I_1$ dimensions at full (1/8) resolution — large and small displacements are both captured without losing small fast-moving objects. A lookup operator $L_\mathbf{C}$ bilinearly samples each level on a local grid around the current correspondence $\mathbf{x}' = \mathbf{x} + \mathbf{f}(\mathbf{x})$,

$$\mathcal{N}(\mathbf{x}')_r = \{ \mathbf{x}' + \mathbf{dx} \mid \mathbf{dx} \in \mathbb{Z}^2,\ \lVert \mathbf{dx} \rVert_1 \le r \}$$

   indexed at $\mathcal{N}(\mathbf{x}'/2^k)_r$ per level $k$ — a constant radius spans larger context at coarser levels (radius 4 at $k=4$ covers 256 pixels at original resolution).
3. **Iterative updates**: starting from $\mathbf{f}_0 = \mathbf{0}$, a recurrent update operator (only 2.7M parameters, weights tied across all iterations) consumes correlation lookups, flow features, and context features $x_t$, and emits residual updates $\mathbf{f}_{k+1} = \mathbf{f}_k + \Delta\mathbf{f}$ via a convolutional GRU:

$$z_t = \sigma(\mathrm{Conv}_{3\times3}([h_{t-1}, x_t], W_z)), \qquad r_t = \sigma(\mathrm{Conv}_{3\times3}([h_{t-1}, x_t], W_r))$$

$$\tilde{h}_t = \tanh(\mathrm{Conv}_{3\times3}([r_t \odot h_{t-1}, x_t], W_h)), \qquad h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t$$

   The operator mimics a first-order optimizer — but instead of a Taylor-linearized data term it *learns* to propose the descent direction; bounded activations encourage convergence to a fixed point, and it can run 100+ iterations without diverging. Flow is predicted at 1/8 resolution and upsampled by a learned convex combination over each pixel's 3x3 coarse neighborhood (weights via softmax).

Supervision covers the whole sequence of estimates with exponentially increasing weights:

$$\mathcal{L} = \sum_{i=1}^{N} \gamma^{N-i} \lVert \mathbf{f}_{gt} - \mathbf{f}_i \rVert_1, \qquad \gamma = 0.8$$

Training follows FlyingChairs then FlyingThings, then benchmark fine-tuning; on video, warm-start initialization forward-projects the previous frame's flow.

## Results

- **Sintel (final pass, test)**: EPE 2.855 px, a 30% error reduction from the best published result (4.098 px); ranked 1st on both clean and final passes. **KITTI**: F1-all 5.10%, a 16% reduction from the best published result (6.10%), ranked 1st among all optical flow methods.
- **Generalization**: trained only on synthetic C+T data, 5.04 px EPE on KITTI-15 (train) vs 8.36 for the best prior deep network (40% reduction); Sintel train clean EPE 1.43, 29% lower than FlowNet2.
- **Efficiency**: 10 fps on 1088x436 video (GTX 1080Ti); trains with 10x fewer iterations than other architectures; the 1M-parameter RAFT-S outperforms PWC-Net and VCN, both over 6x larger. In ablations RAFT surpasses PWC-Net after 3 update iterations and FlowNet2 after 6; it scales to 1080p DAVIS video (550 ms for 12 iterations, of which all-pairs correlation is 95 ms).
- Ablations confirm each choice: GRU beats plain convolutions, tied weights beat untied, all-pairs beats windowed correlation and warping-based refinement, learned upsampling beats bilinear.

## Why it matters for SLAM

RAFT's "correlation volume + iterative recurrent refinement" recipe became the workhorse of learned data association in SLAM: DROID-SLAM and DPVO are essentially RAFT-style update operators wrapped around a differentiable bundle adjustment layer. Its descendants (RAFT-3D for scene flow, SEA-RAFT for real-time) dominate flow benchmarks, and the pattern of unrolled, learned optimization it popularized now appears across dense prediction and SLAM systems.

## Related

- [PWC-Net](pwc-net.md) — the coarse-to-fine predecessor it superseded
- [RAFT-3D](raft-3d.md) — extension to 3D scene flow with rigid-motion embeddings
- [SEA-RAFT](sea-raft.md) — simple, efficient, real-time RAFT variant
- [FlowFormer](flowformer.md) — Transformer-based successor for cost-volume reasoning
- [DROID-SLAM](droid-slam.md) — RAFT machinery turned into a full SLAM system
- [DPVO](dpvo.md) — sparse patch-based odometry from the same lineage
