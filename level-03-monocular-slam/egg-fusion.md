# EGG-Fusion

> Pan 2025 · [Paper](https://arxiv.org/abs/2512.01296)

**One-line summary** — Real-time dense SLAM that fuses geometry-aware Gaussian surfels on the fly with a closed-form information-filter update, avoiding the gradient-based optimisation that makes most 3DGS-SLAM systems slow.

## Key ideas

- **Gaussian surfel representation**: scene elements are disc-like Gaussians with one very small axis, constraining them to approximate surface patches — fewer parameters per element and better geometric accuracy than general ellipsoids.
- **Information-filter fusion instead of backprop**: new observations are integrated into existing surfels with additive information-form updates,
  $$\boldsymbol{\Lambda}_{k+1} = \boldsymbol{\Lambda}_k + \mathbf{H}^\top \mathbf{R}^{-1} \mathbf{H}, \qquad \boldsymbol{\eta}_{k+1} = \boldsymbol{\eta}_k + \mathbf{H}^\top \mathbf{R}^{-1} \mathbf{z}$$
  a closed-form, single-pass operation — no differentiable rendering and iterative gradient descent during mapping.
- **On-the-fly mapping**: because fusion is closed-form, mapping cost stays predictable regardless of scene complexity, giving consistent real-time performance (the paper reports around 24 FPS for the full pipeline).
- **Classical filtering meets splatting**: the design deliberately connects estimation-theoretic map fusion (in the spirit of surfel systems like ElasticFusion) with the modern Gaussian-splatting map representation.

## Why it matters for SLAM

Most 3DGS-SLAM systems (SplaTAM, MonoGS) inherit NeRF-SLAM's habit of optimising the map by backpropagation through a renderer, which costs many iterations per frame. EGG-Fusion shows an alternative lineage: treat Gaussians as state to be *filtered*, not parameters to be *trained*. This makes dense, renderable maps compatible with genuine real-time incremental operation, an important step toward deployable Gaussian-map SLAM.

## Related

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
