# SemanticFusion

> McCormac 2016 · [Paper](https://arxiv.org/abs/1609.05130)

**One-line summary** — The first dense semantic SLAM system, fusing per-frame CNN segmentation predictions into an ElasticFusion surfel map via Bayesian updates to produce a coherent 3D semantic map.

## Problem

Dense geometric SLAM produces accurate 3D reconstructions, but the map does not know *what* anything is — for the next level of robot intelligence and intuitive user interaction, maps need to extend beyond geometry and appearance to contain semantics. Single-frame CNN semantic segmentation, meanwhile, is noisy and view-dependent: the same surface can be labeled differently from different viewpoints. The missing piece was a mechanism to accumulate many per-frame 2D predictions into one persistent, consistent 3D labeling.

## Key ideas

- **ElasticFusion backbone**: the surfel-based SLAM system provides real-time tracking and — crucially — *long-term dense correspondences* between frames of indoor RGB-D video, even during loopy scanning trajectories. Each surfel is repeatedly observed from many viewpoints, and the system knows which pixel saw which surfel.
- **CNN front-end**: every $k$-th frame is passed through a 2D semantic segmentation CNN, producing per-pixel class probability maps $P(c \mid \mathbf{u})$ over $L$ classes.
- **Bayesian surfel label fusion**: each surfel $s$ maintains a probability distribution over classes, updated recursively with each new CNN prediction via its projected pixel $\mathbf{u}_s$:
  $$P_{t+1}(c \mid s) = \frac{P_t(c \mid \mathbf{u}_s)\, P_t(c \mid s)}{\sum_{c'} P_t(c' \mid \mathbf{u}_s)\, P_t(c' \mid s)}$$
  so noisy, view-dependent single-frame predictions average out into stable 3D labels — the SLAM correspondences do the evidence bookkeeping.
- **Optional CRF regularization**: a dense CRF over the surfel map enforces spatial smoothness of labels, using surfel positions and colors as pairwise potentials.
- **Fusion improves segmentation, not just mapping**: probabilistically fusing predictions from multiple viewpoints improves even the *2D* labeling over baseline single-frame predictions — the SLAM map is not just a consumer of semantics but an enhancer of them, and the effect grows with viewpoint variation.

## Results & impact

SemanticFusion showed on the NYUv2 dataset that fusing multiple CNN predictions improves 2D semantic labeling over single-frame baselines, and that on a smaller reconstruction dataset with larger prediction-viewpoint variation, the improvement over single-frame segmentation increases further — multi-view fusion is worth more exactly when views differ most. The system is efficient enough for real-time interactive use at approximately 25 Hz (abstract). Published at ICRA 2017, it opened the field of dense semantic SLAM and directly inspired Fusion++, PanopticFusion, Kimera, and today's 3D scene-graph systems.

## Why it matters for SLAM

SemanticFusion pioneered "deep semantic SLAM": it was the demonstration that CNN perception and dense SLAM are complementary, with SLAM providing the correspondences that turn per-frame 2D predictions into a persistent, consistent 3D semantic map. It directly inspired the semantic mapping line that leads to Fusion++, PanopticFusion, Kimera, and today's 3D scene graph systems.

## Related

- [ElasticFusion](elasticfusion.md)
- [Fusion++](fusionpp.md)
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [ConceptFusion](../level-03-monocular-slam/conceptfusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
