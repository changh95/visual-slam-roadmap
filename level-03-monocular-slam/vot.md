# VoT

> Yugay 2025 · [Paper](https://arxiv.org/abs/2510.03348)

**One-line summary** — Visual Odometry with Transformers (later retitled FVO): replaces CNN-based VO components with a Transformer architecture whose self- and cross-attention capture long-range spatial dependencies for correspondence and ego-motion estimation.

## Key ideas

- **Global attention vs local receptive fields**: CNN-based VO pipelines (DROID-SLAM, DPVO) rely on local correlation, which can miss long-range relationships in repetitive or large-displacement scenes; global self-attention sees the whole image at once.
- **ViT feature extraction**: a Vision Transformer encoder with patch tokenisation replaces CNN encoders, capturing both local and global context.
- **Cross-attention correspondence**: attention between consecutive frames' features establishes correspondences by attending to globally similar regions, handling large displacements and repetitive textures.
- **Self-attention refinement**: attention within each frame enforces global consistency of the correspondence field, suppressing ambiguous matches.
- **Pose estimation head**: correspondence features feed a pose decoder that regresses the 6-DoF relative camera motion.

## Why it matters for SLAM

VoT is part of the broader migration of geometric estimation onto Transformer architectures — the same trend that produced LoFTR for matching and VGGT for full multi-view geometry. Its value for a SLAM learner is as a clean case study of what attention buys in ego-motion estimation (robust matching under repetition and large viewpoint change) and what it costs (compute at deployment time). The work was later retitled FVO.

## Related

- [DROID-SLAM](droid-slam.md) — CNN + optimization learned SLAM baseline
- [DPVO](dpvo.md) — sparse patch-based learned VO baseline
- [VGGT](vggt.md) — full feed-forward Transformer geometry in the same trend
- [LoFTR](../level-05-deep-learning/loftr.md) — Transformer-based detector-free matching

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
