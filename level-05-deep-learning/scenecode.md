# SceneCode

> Zhi 2019 · [Paper](https://arxiv.org/abs/1903.06482)

**One-line summary** — Extends CodeSLAM by encoding depth *and* semantic segmentation in a single learned latent code, so geometric and semantic evidence constrain each other during SLAM optimization.

## Problem

Incremental semantic mapping systems must store and update both geometry and semantics, but while geometry estimation had well-developed probabilistic formulations, state-of-the-art systems stored *independent* per-element label estimates (per depth pixel, surfel, or voxel). This discards spatial correlation: fused label maps come out incoherent and noisy, flickering across viewpoints, and semantic evidence cannot inform geometry (or vice versa).

Meanwhile CodeSLAM had shown depth maps can be compressed into small optimizable codes. SceneCode asks whether semantics can live in the same code, so labels become an optimizable, spatially coherent map variable — exploiting the fact that depth discontinuities and semantic boundaries are strongly correlated.

## Key ideas

- **Shared latent code for two modalities**: A variational auto-encoder conditioned on the colour image encodes both depth $D$ and semantics $S$ into one compact code $\mathbf{z}$, decoded as $p_\theta(D, S \mid \mathbf{z}, I) = p_\theta(D \mid \mathbf{z}, I)\, p_\theta(S \mid \mathbf{z}, I)$. The shared bottleneck forces the representation to capture the strong correlation between depth discontinuities and semantic boundaries.
- **Compact and optimisable by design**: Like CodeSLAM's depth codes, the low-dimensional code makes dense semantics tractable inside a real-time optimizer — a handful of code variables per keyframe instead of per-pixel label distributions.
- **Semantic label fusion by code optimization**: Instead of fusing per-pixel label histograms, labels from a set of overlapping keyframes are fused by *jointly optimizing the low-dimensional codes* associated with those keyframes — producing consistent fused label maps that preserve spatial correlation.
- **Cross-modal constraints**: Photometric/geometric observations that update the code also improve the decoded semantics, and semantic observations sharpen depth at object boundaries — each modality supervises the other at optimization time, not just training time.
- **Joint probabilistic optimization**: Camera poses $\xi$ and per-keyframe codes $\mathbf{z}$ are optimized together over a combined loss, e.g. $\mathcal{L} = \mathcal{L}_{\text{photo}}(\xi, \mathbf{z}) + \lambda_s \mathcal{L}_{\text{semantic}}(\mathbf{z}) + \lambda_p \|\mathbf{z}\|^2$, so motion, geometry, and semantics are estimated in one unified, flexible formulation while the map stays on the learned scene manifold.
- **Keyframe-based monocular system**: The approach slots into a monocular keyframe SLAM pipeline where a similar code is already used for geometry (the CodeSLAM design), making semantics a first-class state variable rather than a post-processing layer.

## Results & impact

- Demonstrated monocular dense semantic reconstruction where fused label maps are consistent in 3D rather than flickering per frame — spatial correlation preserved through the code.
- Depth accuracy improves at object boundaries relative to depth-only codes, and semantic quality improves when geometric constraints are active — evidence of genuine cross-modal reinforcement.
- First joint geometric-semantic latent representation for SLAM; conceptual precursor to semantic neural-field systems (e.g., Semantic-NeRF-style models) where one implicit representation likewise decodes both geometry and semantics.

## Why it matters for SLAM

SceneCode was the first joint geometric-semantic latent representation for SLAM, demonstrating that semantics can be an optimizable map variable rather than a post-hoc painting of labels onto geometry. It sits in the Imperial College latent-map lineage (CodeSLAM → SceneCode → DeepFactors/NodeSLAM) and conceptually prefigures semantic neural-field SLAM, where a single implicit representation likewise decodes both geometry and semantics.

## Related

- [CodeSLAM](codeslam.md) — the depth-only latent code predecessor
- [DeepFactors](deepfactors.md) — probabilistic factor-graph SLAM over codes
- [NodeSLAM](nodeslam.md) — object-level latent codes
- [CodeMapping](codemapping.md) — codes for dense mapping alongside sparse SLAM
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md) — earlier per-surfel semantic fusion

[Back to Level 5](../README.md#level-5-applying-deep-learning)
