# VGGT-SLAM

> Maggio 2025 · [Paper](https://arxiv.org/abs/2505.12549)

**One-line summary** — Dense monocular RGB SLAM that uses VGGT as its front-end, aligning feed-forward submap reconstructions with an optimization on the SL(4) manifold to handle the projective ambiguity of uncalibrated reconstructions.

## Problem

VGGT reconstructs a batch of frames in one forward pass, but its GPU memory requirements make long video sequences infeasible to process in a single shot — the video must be split into submaps that are then aligned into one map. Related works align such submaps with similarity transforms (translation + rotation + scale), but VGGT-SLAM shows this is inadequate when the cameras are uncalibrated: the classical reconstruction-ambiguity result says the scene is then only defined up to a 15-degrees-of-freedom *projective* transformation of the true geometry, so a 7-DoF Sim(3) alignment cannot make two submaps agree.

## Key ideas

- **VGGT as the front-end**: batches of uncalibrated monocular frames are fed to VGGT, which returns camera poses, depth maps, and dense pointmaps in one forward pass — replacing feature extraction, matching, and triangulation entirely.
- **Submap-based operation**: the incoming video is processed as sequential submaps that are incrementally and globally aligned, keeping GPU memory bounded and enabling long sequences that VGGT alone cannot handle.
- **Reconstruction ambiguity, taken seriously**: with no assumptions on camera motion, scene structure, or intrinsics, an uncalibrated multi-view reconstruction is determined only up to a projective transform $\mathbf{X} \mapsto \mathbf{H}\mathbf{X}$ with $\mathbf{H} \in SL(4)$ — 15 DoF, versus 7 for Sim(3). Two VGGT submaps of the same scene can therefore differ by a full 3D homography, not just a scaled rigid motion.
- **Optimization on the SL(4) manifold**: VGGT-SLAM estimates the 15-DoF homographies between sequential submaps and optimizes them on the SL(4) manifold, incorporating loop-closure constraints in the same framework to recover a globally consistent reconstruction.
- **Dense output**: aligned submap pointmaps fuse into a dense map of the scene alongside the camera trajectory — dense RGB SLAM from a completely uncalibrated monocular camera.

## Results & impact

Extensive experiments verify that VGGT-SLAM achieves improved map quality on long video sequences that are infeasible for raw VGGT due to its high GPU requirements, and that SL(4) alignment outperforms similarity-transform alignment in the uncalibrated setting. The system quickly became the reference design for wrapping feed-forward multi-view models into a SLAM loop, and its successor VGGT-SLAM 2.0 builds directly on it.

## Why it matters for SLAM

VGGT-SLAM is one of the first systems to show how a multi-view feed-forward foundation model can be wrapped into a proper SLAM loop — with submaps, loop closure, and a principled treatment of the reconstruction ambiguity that such models leave unresolved. Its use of SL(4) rather than Sim(3) for submap alignment is a conceptually important observation for anyone building SLAM on top of uncalibrated feed-forward geometry. It sits in a direct line from DROID-SLAM and MASt3R-SLAM toward increasingly learned SLAM stacks.

## Related

- [VGGT](vggt.md) — the feed-forward front-end model
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — the follow-up system
- [MASt3R-SLAM](mast3r-slam.md) — SLAM built on pairwise pointmap predictions
- [DROID-SLAM](droid-slam.md) — earlier end-to-end learned SLAM with an optimization backend
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — background for the projective-ambiguity argument

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
