# Point-SLAM

> Sandström 2023 · [Paper](https://arxiv.org/abs/2304.04278)

**One-line summary** — Anchors neural features in a dynamically growing point cloud rather than fixed grids, adapting representation density to scene detail for efficient dense neural SLAM.

## Problem

Grid-based neural SLAM (NICE-SLAM, ESLAM) anchors scene features "in a sparse grid" at resolutions fixed in advance and uniform in space: memory is wasted on empty or featureless regions while detailed areas may be under-resolved. Point-SLAM instead anchors the features of the neural scene representation "in a point cloud that is iteratively generated in an input-dependent, data-driven manner" (abstract), so representation capacity follows the information density of the input.

## Key ideas

- **Neural point cloud representation**: the scene is a set of points $\{(\mathbf{p}_i, \mathbf{f}_i)\}$, each carrying a learned feature vector; a query location aggregates nearby point features via distance-weighted interpolation, replacing the trilinear grid lookup of NICE-SLAM.
- **Input-dependent adaptive densification**: points are added where the input carries information — around observed surfaces, densely where detail is high, sparsely in flat regions. Per the abstract, "this strategy reduces runtime and memory usage in regions with fewer details and dedicates higher point density to resolve fine details".
- **One representation, both tasks**: "both tracking and mapping can be performed with the same point-based neural scene representation by minimizing an RGBD-based re-rendering loss" (abstract) — pose optimisation freezes the map, mapping freezes poses, in the iMAP/NICE-SLAM alternation.
- **MLP decoding + volume rendering**: aggregated features are decoded by a compact MLP into geometry and colour, rendered along rays and supervised jointly against the input colour and depth.
- **No empty-space bookkeeping**: unlike grids, there is nothing to allocate where nothing was observed — the point set *is* the sparsity structure, which is why memory tracks surface area rather than bounding-box volume.

## Results & impact

The abstract reports performance "either better or competitive to existing dense neural RGBD SLAM methods in tracking, mapping and rendering accuracy on the Replica, TUM-RGBD and ScanNet datasets", with reconstruction quality on Replica among the strongest of the neural SLAM generation. Conceptually its influence outlived NeRF-style SLAM: an explicit, adaptively densified set of primitives carrying appearance features is exactly the map structure 3D Gaussian Splatting SLAM adopted months later.

## Why it matters for SLAM

Point-SLAM brought adaptive density control to neural implicit SLAM: representation capacity goes where the scene needs it, instead of being wasted on empty space. It bridged classical point-cloud mapping with neural implicit methods and achieved among the best reconstruction quality of the NeRF-style SLAM generation. The idea of an adaptive point-based map foreshadowed the explicit, adaptively densified primitives of 3D Gaussian Splatting SLAM.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [SplaTAM](splatam.md)
- [iMAP](imap.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
