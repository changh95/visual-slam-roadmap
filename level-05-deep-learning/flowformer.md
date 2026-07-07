# FlowFormer

> Huang 2022 · [Paper](https://arxiv.org/abs/2203.16194)

**One-line summary** — First Transformer architecture for optical flow: it tokenizes RAFT's 4D cost volume and processes the tokens with alternating local/global attention, giving the flow estimator a truly global receptive field.

## Problem

RAFT's recurrent ConvGRU update reads the correlation volume with local convolutions, so its effective receptive field is limited: information about large displacements and occluded regions must propagate slowly across many refinement iterations. Global self-attention could reason about the entire matching-cost structure at once — but the 4D cost volume ($H \times W \times H \times W$) is enormous, and naive self-attention over its entries is computationally prohibitive. FlowFormer's contribution is an architecture that makes Transformer-style global reasoning over cost volumes tractable.

## Key ideas

- **Cost volume tokenization**: the 4D cost volume built from the image pair is partitioned into cost tokens, each summarizing the matching evidence of a spatial patch — reducing the sequence length to something a Transformer can process.
- **Alternate-Group Transformer (AGT) layers**: cost tokens are encoded into a *cost memory* in a novel latent space by alternating attention within spatial groups (local refinement) and across groups (global context propagation) — a global receptive field at manageable cost.
- **Latent cost memory**: rather than repeatedly re-reading the raw cost volume, the encoder compresses it into a compact latent representation that captures both local matching evidence and global scene structure.
- **Recurrent Transformer decoder with dynamic positional cost queries**: flow is decoded iteratively, RAFT-style, but each lookup is a learned query into the cost memory whose position updates with the current flow estimate.
- **Hybrid lineage**: FlowFormer keeps RAFT's overall estimate-then-refine loop while replacing its convolutional cost processing with attention — Transformer accuracy on top of the proven recurrent skeleton.

## Results & impact

- On the Sintel benchmark: 1.159 AEPE (clean) and 2.088 AEPE (final) — 16.5% and 15.5% error reductions from the best published results at the time (1.388 and 2.47).
- Strong cross-dataset generalization: *without* training on Sintel, it achieves 1.01 AEPE on the Sintel training clean pass, outperforming the best published result (1.29) by 21.7%.
- Established the Transformer paradigm for optical flow; FlowFormer++ and related Transformer matchers continued the line, and its AGT design influenced subsequent dense-matching architectures.

## Why it matters for SLAM

Dense optical flow is the correspondence engine inside modern learned SLAM front-ends (DROID-SLAM, DPVO descendants), and FlowFormer demonstrated that global attention over matching costs resolves the long-range, ambiguous correspondences that matter most for wide-baseline motion. Its design influenced subsequent Transformer-based dense matching, and it defines one side of today's trade-off — Transformer accuracy (FlowFormer) versus convolutional efficiency (SEA-RAFT) — that SLAM engineers weigh when picking a flow backbone.

## Related

- [RAFT](raft.md) — the convolutional all-pairs predecessor whose cost volume FlowFormer tokenizes
- [SEA-RAFT](sea-raft.md) — efficiency-focused counterpoint that matches Transformers via training improvements
- [FlowNet 2.0](flownet-2-0.md) — earlier iterative-refinement lineage in deep flow
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — SLAM system built around dense recurrent flow
- [LoFTR](loftr.md) — Transformer attention applied to detector-free image matching

[Back to Level 5](../README.md#level-5-applying-deep-learning)
