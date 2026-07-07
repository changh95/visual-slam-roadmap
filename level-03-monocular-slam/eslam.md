# ESLAM

> Johari 2023 · [Paper](https://arxiv.org/abs/2211.11704)

**One-line summary** — Replaced NICE-SLAM's 3D feature voxel grids with a tri-plane representation, cutting neural SLAM memory from $O(N^3)$ to $O(N^2)$ while decoding signed distance fields for clean surfaces.

## Problem

Grid-based neural SLAM stores a feature vector per voxel, so memory grows cubically, $O(N^3)$, with scene resolution — NICE-SLAM's hierarchical grids consume significant GPU memory even at room scale, capping resolution and scene size. ESLAM ("Efficient Dense SLAM System Based on Hybrid Representation of Signed Distance Fields") reads sequential RGB-D frames with unknown poses and asks whether the volumetric feature field can be factorised into something fundamentally cheaper without losing reconstruction quality.

## Key ideas

- **Tri-plane representation**: the scene is encoded by "multi-scale axis-aligned perpendicular feature planes" $F_{xy}, F_{xz}, F_{yz}$; a 3D query point $(x,y,z)$ samples each plane bilinearly and the features are combined — memory grows with area, $O(N^2)$, not volume.
- **TSDF decoding**: shallow decoders map the interpolated plane features "into Truncated Signed Distance Field (TSDF) and RGB values"; rendering goes through an SDF-to-density transformation, which yields cleaner, better-defined surfaces than direct density fields.
- **Multi-scale planes**: coarse and fine tri-planes capture different detail levels, mirroring NICE-SLAM's hierarchical grids at quadratic cost.
- **Incremental operation, no pre-training**: ESLAM "reads RGB-D frames with unknown camera poses in a sequential manner and incrementally reconstructs the scene representation while estimating the current camera position" — and unlike NICE-SLAM's pre-trained decoder priors, it "does not require any pre-training."
- **Same SLAM loop, different representation**: tracking and mapping both optimise rendered-versus-observed losses as in iMAP/NICE-SLAM; the paper's contribution is showing how much the choice of scene encoding alone determines speed, memory, and accuracy.

## Results & impact

From the abstract: on Replica, ScanNet, and TUM RGB-D, ESLAM "improves the accuracy of 3D reconstruction and camera localization of state-of-the-art dense visual SLAM methods by more than 50%, while it runs up to 10 times faster and does not require any pre-training." The tri-plane factorisation also shrinks the memory footprint relative to dense feature grids — memory grows with scene area rather than volume — enabling larger scenes on the same hardware. Together with Co-SLAM (hash grids) and Point-SLAM (neural points), ESLAM defined the post-NICE-SLAM generation in which representation efficiency became the main axis of neural-SLAM research.

## Why it matters for SLAM

ESLAM is one of the three canonical answers (with Co-SLAM's hash grids and Point-SLAM's neural points) to the question that dominated post-NICE-SLAM neural SLAM research: how to make the map representation efficient. Its tri-plane idea, borrowed from generative 3D modelling, influenced subsequent memory-efficient dense SLAM designs and remains a useful pattern whenever a volumetric field must fit in limited GPU memory.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [Point-SLAM](point-slam.md)
- [iMAP](imap.md)
- [NeRF](../level-05-deep-learning/nerf.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
