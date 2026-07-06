# SemanticFusion

> McCormac 2016 · [Paper](https://arxiv.org/abs/1609.05130)

**One-line summary** — The first dense semantic SLAM system, fusing per-frame CNN segmentation predictions into an ElasticFusion surfel map via Bayesian updates to produce a coherent 3D semantic map.

## Key ideas

- **Deep learning CNN front-end**: every k-th frame is passed through a 2D semantic segmentation CNN, producing per-pixel class probability maps over L classes.
- **ElasticFusion backbone**: the surfel-based SLAM system provides real-time tracking and, crucially, long-term frame-to-model correspondences — each surfel is repeatedly observed from many viewpoints.
- **Bayesian surfel label fusion**: each surfel maintains a probability distribution over classes, updated recursively with each new CNN prediction:
  $$P_{t+1}(c \mid s) \propto P_t(c \mid \mathbf{u}_s)\, P_t(c \mid s)$$
  so noisy, view-dependent single-frame predictions average out into stable 3D labels.
- **Optional CRF regularization** over the surfel map enforces spatial smoothness of labels using surfel positions and colors.
- **Fusion improves segmentation**: multi-view fusion measurably improves labeling accuracy over single-frame CNN predictions — the SLAM map is not just a consumer of semantics but improves them.

## Why it matters for SLAM

SemanticFusion pioneered "deep semantic SLAM": it was the demonstration that CNN perception and dense SLAM are complementary, with SLAM providing the correspondences that turn per-frame 2D predictions into a persistent, consistent 3D semantic map. It directly inspired the semantic mapping line that leads to Fusion++, PanopticFusion, Kimera, and today's 3D scene graph systems.

## Related

- [ElasticFusion](elasticfusion.md)
- [Fusion++](fusionpp.md)
- [Kimera / 3D Dynamic Scene Graph](../level-05-deep-learning/kimera-3d-dynamic-scene-graph.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
