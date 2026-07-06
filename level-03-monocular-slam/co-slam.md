# Co-SLAM

> Wang 2023 · [Paper](https://arxiv.org/abs/2304.14377)

**One-line summary** — Combined Instant-NGP-style multi-resolution hash grids with smooth one-blob coordinate encoding for neural SLAM, achieving roughly 5-10x speedup over NICE-SLAM while keeping coherent surfaces.

## Key ideas

- **Joint encoding**: scene coordinates are encoded by concatenating (a) multi-resolution hash-grid features (Instant-NGP) for fast convergence and local detail, and (b) a one-blob coordinate encoding that provides global smoothness and hole filling — hash grids alone produce noisy surfaces with holes in unobserved regions.
- **SDF scene representation**: a lightweight MLP decodes the joint encoding into a truncated signed distance value and colour, $f_\theta(h(\mathbf{x}) \oplus \psi(\mathbf{x})) \rightarrow (s, \mathbf{c})$.
- **Efficient ray sampling**: stratified sampling with importance weighting concentrates computation near surfaces.
- **Global bundle adjustment over all keyframes**: unlike NICE-SLAM's local-window optimisation, Co-SLAM's efficiency permits sampling rays from *all* keyframes during mapping, improving global consistency.

## Why it matters for SLAM

Co-SLAM brought neural implicit SLAM to near-real-time speeds, making the NeRF-SLAM family practical for interactive use, and showed that Instant-NGP's hash grids are viable for online mapping. Its joint parametric + coordinate encoding became an influential design pattern in the NICE-SLAM lineage of neural SLAM systems, alongside ESLAM's tri-planes and Point-SLAM's neural point clouds.

## Related

- [NICE-SLAM](nice-slam.md)
- [iMAP](imap.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
