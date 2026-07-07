# COLMAP

> Schönberger 2016 · [Paper](https://colmap.github.io/)

**One-line summary** — The de-facto standard open-source incremental Structure-from-Motion and Multi-View Stereo pipeline ("Structure-from-Motion Revisited", CVPR 2016), used as the offline reconstruction and ground-truth-poses workhorse across 3D vision.

## Problem

Incremental SfM — register images one at a time, triangulating structure and bundle-adjusting as you go — was well established by 2016, but existing pipelines (Bundler, VisualSFM) were fragile on internet-scale, unordered photo collections: bad initial pairs, wrong registrations, and drifting reconstructions were common, and no single open implementation was both robust and complete. Schönberger and Frahm's "Structure-from-Motion Revisited" systematically revisited each stage of the incremental pipeline and hardened it, releasing the result as COLMAP.

## Key ideas

- **Full incremental SfM pipeline**: feature extraction and matching, geometric verification into a scene graph, careful two-view initialisation, then repeated image registration (PnP), triangulation, and bundle adjustment.
- **Robustness improvements over prior SfM**: next-best-view selection for choosing which image to register next, robust multi-view triangulation, and iterative BA with re-triangulation and outlier filtering to fight drift and reconstruction degeneracies.
- **Multi-View Stereo backend**: a companion PatchMatch-based MVS stage ("Pixelwise View Selection for Unstructured Multi-View Stereo", ECCV 2016) estimates per-pixel depth and normals with pixelwise view selection, then fuses them into dense point clouds and meshes.
- **Engineering as a feature**: a well-maintained C++/CUDA codebase with a GUI, CLI, and `pycolmap` Python bindings, which is a major reason it became the community default.
- **Offline SfM, not SLAM**: COLMAP optimises over an unordered image collection without real-time constraints — trading speed for accuracy and completeness relative to online SLAM. Its per-image cost grows as the model grows, which is exactly the pain point that global-SfM (GLOMAP) and GPU-parallel (InstantSfM) successors target.

## Results & impact

COLMAP became the reference implementation of classical SfM: the tool used to build ground-truth poses for countless datasets, the initialisation step of most NeRF and 3D Gaussian Splatting pipelines, and the baseline every learned reconstruction method (DUSt3R, VGGT, ACE Zero) measures itself against. COLMAP remains the gold-standard SfM pipeline, but it is slow on large image collections — which is why a decade of follow-up work (GLOMAP's global SfM, InstantSfM's GPU pipeline, feed-forward pointmap models) frames itself explicitly as fixing COLMAP's speed while trying to keep its accuracy.

## Why it matters for SLAM

COLMAP is the reference point against which both SLAM systems and learned reconstruction methods are measured, and it is the standard tool for generating camera poses used to train and evaluate them — most NeRF and 3D Gaussian Splatting pipelines start from COLMAP poses. Understanding its incremental SfM design clarifies what SLAM does differently (sequential input, real-time budgets, loop closure), and newer systems such as GLOMAP, InstantSfM, and feed-forward models like DUSt3R explicitly position themselves against it.

## Related

- [GLOMAP](glomap.md)
- [InstantSfM](instantsfm.md)
- [DUSt3R](dust3r.md)
- [hloc](../level-05-deep-learning/hloc.md)
- [BARF](barf.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
