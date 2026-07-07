# hloc

> Sarlin 2019 · [Code](https://github.com/cvg/Hierarchical-Localization)

**One-line summary** — The open-source toolbox implementing HF-Net's hierarchical localization recipe — coarse place retrieval (NetVLAD) followed by fine local matching (SuperPoint + SuperGlue) and PnP — which became the community-standard visual localization pipeline.

## Problem

The coarse-to-fine localization paradigm from HF-Net ("From Coarse to Fine: Robust Hierarchical Localization at Large Scale", CVPR 2019) is a multi-stage system — global descriptors, retrieval, local features, matching, SfM triangulation, PnP — and every research group re-implementing that chain from scratch made results hard to reproduce and compare. Large-scale localization must be both fast (a query cannot be matched against every database image) and accurate (retrieval alone gives only coarse, meter-level location). hloc packages the whole chain as maintained software, so state-of-the-art localization becomes a configuration choice rather than an engineering project.

## Method & architecture

The toolbox is organized as scripts that execute the hierarchical localization pipeline end-to-end (per the repo's own pipeline description):

1. **Local feature extraction** for all database and query images — SuperPoint, DISK, D2-Net, SIFT, or R2D2 via `hloc/extractors/`.
2. **Reference 3D SfM model construction**: find covisible database pairs (via retrieval or a prior SfM model), match them with SuperGlue or the faster LightGlue (`hloc/matchers/`), and triangulate a new SfM model with COLMAP (pure pycolmap since v1.3, no COLMAP install needed). When lidar scans provide geometry (e.g. InLoc), this step is skipped.
3. **Coarse retrieval**: a global descriptor — NetVLAD, AP-GeM/DIR, OpenIBL, or MegaLoc — retrieves the top-$k$ database images relevant to each query (e.g. NetVLAD top-50 for Aachen).
4. **Fine matching** of query features against the retrieved images (learned matchers or NN with ratio/distance/mutual checks; dense LoFTR matching is also supported).
5. **Localization**: the resulting 2D-3D correspondences are fed to a PnP + RANSAC solver for the 6-DoF query pose, with a modular API exposing all estimator parameters.
6. **Visualization and debugging**: each run logs, per query, the retrieved images, matches, and pose-solver statistics such as RANSAC inliers.

Features and matches are exchanged as HDF5 files with a documented layout, so any PyTorch extractor/matcher can be dropped in by subclassing `BaseModel` — which is exactly how DISK, LightGlue, LoFTR, SOSNet, CosPlace and others were absorbed over the versions (v1.0 2020 → v1.4 2023). Ready-made `hloc/pipelines/` cover Aachen Day-Night, InLoc, Extended CMU Seasons, RobotCar Seasons, 4Seasons, Cambridge Landmarks, and 7-Scenes, and the same stack runs SfM reconstruction from scratch on unordered images.

## Results

Numbers reported in the repository (evaluated on visuallocalization.net), fractions of queries localized within the benchmark's three accuracy thresholds:

- **Aachen Day-Night** with NetVLAD top-50 retrieval + SuperPoint + SuperGlue: **89.6 / 95.4 / 98.8** (day) and **86.7 / 93.9 / 100** (night). Replacing SuperGlue with nearest-neighbor matching drops night performance to 75.5 / 86.7 / 92.9 — the learned matcher is what buys night-time robustness.
- **InLoc** with SuperPoint + SuperGlue: **46.5 / 65.7 / 78.3** (DUC1) and **52.7 / 72.5 / 79.4** (DUC2); with temporal consistency 49.0 / 68.7 / 80.8 and 53.4 / 77.1 / 82.4.
- These SuperPoint + SuperGlue configurations were long the dominant entries on the Long-Term Visual Localization benchmarks, and hloc remains the harness in which new features and matchers (DISK, LightGlue, LoFTR, ...) demonstrate their value.

## Why it matters for SLAM

For anyone building relocalization, loop closure, or map-based localization, hloc is the reference implementation to start from: it operationalizes the coarse-to-fine paradigm with state-of-the-art learned components and known-good defaults, bridging offline COLMAP mapping and online relocalization with one feature stack. Many research systems and product prototypes use hloc either directly or as the template for their own localization stacks, and its pickle logs of per-query inliers make failure analysis — the daily bread of localization engineering — unusually easy.

## Related

- [HF-Net](hf-net.md) — the paper whose hierarchical localization scheme hloc implements
- [NetVLAD](netvlad.md) — the coarse retrieval descriptor
- [SuperPoint](superpoint.md) — default local features
- [SuperGlue](superglue.md) — the learned matcher at the fine stage
- [LightGlue](lightglue.md) — faster matcher that later became the default
- [COLMAP](../level-03-monocular-slam/colmap.md) — the SfM backbone hloc maps and localizes against
- [DISK](disk.md) — learned features absorbed into the toolbox
