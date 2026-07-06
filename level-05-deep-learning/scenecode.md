# SceneCode

> Zhi 2019 · [Paper](https://arxiv.org/abs/1903.06482)

**One-line summary** — Extends CodeSLAM by encoding depth *and* semantic segmentation in a single learned latent code, so geometric and semantic evidence constrain each other during SLAM optimization.

## Key ideas

- **Shared latent code for two modalities**: A conditional VAE encodes both depth $D$ and semantics $S$ into one code $\mathbf{z}$, decoded as $p_\theta(D, S \mid \mathbf{z}, I)$. The shared bottleneck forces the representation to capture the strong correlation between depth discontinuities and semantic boundaries.
- **Cross-modal constraints**: Photometric/geometric observations that update the code also improve the decoded semantics, and semantic observations sharpen depth at object boundaries — each modality supervises the other at optimization time, not just training time.
- **Joint optimization**: Camera poses $\xi$ and per-keyframe codes $\mathbf{z}$ are optimized together over a combined photometric + semantic + prior loss, keeping the whole map on the learned scene manifold.
- **Multi-view semantic fusion**: Labels from different viewpoints are fused *through the code*, yielding label maps that are consistent in 3D rather than flickering per frame.

## Why it matters for SLAM

SceneCode was the first joint geometric-semantic latent representation for SLAM, demonstrating that semantics can be an optimizable map variable rather than a post-hoc painting of labels onto geometry. It sits in the Imperial College latent-map lineage (CodeSLAM → SceneCode → DeepFactors/NodeSLAM) and conceptually prefigures semantic neural-field SLAM, where a single implicit representation likewise decodes both geometry and semantics.

## Related

- [CodeSLAM](codeslam.md) — the depth-only latent code predecessor
- [DeepFactors](deepfactors.md) — probabilistic factor-graph SLAM over codes
- [NodeSLAM](nodeslam.md) — object-level latent codes
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — earlier per-surfel semantic fusion

[Back to Level 5](../README.md#level-5-applying-deep-learning)
