# GLOMAP

> Pan 2024 · [Paper](https://arxiv.org/abs/2407.20219)

**One-line summary** — Revisited global Structure-from-Motion and showed it can match incremental SfM (COLMAP) in accuracy while being dramatically faster, by replacing separate translation averaging with a joint global positioning step.

## Key ideas

- **Global instead of incremental SfM**: rather than registering images one by one with repeated rounds of bundle adjustment (as COLMAP does), GLOMAP estimates all camera poses at once — rotation averaging first, then a positioning step — which removes the main scalability bottleneck of incremental pipelines.
- **Joint global positioning**: the classical weak point of global SfM is translation averaging, which is fragile under noisy relative translations and degenerate (e.g., collinear) camera motion. GLOMAP instead directly and jointly estimates camera positions *and* 3D point positions, sidestepping translation averaging entirely.
- **COLMAP-compatible**: it consumes the same database (features, matches, two-view geometries) and produces the same output format as COLMAP, so it works as a drop-in replacement for the reconstruction (mapping) stage in existing workflows.
- **Accuracy with speed**: on standard reconstruction benchmarks it reaches accuracy comparable to incremental SfM while running orders of magnitude faster on large image collections.

## Why it matters for SLAM

SfM tools like COLMAP are the standard way to generate ground-truth trajectories, offline maps, and training data (e.g., for NeRF/3DGS and for learning-based SLAM). GLOMAP makes this offline mapping step much cheaper at scale, which matters whenever you need to reconstruct thousands of images. It also revived interest in global SfM as a serious alternative to the incremental paradigm, a trend continued by GPU-native pipelines such as InstantSfM.

## Related

- [COLMAP](colmap.md)
- [InstantSfM](instantsfm.md)
- [VGGT](vggt.md)
- [MASt3R](mast3r.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
