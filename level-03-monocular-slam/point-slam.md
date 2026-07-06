# Point-SLAM

> Sandström 2023 · [Paper](https://arxiv.org/abs/2304.04278)

**One-line summary** — Anchors neural features in a dynamically growing point cloud rather than fixed grids, adapting representation density to scene detail for efficient dense neural SLAM.

## Key ideas

- **Neural point cloud representation**: the scene is a set of points $\{(\mathbf{p}_i, \mathbf{f}_i)\}$, each carrying a learned feature vector; a query location aggregates nearby point features via distance-weighted interpolation.
- **Adaptive densification**: points are added in a data-driven way — detailed regions receive more points, featureless regions fewer — unlike grid-based methods (NICE-SLAM, ESLAM) that allocate uniform resolution everywhere.
- **MLP decoding + volume rendering**: aggregated features are decoded by a compact MLP into colour and geometry values, rendered and supervised with a joint RGB and depth loss.
- **Same loss for tracking and mapping**: pose optimisation and point-feature optimisation both minimise the colour/depth rendering loss, in the iMAP/NICE-SLAM style.

## Why it matters for SLAM

Point-SLAM brought adaptive density control to neural implicit SLAM: representation capacity goes where the scene needs it, instead of being wasted on empty space. It bridged classical point-cloud mapping with neural implicit methods and achieved among the best reconstruction quality of the NeRF-style SLAM generation. The idea of an adaptive point-based map foreshadowed the explicit, adaptively densified primitives of 3D Gaussian Splatting SLAM.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [SplaTAM](splatam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
