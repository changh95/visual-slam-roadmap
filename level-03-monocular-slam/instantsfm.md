# InstantSfM

> Zhong 2025 · [Paper](https://arxiv.org/abs/2510.13310)

**One-line summary** — A GPU-native, sparsity-aware Structure-from-Motion pipeline that keeps the whole reconstruction on the GPU, delivering large speedups over COLMAP at comparable accuracy.

## Key ideas

- **Fully GPU-resident pipeline**: classical SfM tools like COLMAP are largely CPU-bound and cannot exploit modern accelerators; InstantSfM redesigns the reconstruction stages to run on the GPU end to end, avoiding costly host-device transfers.
- **Sparse-aware optimisation**: bundle adjustment and the other least-squares solves exploit the sparse structure of the SfM problem (the same block sparsity handled by the Schur complement trick) with GPU-parallel sparse linear algebra, rather than treating the problem densely.
- **Massive parallelism across the pipeline**: operations that incremental CPU pipelines do serially — triangulating points, evaluating residuals, solving normal equations — are batched across thousands of points and cameras.
- **Practical large-scale reconstruction**: the result is that image collections which take hours in classical pipelines can be reconstructed in a small fraction of the time without giving up accuracy.

## Why it matters for SLAM

Offline SfM is the workhorse behind SLAM research: it produces pseudo-ground-truth trajectories, calibration, and the posed images used to train NeRF/3DGS and learning-based SLAM systems. Speeding it up by an order of magnitude shortens every iteration loop in that ecosystem. InstantSfM also continues the broader shift — seen in GLOMAP and in learned front-ends — away from the slow incremental CPU pipeline that COLMAP standardised.

## Related

- [COLMAP](colmap.md)
- [GLOMAP](glomap.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [VGGT](vggt.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
