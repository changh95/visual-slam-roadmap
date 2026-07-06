# COLMAP

> Schönberger 2016 · [Paper](https://colmap.github.io/)

**One-line summary** — The de-facto standard open-source incremental Structure-from-Motion and Multi-View Stereo pipeline ("Structure-from-Motion Revisited", CVPR 2016), used as the offline reconstruction and ground-truth-poses workhorse across 3D vision.

## Key ideas

- **Full incremental SfM pipeline**: feature extraction and matching, geometric verification into a scene graph, careful two-view initialisation, then repeated image registration (PnP), triangulation, and bundle adjustment.
- **Robustness improvements over prior SfM**: next-best-view selection for choosing which image to register next, robust multi-view triangulation, and iterative BA with re-triangulation and outlier filtering to fight drift and reconstruction degeneracies.
- **Multi-View Stereo backend**: a companion PatchMatch-based MVS stage (ECCV 2016) estimates per-pixel depth and normals with pixelwise view selection, then fuses them into dense point clouds and meshes.
- **Engineering as a feature**: a well-maintained C++/CUDA codebase with a GUI, CLI, and `pycolmap` Python bindings, which is a major reason it became the community default.
- **Offline SfM, not SLAM**: COLMAP optimises over an unordered image collection without real-time constraints — trading speed for accuracy and completeness relative to online SLAM.

## Why it matters for SLAM

COLMAP is the reference point against which both SLAM systems and learned reconstruction methods are measured, and it is the standard tool for generating camera poses used to train and evaluate them — most NeRF and 3D Gaussian Splatting pipelines start from COLMAP poses. Understanding its incremental SfM design clarifies what SLAM does differently (sequential input, real-time budgets, loop closure), and newer systems such as GLOMAP, InstantSfM, and feed-forward models like DUSt3R explicitly position themselves against it.

## Related

- [GLOMAP](glomap.md)
- [InstantSfM](instantsfm.md)
- [DUSt3R](dust3r.md)
- [hloc](../level-05-deep-learning/hloc.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
