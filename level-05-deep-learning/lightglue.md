# LightGlue

> Lindenberger 2023 · [Paper](https://arxiv.org/abs/2306.13643)

**One-line summary** — Redesigned SuperGlue that is substantially faster through adaptive depth and width: easy image pairs exit the network early, and confidently matched or rejected keypoints are pruned from further computation.

## Problem

SuperGlue established learned sparse matching as the state of the art, but it spends a *fixed* compute budget: every keypoint passes through every layer regardless of how easy the image pair is, and its Sinkhorn optimal-transport head is expensive and notoriously difficult to train — follow-ups failed to reach the original model's performance. LightGlue revisits SuperGlue's design decisions one by one, derives simple but effective improvements, and makes inference adaptive to the difficulty of each pair.

## Method & architecture

Given local features (normalized position $\mathbf{p}_i \in [0,1]^2$, descriptor $\mathbf{d}_i \in \mathbb{R}^d$, $d{=}256$) from images $A$ and $B$, LightGlue stacks $L = 9$ identical layers, each one self-attention + one cross-attention unit (4 heads) updating per-point states $\mathbf{x}_i$ (initialized to $\mathbf{d}_i$):

$$ \mathbf{x}^{I}_{i} \leftarrow \mathbf{x}^{I}_{i} + \mathrm{MLP}\big(\big[\mathbf{x}^{I}_{i} \,\Vert\, \mathbf{m}^{I\leftarrow S}_{i}\big]\big) $$

where $\mathbf{m}^{I\leftarrow S}_i$ is an attention-weighted average of states in the source image $S$.

- **Relative rotary positional encoding (self-attention):** $a_{ij} = \mathbf{q}_i^\top\, \mathbf{R}(\mathbf{p}_j - \mathbf{p}_i)\, \mathbf{k}_j$, where $\mathbf{R}$ rotates $d/2$ 2D subspaces by projections onto learned bases — capturing only *relative* position (equivariant to in-plane camera translation), applied at every layer instead of SuperGlue's absolute MLP encoding, which the network tends to forget.
- **Bidirectional cross-attention:** only keys, no queries: $a^{IS}_{ij} = \mathbf{k}_i^{I\top} \mathbf{k}_j^{S} = a^{SI}_{ji}$, so the $O(NMd)$ similarity is computed once for both directions (saves 20% run time).
- **Lightweight head instead of Sinkhorn + dustbin:** pairwise similarity $\mathbf{S}_{ij} = \mathrm{Linear}(\mathbf{x}_i^A)^\top \mathrm{Linear}(\mathbf{x}_j^B)$ is *disentangled* from a per-point matchability $\sigma_i = \mathrm{Sigmoid}(\mathrm{Linear}(\mathbf{x}_i))$, combined as

$$ \mathbf{P}_{ij} = \sigma_i^A\, \sigma_j^B\, \mathrm{Softmax}_{k \in \mathcal{A}}(\mathbf{S}_{kj})_i\, \mathrm{Softmax}_{k \in \mathcal{B}}(\mathbf{S}_{ik})_j $$

  Correspondences are pairs where $\mathbf{P}_{ij}$ exceeds a threshold and is maximal along its row and column — a fusion of mutual-NN search and a learned inlier classifier, far cheaper than optimal transport.
- **Adaptive depth (early exit):** a compact MLP predicts per-point confidence $c_i = \mathrm{Sigmoid}(\mathrm{MLP}(\mathbf{x}_i))$ after each layer; inference halts when the fraction of points with $c_i > \lambda_\ell$ exceeds a ratio $\alpha$.
- **Adaptive width (point pruning):** points that are confident *and* unmatchable are discarded from subsequent layers, cutting the quadratic attention cost.
- **Deep supervision:** because the head is cheap, the assignment is predicted and supervised with negative log-likelihood at *every* layer (plus balanced matchability terms on unmatchable sets $\bar{\mathcal{A}}, \bar{\mathcal{B}}$); the confidence classifier is trained afterwards to predict whether a layer's matches already equal the final layer's.
- **Recipe:** pre-training on synthetic homographies of 1M images, then fine-tuning on MegaDepth; 2k points per image, gradient checkpointing + mixed precision fit 32 pairs on one 24 GB GPU — state-of-the-art accuracy within a few GPU-days.

## Results

- **MegaDepth-1500 relative pose (SuperPoint features, 2048 keypoints):** LightGlue RANSAC AUC@5°/10°/20° = 49.9/67.0/80.1 in 44.2 ms vs SuperGlue's 49.7/67.1/80.6 in 70.0 ms; with LO-RANSAC 66.7/79.3/87.9 vs 65.8/78.7/87.5. The adaptive variant keeps 49.4/67.2/80.1 at 31.4 ms — over 2× faster than SuperGlue and SGMNet, and 5–11× faster than dense matchers (LoFTR 181 ms, ASpanFormer 369 ms).
- **HPatches homographies:** highest precision among sparse matchers (P 88.9 vs SuperGlue 87.4) and best DLT AUC (35.9/78.6 @1/5px).
- **Aachen Day-Night localization (hloc, 4096 keypoints):** 90.2/96.0/99.4 day and 77.0/91.1/100 night — on par with SuperGlue (89.8/96.1/99.4, 77.0/90.6/100) at 17.3 vs 6.4 pairs/s (~2.5×; 4× with the optimized flash-attention variant, matching 4096 keypoints in real time).
- **Ablation (identical homography training):** LightGlue reaches precision 86.8 / recall 96.3 vs SuperGlue's 74.6/90.5 (+12% precision, +4% recall) at 19.4 vs 29.1 ms, and converges much faster.
- **Adaptivity:** easy pairs exit after ~4.7 of 9 layers for a 1.86× speedup; hard pairs still prune ~28% of points. On IMC 2021, DISK(8K)+LightGlue tops the board (avg AUC@5°/10° = 58.8/70.0).

## Why it matters for SLAM

SuperGlue proved learned matching is more robust than nearest-neighbor + ratio test, but its fixed compute budget made it awkward for real-time SLAM. LightGlue's insight — spend compute proportional to problem difficulty, cheap on high-overlap tracking frames and deep on wide-baseline loop closures — made learned matching practical in latency-sensitive pipelines, and it replaced SuperGlue as the default matcher in the hloc localization toolbox. If you are building a modern feature-based SLAM or relocalization pipeline today, SuperPoint (or DISK/SIFT) + LightGlue is the standard starting point.

## Related

- [SuperGlue](superglue.md) — the predecessor it accelerates
- [SuperPoint](superpoint.md) — the most common feature paired with it
- [DISK](disk.md) — alternative feature backbone with native LightGlue support
- [LoFTR](loftr.md) — detector-free dense alternative
- [XFeat](xfeat.md) — lightweight features for the same efficiency goal
- [hloc](hloc.md) — the localization toolbox where it is now the default matcher
