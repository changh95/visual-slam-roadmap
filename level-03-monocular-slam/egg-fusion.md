# EGG-Fusion

> Pan 2025 · [Paper](https://arxiv.org/abs/2512.01296)

**One-line summary** — Real-time dense SLAM that fuses geometry-aware Gaussian surfels on the fly with an information-filter update that explicitly models sensor noise, avoiding the per-frame gradient-descent mapping that makes most 3DGS-SLAM systems slow.

## Problem

Differentiable-rendering SLAM (NeRF- and 3DGS-based) delivers photorealistic maps, but as the abstract puts it, "current differentiable rendering methods face dual challenges in real-time computation and sensor noise sensitivity, leading to degraded geometric fidelity in scene reconstruction and limited practicality." Mapping by backpropagation costs many gradient iterations per frame, and treating noisy depth measurements as ground truth corrupts the recovered surfaces. EGG-Fusion targets both problems at once: real-time throughput and noise-aware, high-precision surface geometry.

## Key ideas

- **Gaussian surfel representation**: scene elements are disc-like Gaussians with one very small axis, constraining them to approximate surface patches — fewer parameters per element and better geometric accuracy than general ellipsoids, and the "differentiable Gaussian surfel mapping effectively models multi-view consistent surfaces while enabling efficient parameter optimization."
- **Information-filter fusion with explicit noise models**: the system introduces "an information filter-based fusion method that explicitly accounts for sensor noise to achieve high-precision surface reconstruction." New observations update existing surfels in closed form via additive information-form updates,
  $$\boldsymbol{\Lambda}_{k+1} = \boldsymbol{\Lambda}_k + \mathbf{H}^\top \mathbf{R}^{-1} \mathbf{H}, \qquad \boldsymbol{\eta}_{k+1} = \boldsymbol{\eta}_k + \mathbf{H}^\top \mathbf{R}^{-1} \mathbf{z}$$
  — the standard information-filter form: a single-pass operation instead of iterative gradient descent per frame.
- **Robust sparse-to-dense tracking**: camera pose estimation goes from a sparse robust stage to dense refinement, decoupling tracking robustness from the dense map optimisation.
- **On-the-fly mapping with predictable cost**: because fusion is closed-form, mapping cost stays bounded regardless of scene complexity, giving consistent real-time performance rather than the fluctuating runtimes of optimisation-based mappers.
- **Classical filtering meets splatting**: the design deliberately connects estimation-theoretic map fusion (in the spirit of surfel systems like ElasticFusion, where each surfel carries confidence and is updated by weighted averaging) with the modern differentiable Gaussian-splatting map representation.

## Results & impact

From the abstract: EGG-Fusion "achieves a surface reconstruction error of 0.6 cm on standardized benchmark datasets including Replica and ScanNet++, representing over 20% improvement in accuracy compared to state-of-the-art GS-based methods," while maintaining "real-time processing capabilities at 24 FPS" — which the authors position as "one of the most accurate differentiable-rendering-based real-time reconstruction systems." The result argues that filtering-style fusion, not just faster gradient descent, is a viable route to deployable Gaussian-map SLAM.

## Why it matters for SLAM

Most 3DGS-SLAM systems (SplaTAM, MonoGS) inherit NeRF-SLAM's habit of optimising the map by backpropagation through a renderer, which costs many iterations per frame. EGG-Fusion shows an alternative lineage: treat Gaussians as state to be *filtered*, not parameters to be *trained*. This makes dense, renderable maps compatible with genuine real-time incremental operation, an important step toward deployable Gaussian-map SLAM.

## Related

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
