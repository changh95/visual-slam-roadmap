# Co-SLAM

> Wang 2023 · [Paper](https://arxiv.org/abs/2304.14377)

**One-line summary** — Combined Instant-NGP-style multi-resolution hash grids with smooth one-blob coordinate encoding for neural SLAM, running at 10-17 Hz — far faster than NICE-SLAM — while keeping coherent surfaces.

## Problem

NICE-SLAM demonstrated scalable neural implicit SLAM with hierarchical feature grids, but it was too slow for real-time use. Instant-NGP showed that multi-resolution hash grids make neural field training extremely fast, but hash grids alone produce noisy surfaces with holes in unobserved regions — there is no built-in smoothness prior to fill in what the camera never saw. Co-SLAM ("Joint Coordinate and Sparse Parametric Encodings for Neural Real-Time SLAM") set out to get both: hash-grid speed and coordinate-encoding coherence, in a single RGB-D SLAM system.

## Key ideas

- **Joint parametric-coordinate encoding**: scene coordinates are encoded by concatenating (a) multi-resolution hash-grid features (Instant-NGP) for fast convergence and high-frequency local detail, and (b) a one-blob coordinate encoding that encourages surface coherence and completion in unobserved areas. In the paper's words, this brings "the best of both worlds: fast convergence and surface hole filling."
- **SDF scene representation**: a lightweight MLP decodes the joint encoding into a truncated signed distance value and colour, $f_\theta(h(\mathbf{x}) \oplus \psi(\mathbf{x})) \rightarrow (s, \mathbf{c})$, giving cleaner surfaces than raw density fields.
- **Tracking and mapping by rendering**: both camera pose and map are optimised against rendered colour/depth losses, as in the iMAP/NICE-SLAM template — the change is the representation underneath, not the overall SLAM loop.
- **Efficient ray sampling**: stratified sampling with importance weighting concentrates computation near surfaces instead of empty space.
- **Global bundle adjustment over all keyframes**: unlike competing neural SLAM approaches that keep a small set of active keyframes, Co-SLAM's ray-sampling strategy lets mapping sample rays from *all* keyframes, performing global bundle adjustment and improving global consistency at no prohibitive cost.

## Key trade-off

Grid-based encodings (fast, local, discontinuous) and coordinate encodings (smooth, global, slow to converge) sit at opposite ends of a spectrum; Co-SLAM's contribution is showing that a simple concatenation of the two gives a representation with the strengths of both. This is the same design question ESLAM answers with tri-planes and Point-SLAM answers with neural point clouds.

## Results & impact

The paper reports that Co-SLAM runs at 10-17 Hz and achieves state-of-the-art scene reconstruction results with competitive tracking performance across ScanNet, TUM, Replica, and Synthetic RGB-D benchmarks — far faster than NICE-SLAM at comparable reconstruction quality, with the coordinate encoding filling the surface holes that hash-grid-only representations leave open. Co-SLAM became one of the standard baselines that every subsequent neural-implicit SLAM paper compares against.

## Why it matters for SLAM

Co-SLAM brought neural implicit SLAM to near-real-time speeds, making the NeRF-SLAM family practical for interactive use, and showed that Instant-NGP's hash grids are viable for online mapping. Its joint parametric + coordinate encoding became an influential design pattern in the NICE-SLAM lineage of neural SLAM systems, alongside ESLAM's tri-planes and Point-SLAM's neural point clouds.

## Related

- [NICE-SLAM](nice-slam.md)
- [iMAP](imap.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
