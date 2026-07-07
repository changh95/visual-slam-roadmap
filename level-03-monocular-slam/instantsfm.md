# InstantSfM

> Zhong 2025 · [Paper](https://arxiv.org/abs/2510.13310)

**One-line summary** — A fully GPU-based, PyTorch-compatible global SfM pipeline with sparsity-aware optimisation, reaching up to ~40x speedups over COLMAP on large scenes at comparable accuracy.

## Problem

Mature SfM systems remain CPU-centric and built on traditional optimisation toolchains (Ceres-style solvers), creating "a growing mismatch with modern GPU-based, learning-driven pipelines" (abstract) and limiting scalability on large scenes. GPU-accelerated bundle adjustment had shown the potential of parallel sparse optimisation, but extending it into a *complete* global SfM system was blocked by two unresolved issues: recovering metric scale, and numerical robustness of the GPU solves. InstantSfM builds that complete system.

## Key ideas

- **Fully GPU-based, PyTorch-compatible global SfM**: the whole pipeline lives on the GPU and integrates seamlessly with modern learning pipelines — reconstruction becomes just another differentiable-ecosystem component you can call from Python, rather than an external CPU binary.
- **Global rather than incremental**: like GLOMAP, it follows the global paradigm — solve for all cameras together — which exposes exactly the kind of massive, batched parallelism (residual evaluation, triangulation, sparse linear algebra across thousands of cameras and points) that GPUs are good at.
- **Depth priors inside the optimisation**: metric depth priors (from learned monocular depth) are embedded "directly into both global positioning and BA through a depth-constrained Jacobian structure, thereby resolving scale ambiguity within the optimization framework" (abstract) — scale is fixed by the solver itself, not by an ad-hoc post-alignment.
- **Numerical robustness on the GPU**: under-constrained variables (e.g., points seen by too few or badly conditioned views) are explicitly filtered from the Jacobian in an optimised GPU-friendly manner, keeping the sparse solves stable — one of the two issues that had blocked full GPU SfM systems.
- **Sparsity-aware solves**: bundle adjustment and global positioning exploit the block-sparse structure of the SfM problem (the same sparsity the Schur complement trick exploits) instead of treating it densely, which is what makes GPU BA scale.

## Results & impact

- "Extensive experiments on diverse datasets demonstrate that InstantSfM achieves state-of-the-art efficiency while maintaining reconstruction accuracy comparable to both established classical pipelines and recent learning-based methods, showing up to ~40x speedup over COLMAP on large-scale scenes" (abstract).
- Positions SfM as a GPU-native, learning-era tool: the same hardware and framework (PyTorch) used for the downstream NeRF/3DGS training can now run the pose/geometry recovery step too.

## Why it matters for SLAM

Offline SfM is the workhorse behind SLAM research: it produces pseudo-ground-truth trajectories, calibration, and the posed images used to train NeRF/3DGS and learning-based SLAM systems. Speeding it up by an order of magnitude shortens every iteration loop in that ecosystem. InstantSfM also continues the broader shift — seen in GLOMAP and in learned front-ends — away from the slow incremental CPU pipeline that COLMAP standardised, and its depth-prior-in-the-Jacobian trick is a clean example of fusing learned priors into classical estimation rather than replacing it.

## Related

- [COLMAP](colmap.md)
- [GLOMAP](glomap.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [VGGT](vggt.md)
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
