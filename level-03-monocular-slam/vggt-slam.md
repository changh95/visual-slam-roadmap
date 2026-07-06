# VGGT-SLAM

> Maggio 2025 · [Paper](https://arxiv.org/abs/2505.12549)

**One-line summary** — Dense monocular RGB SLAM that uses VGGT as its front-end, aligning feed-forward submap reconstructions with an optimization on the SL(4) manifold to handle the projective ambiguity of uncalibrated reconstructions.

## Key ideas

- **VGGT as the front-end**: batches of frames are fed to VGGT, which returns camera poses, depth maps, and dense pointmaps in one forward pass — replacing feature extraction, matching, and triangulation with a single network.
- **Submap-based operation**: the incoming video is processed as overlapping submaps, each reconstructed by VGGT, which keeps memory bounded and enables incremental operation on long sequences.
- **Alignment on SL(4)**: reconstructions from uncalibrated monocular images are in general only defined up to a projective ambiguity, so adjacent submaps are related by a 15-DoF homography of 3D space rather than a similarity transform; VGGT-SLAM therefore optimizes submap alignment on the SL(4) manifold.
- **Backend consistency and loop closure**: a graph optimization over submap transforms enforces global consistency and incorporates loop-closure constraints, correcting the drift that a purely feed-forward pipeline accumulates.
- **Dense output**: fused pointmaps yield a dense map of the scene alongside the camera trajectory.

## Why it matters for SLAM

VGGT-SLAM is one of the first systems to show how a multi-view feed-forward foundation model can be wrapped into a proper SLAM loop — with keyframing, submaps, loop closure, and a principled treatment of the reconstruction ambiguity that such models leave unresolved. Its use of SL(4) rather than Sim(3) for submap alignment is a conceptually important observation for anyone building SLAM on top of uncalibrated feed-forward geometry. It sits in a direct line from DROID-SLAM and MASt3R-SLAM toward increasingly learned SLAM stacks.

## Related

- [VGGT](vggt.md) — the feed-forward front-end model
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — the follow-up system
- [MASt3R-SLAM](mast3r-slam.md) — SLAM built on pairwise pointmap predictions
- [DROID-SLAM](droid-slam.md) — earlier end-to-end learned SLAM with an optimization backend

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
