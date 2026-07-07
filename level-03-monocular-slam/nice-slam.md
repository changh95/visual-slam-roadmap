# NICE-SLAM

> Zhu & Peng 2022 · [Paper](https://arxiv.org/abs/2112.12130)

**One-line summary** — Introduced a hierarchical scene representation with multi-level local feature grids (coarse, mid, fine) for scalable neural implicit SLAM, overcoming iMAP's limitations in large scenes.

## Problem

Neural implicit representations had just entered SLAM with iMAP, but "existing methods produce over-smoothed scene reconstructions and have difficulty scaling up to large scenes" — limitations that are "mainly due to their simple fully-connected network architecture that does not incorporate local information in the observations" (abstract). A single global MLP must be retrained everywhere for every update, so it forgets old regions when learning new ones and cannot represent fine detail at scale. NICE-SLAM (CVPR 2022) fixes this with a representation that stores information *locally*.

## Key ideas

- **Hierarchical feature grids**: three levels of 3D feature grids (coarse: room-level geometry and hole-filling, mid: surface geometry, fine: residual detail) plus a colour grid; each query point is tri-linearly interpolated in the grids and decoded by small MLPs into occupancy and colour.
- **Local updates instead of a single global MLP**: because features live in grid cells, optimising the region currently in view touches only the corresponding cells — distant geometry is untouched, eliminating iMAP's catastrophic forgetting by construction.
- **Pre-trained geometry priors**: the decoders (coarse/mid levels) are pre-trained as in ConvONet-style occupancy networks, so the grids are optimised against fixed decoders that already encode what plausible indoor geometry looks like — this regularises reconstruction and lets the coarse level *predict* geometry outside observed regions.
- **Volume rendering for supervision**: depth and colour are rendered by integrating along rays through the hierarchical representation and compared against the RGB-D input; sampling is concentrated near the observed depth for efficiency.
- **Joint tracking and mapping in one loss**: tracking optimises the camera pose against the frozen map, mapping optimises grid features (and optionally poses of keyframes) — the iMAP recipe, but over a scalable representation.

## Results & impact

The abstract reports that compared to recent neural implicit SLAM systems, NICE-SLAM "is more scalable, efficient, and robust", with competitive mapping and tracking quality demonstrated on five challenging datasets (including Replica, ScanNet, and TUM RGB-D). It became the reference system of the neural-implicit SLAM wave: nearly every follow-up (Co-SLAM's hash grids, ESLAM's tri-planes, Point-SLAM's neural points) positions itself as an improvement over NICE-SLAM's grid representation, using the evaluation protocol this paper helped standardise.

## Why it matters for SLAM

NICE-SLAM made neural implicit SLAM scalable to room-sized and larger environments, moving the field past iMAP's proof-of-concept stage. Its hierarchical feature-grid design became a standard pattern adopted by follow-ups such as ESLAM (tri-planes), Co-SLAM (hash grids), and Point-SLAM (neural points). Together with iMAP, it cemented the Replica / TUM RGB-D / ScanNet evaluation protocol used by most later neural SLAM papers.

## Related

- [iMAP](imap.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NICER-SLAM](nicer-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
