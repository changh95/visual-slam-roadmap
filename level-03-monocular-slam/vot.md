# VoT

> Yugay 2025 · [Paper](https://arxiv.org/abs/2510.03348)

**One-line summary** — Visual Odometry with Transformers (later retitled FVO, "Fast Visual Odometry with Transformers"): formulates monocular VO as direct relative pose regression with a high-capacity Transformer, replacing hybrid network + bundle-adjustment pipelines entirely.

## Problem

Hybrid pipelines that combine deep networks with classical optimization dominate visual odometry: neural predictions plus bundle adjustment yield highly accurate trajectories. But these hybrids fall short of pure end-to-end approaches in speed and capability — they rely on massive, frozen, pre-trained 3D backbones that were trained scale-ambiguous, so the pipeline inherits that limitation and by design cannot estimate absolute scale; and their slow optimization and post-processing steps bottleneck inference speed. FVO asks: what if we drop the post-processing altogether?

## Key ideas

- **VO as direct relative pose regression**: instead of predicting geometry (flow, depth, pointmaps) and recovering poses via optimization, the model regresses relative camera poses directly — the formulation itself is what removes the post-processing stage.
- **Pose-only supervision**: a fast, high-capacity Transformer is trained to predict relative poses *and corresponding confidences* using only camera poses as supervision — no depth or correspondence labels needed, which unlocks training on much more diverse data.
- **Confidence-aware inference**: at test time, overlapping pose predictions (multiple frame pairs covering the same motion) are aggregated weighted by predicted confidence, turning redundancy into robustness without any optimizer in the loop.
- **No frozen scale-ambiguous backend**: because the network is trained end-to-end for the task rather than wrapped around a frozen scale-ambiguous 3D model, the design escapes the inherited inability of hybrid pipelines to estimate absolute scale.
- **Attention where it counts**: global self- and cross-attention over frame features captures long-range spatial dependencies that CNN-style local correlation misses — helpful for repetitive textures and large displacements.

## Results & impact

Across multiple visual odometry benchmarks, FVO successfully leverages diverse training data to achieve competitive or superior performance while being nearly 2× faster than the fastest baselines. Its message for the field: the hybrid "network + bundle adjustment" recipe is not the end of history — a well-trained regression Transformer with confidence-aware aggregation can match it while being simpler and faster.

## Why it matters for SLAM

VoT/FVO is part of the broader migration of geometric estimation onto Transformer architectures — the same trend that produced LoFTR for matching and VGGT for full multi-view geometry. Its value for a SLAM learner is as a clean case study of the end-to-end extreme of the design space: what you gain by deleting the optimizer (speed, scale, simplicity) and what you give up (the interpretable geometric backbone). Note the naming: the arXiv work first appeared as "VoT" and was later retitled FVO.

## Related

- [DROID-SLAM](droid-slam.md) — CNN + optimization learned SLAM baseline
- [DPVO](dpvo.md) — sparse patch-based learned VO baseline
- [VGGT](vggt.md) — full feed-forward Transformer geometry in the same trend
- [LoFTR](../level-05-deep-learning/loftr.md) — Transformer-based detector-free matching
- [TartanVO](tartanvo.md) — earlier generalizable learned VO that kept the geometry-style outputs

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
