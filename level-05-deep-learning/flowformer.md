# FlowFormer

> Huang 2022 · [Paper](https://arxiv.org/abs/2203.16194)

**One-line summary** — First Transformer architecture built around the 4D cost volume for optical flow: it tokenizes the cost volume, encodes the tokens into a latent "cost memory" with alternate-group attention, and decodes flow recurrently with dynamic positional cost queries.

## Problem

Optical flow estimates a per-pixel displacement field $\mathbf{f}:\mathbb{R}^{2}\rightarrow\mathbb{R}^{2}$ mapping each source-image location $\mathbf{x}$ to its target-image correspondence $\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$. RAFT builds an $H \times W \times H \times W$ 4D cost volume of all-pairs similarities but retrieves costs only from local windows, which struggles with large displacements and occlusions. Transformers offer global reasoning, but naive self-attention over thousands of cost-volume tokens is computationally unbearable — Perceiver IO attends over raw pixels instead and needs roughly $80\times$ more training examples. FlowFormer asks how to keep the compact cost volume *and* gain Transformer-style global aggregation.

## Method & architecture

Three stages: build a 4D cost volume, encode it into cost memory, decode flow recurrently.

- **Cost volume**: the first two stages of an ImageNet-pretrained Twins-SVT backbone extract $H \times W \times D_f$ features ($D_f{=}256$, 1/8 resolution); dot-product similarities between all source/target feature pairs form the $H \times W \times H \times W$ volume, viewed as one 2D cost map $\mathbf{M_x} \in \mathbb{R}^{H \times W}$ per source pixel $\mathbf{x}$.
- **Two-step tokenization**: each cost map is patchified by three stride-2 convolutions into $8{\times}8$-patch features $\mathbf{F_x}$ ($D_p{=}64$ channels), then summarized into $K$ latent tokens by learned codewords $\mathbf{C}\in\mathbb{R}^{K\times D}$ (shared across pixels, trained by backprop):

$$\mathbf{K_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{V_x}=\mathrm{Conv}_{1\times 1}(\mathrm{Concat}(\mathbf{F_x},\mathrm{PE})),\quad \mathbf{T_x}=\mathrm{Attention}(\mathbf{C},\mathbf{K_x},\mathbf{V_x})$$

  turning the 4D volume into an $H \times W \times K$ token grid ($K \times D \ll H \times W$; 8 tokens of dimension 128 in the final model).
- **Alternate-Group Transformer (AGT) layers** (3 in the final model) alternate two orthogonal groupings: *intra-cost-map* self-attention over each pixel's $K$ tokens, $\mathbf{T_x}=\mathrm{FFN}(\mathrm{SelfAttention}(\mathbf{T_x}(1),\dots,\mathbf{T_x}(K)))$, and *inter-cost-map* spatially-separable self-attention (from Twins) over each of the $K$ groups of $H \times W$ tokens, $\mathbf{T}_i=\mathrm{FFN}(\mathrm{SSSelfAttention}(\mathbf{T}_i))$, with source-image context features injected into queries/keys so visually similar pixels get coherent flows. The output tokens are the **cost memory**.
- **Recurrent decoder with dynamic positional cost queries**: at each iteration the current flow gives $\mathbf{p}=\mathbf{x}+\mathbf{f}(\mathbf{x})$; a local $9{\times}9$ cost patch $\mathbf{q_x}=\mathrm{Crop}_{9\times 9}(\mathbf{M_x},\mathbf{p})$ builds the query $\mathbf{Q_x}=\mathrm{FFN}(\mathrm{FFN}(\mathbf{q_x})+\mathrm{PE}(\mathbf{p}))$, which cross-attends into the cost memory, $\mathbf{c_x}=\mathrm{Attention}(\mathbf{Q_x},\mathbf{K_x},\mathbf{V_x})$ (keys/values computed once and reused). A ConvGRU regresses the residual

$$\Delta\mathbf{f}(\mathbf{x})=\mathrm{ConvGRU}(\mathrm{Concat}(\mathbf{c_x},\mathbf{q_x}),\,\mathbf{t_x},\,\mathbf{f}(\mathbf{x}))$$

  and flows are convex-upsampled to full resolution, supervised at every iteration with increasing weights.

## Results

- **Sintel test (C+T+S+K+H)**: 1.159 AEPE clean / 2.088 final — 16.5% and 15.5% error reduction from the best published results (1.388 and 2.47, GMA with warm-start), ranking 1st on both passes without warm-start; vs. GMA without warm-start, 17.2%/27.5% reduction.
- **Generalization (C+T only)**: 1.01 / 2.40 AEPE on Sintel train clean/final and 4.09 F1-epe / 14.72 F1-all on KITTI-2015 train — vs. GMA, 22.3% and 12.4% lower error on Sintel clean/final and 13.9% lower KITTI F1-all; the 1.01 clean AEPE beats the best published result (1.29) by 21.7%.
- **KITTI-2015 test**: 4.68 F1-all after KITTI finetuning, ranking 2nd (S-Flow's 4.64 is 0.85% lower, but S-Flow is 31.6%/22.5% worse on Sintel clean/final).
- First validation that an ImageNet-pretrained transformer backbone benefits optical flow estimation.

## Why it matters for SLAM

Dense optical flow is the correspondence engine inside modern learned SLAM front-ends (DROID-SLAM, DPVO descendants), and FlowFormer demonstrated that global attention over matching costs resolves the long-range, ambiguous correspondences that matter most for wide-baseline motion — precisely the hard cases (large displacement, occlusion) its cost memory targets. It established the Transformer side of today's trade-off — Transformer accuracy (FlowFormer) versus convolutional efficiency (SEA-RAFT) — that SLAM engineers weigh when picking a flow backbone.

## Related

- [RAFT](raft.md) — the convolutional all-pairs predecessor whose cost volume FlowFormer tokenizes
- [SEA-RAFT](sea-raft.md) — efficiency-focused counterpoint that matches Transformers via training improvements
- [FlowNet 2.0](flownet-2-0.md) — earlier iterative-refinement lineage in deep flow
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — SLAM system built around dense recurrent flow
- [LoFTR](loftr.md) — Transformer attention applied to detector-free image matching
