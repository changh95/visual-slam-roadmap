# NICE-SLAM

> Zhu & Peng 2022 · [Paper](https://arxiv.org/abs/2112.12130)

**One-line summary** — Introduced a hierarchical scene representation with multi-level local feature grids (coarse, mid, fine) for scalable neural implicit SLAM, overcoming iMAP's limitations in large scenes.

## Key ideas

- **Hierarchical feature grids**: three levels of 3D feature grids (coarse: room-level geometry, mid: surface details, fine: appearance), each queried via trilinear interpolation and decoded by small MLPs.
- **Local updates instead of a single global MLP**: iMAP's single MLP suffers from catastrophic forgetting and over-smoothing in large scenes; axis-aligned feature grids allow updating local regions without disturbing distant geometry.
- **Pre-trained geometry priors**: the coarse and mid-level decoders are pre-trained on synthetic scenes, providing geometric priors that regularise reconstruction.
- **Volume rendering for supervision**: depth and colour are rendered through the hierarchical representation and compared against RGB-D input in the loss.
- **Joint tracking and mapping**: as in iMAP, tracking optimises camera poses against the frozen map while mapping optimises the grid features.

## Why it matters for SLAM

NICE-SLAM made neural implicit SLAM scalable to room-sized and larger environments, moving the field past iMAP's proof-of-concept stage. Its hierarchical feature-grid design became a standard pattern adopted by follow-ups such as ESLAM (tri-planes), Co-SLAM (hash grids), and Point-SLAM (neural points). Together with iMAP, it cemented the Replica / TUM RGB-D / ScanNet evaluation protocol used by most later neural SLAM papers.

## Related

- [iMAP](imap.md)
- [Co-SLAM](co-slam.md)
- [ESLAM](eslam.md)
- [Point-SLAM](point-slam.md)
- [NICER-SLAM](nicer-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
