# ESLAM

> Johari 2023 · [Paper](https://arxiv.org/abs/2211.11704)

**One-line summary** — Replaced NICE-SLAM's 3D feature voxel grids with a tri-plane representation, cutting neural SLAM memory from $O(N^3)$ to $O(N^2)$ while decoding signed distance fields for clean surfaces.

## Key ideas

- **Tri-plane representation**: the scene is encoded by three axis-aligned 2D feature planes $F_{xy}, F_{xz}, F_{yz}$; a 3D query point samples each plane bilinearly and concatenates the features — memory grows with area, not volume.
- **SDF decoding**: a lightweight MLP maps the concatenated tri-plane features to a signed distance value and colour; rendering goes through an SDF-to-density transformation, which yields cleaner surfaces than direct density fields.
- **Multi-scale planes**: coarse and fine tri-planes capture different detail levels, mirroring NICE-SLAM's hierarchical grids at $O(N^2)$ cost.
- **Memory savings in practice**: reported reconstruction quality comparable to NICE-SLAM on Replica/ScanNet with roughly 50-70% less memory, enabling larger scenes on the same GPU.

## Why it matters for SLAM

ESLAM is one of the three canonical answers (with Co-SLAM's hash grids and Point-SLAM's neural points) to the question that dominated post-NICE-SLAM neural SLAM research: how to make the map representation efficient. Its tri-plane idea, borrowed from generative 3D modelling, influenced subsequent memory-efficient dense SLAM designs and remains a useful pattern whenever a volumetric field must fit in limited GPU memory.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [Point-SLAM](point-slam.md)
- [iMAP](imap.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
