# FlowFormer

> Huang 2022 · [Paper](https://arxiv.org/abs/2203.16194)

**One-line summary** — First Transformer architecture for optical flow: it tokenizes RAFT's 4D cost volume and processes the tokens with alternating local/global attention, giving the flow estimator a truly global receptive field.

## Key ideas

- **Limitation of ConvGRU refinement**: RAFT's recurrent update reads the correlation volume with local convolutions, so information about large displacements and occlusions must propagate slowly across many iterations.
- **Cost volume tokenization**: the 4D correlation volume ($H \times W \times H \times W$) is far too large for naive self-attention; FlowFormer partitions it into overlapping tokens, each summarizing the matching evidence of a spatial patch.
- **Alternate-Group Transformer (AGT)**: attention alternates between intra-group (local refinement) and cross-group (global context propagation) patterns, achieving a global receptive field at manageable cost.
- **Latent cost encoding + recurrent decoding**: the tokenized cost volume is compressed into a compact latent representation, from which a recurrent decoder iteratively produces flow updates, RAFT-style but on Transformer-encoded features.
- Set state-of-the-art results on Sintel and KITTI at publication, clearly ahead of RAFT.

## Why it matters for SLAM

Dense optical flow is the correspondence engine inside modern learned SLAM front-ends (DROID-SLAM, DPVO descendants), and FlowFormer demonstrated that global attention over matching costs resolves the long-range, ambiguous correspondences that matter most for wide-baseline motion. Its design influenced subsequent Transformer-based dense matching, and it defines one side of today's trade-off — Transformer accuracy (FlowFormer) versus convolutional efficiency (SEA-RAFT) — that SLAM engineers weigh when picking a flow backbone.

## Related

- [RAFT](raft.md) — the convolutional all-pairs predecessor whose cost volume FlowFormer tokenizes
- [SEA-RAFT](sea-raft.md) — efficiency-focused counterpoint that matches Transformers via training improvements
- [FlowNet 2.0](flownet-2-0.md) — earlier iterative-refinement lineage in deep flow
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — SLAM system built around dense recurrent flow

[Back to Level 5](../README.md#level-5-applying-deep-learning)
