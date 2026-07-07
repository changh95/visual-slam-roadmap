# PWC-Net

> Sun 2018 · [Paper](https://arxiv.org/abs/1709.02371)

**One-line summary** — Compact optical flow network built on three classical principles — Pyramid, Warping, and Cost volume — that was 17x smaller than FlowNet2 and 2x faster at inference while more accurate on the major benchmarks.

## Problem

FlowNet showed optical flow could be learned end-to-end, but reaching classical-method accuracy required FlowNet2 — a stack of networks with a 640MB memory footprint whose sub-networks must be trained sequentially to avoid overfitting.

Decades of classical flow research had already identified what makes flow estimation work: coarse-to-fine pyramids, image warping, and matching-cost volumes. PWC-Net asked whether baking these simple, well-established principles *into the architecture* could produce a model that is simultaneously smaller, easier to train, and more accurate than brute-force network stacking.

## Method & architecture

- **Learnable feature pyramid**: a shared encoder builds an $L$-level pyramid (7 levels used), downsampling by 2 per level with feature channels 16, 32, 64, 96, 128, 196 at levels 1–6; the zeroth level is the input images. Learned features replace fixed image pyramids because raw pixels are variant to shadows and lighting changes.
- **Warping layer**: at level $l$, features of the second image are warped toward the first using the x2-upsampled flow from level $l{+}1$,

$$c_w^l(\mathbf{x}) = c_2^l\big(\mathbf{x} + \mathrm{up}_2(\mathbf{w}^{l+1})(\mathbf{x})\big)$$

  implemented with bilinear interpolation (differentiable), so each level only estimates a residual motion — large displacements are handled at coarse levels where they are small in pixels.
- **Partial cost volume**: matching cost is the correlation between first-image features and warped second-image features,

$$\mathbf{cv}^l(\mathbf{x}_1, \mathbf{x}_2) = \frac{1}{N}\, c_1^l(\mathbf{x}_1)^\top c_w^l(\mathbf{x}_2), \qquad |\mathbf{x}_1 - \mathbf{x}_2|_\infty \le d$$

  computed only within a search range of $d = 4$ pixels per level — a one-pixel motion at the top level equals $2^{L-1}$ pixels at full resolution, so a tiny range suffices. The warping and cost-volume layers have *no learnable parameters*, shrinking the model.
- **Optical flow estimator**: a multi-layer CNN (channels 128, 128, 96, 64, 32, optionally with DenseNet connections) takes the cost volume, first-image features, and upsampled flow, and predicts the flow at each level (separate weights per level); estimation stops at level $l_0 = 2$, i.e. quarter resolution, then bilinear upsampling.
- **Context network**: 7 dilated 3x3 convolutions (dilation constants 1, 2, 4, 8, 16, 1, 1) post-process the flow with a large receptive field, playing the role of classical median/bilateral filtering.
- **Training**: the FlowNet multiscale loss $\mathcal{L}(\Theta) = \sum_{l=l_0}^{L} \alpha_l \sum_{\mathbf{x}} |\mathbf{w}_\Theta^l(\mathbf{x}) - \mathbf{w}_{GT}^l(\mathbf{x})|_2 + \gamma |\Theta|_2$ on FlyingChairs then FlyingThings3D (the FlowNet2 $S_{long}$/$S_{fine}$ schedules), followed by benchmark fine-tuning with a robust loss $\sum_l \alpha_l \sum_{\mathbf{x}} \big(|\mathbf{w}_\Theta^l(\mathbf{x}) - \mathbf{w}_{GT}^l(\mathbf{x})| + \epsilon\big)^q + \gamma|\Theta|_2$ with $q < 1$ to down-weight outliers.

## Results

- **MPI Sintel final pass (test)**: EPE 5.04 (PWC-Net-ft-final) / 5.13 (PWC-Net-ft) — at the time of writing lower than all published methods (FlowNet2-ft: 5.74; DCFlow: 5.12), the first time an end-to-end method outperformed well-engineered traditional methods on this benchmark, and the fastest among the top performers.
- **KITTI 2015 (test)**: Fl-all 9.60%, outperforming all published two-frame flow methods (FlowNet2-ft: 10.41%); on KITTI 2012, Fl-Noc 4.22%, second only to SDF which assumes a rigid background.
- **Size and speed**: 17x smaller than FlowNet2, 2x faster inference, easier to train than SpyNet and FlowNet2; about 35 fps on Sintel-resolution (1024x436) images. Dropping the DenseNet connections (PWC-Net-small) trades ~5% accuracy for 40% more speed.

## Why it matters for SLAM

Dense optical flow provides data association for direct/dense SLAM front-ends, dynamic object reasoning, and self-supervised depth training. PWC-Net made high-quality flow cheap enough for real-time robotics pipelines and established the pyramid-warp-cost-volume design as the canonical deep flow architecture — the standard against which RAFT's all-pairs correlation was later defined. Its coarse-to-fine limitation (small fast-moving objects vanish at coarse levels, and coarse errors are locked in) is precisely the failure mode RAFT was designed to fix.

## Related

- [FlowNet](flownet.md) — first end-to-end deep optical flow network
- [FlowNet 2.0](flownet-2-0.md) — the large stacked predecessor PWC-Net shrank
- [RAFT](raft.md) — the all-pairs successor that superseded coarse-to-fine designs
- [SEA-RAFT](sea-raft.md) — where the efficiency-focused flow lineage stands today
