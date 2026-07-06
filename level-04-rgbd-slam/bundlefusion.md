# BundleFusion

> Dai 2016 · [Paper](https://arxiv.org/abs/1604.01093)

**One-line summary** — Globally consistent real-time RGB-D reconstruction via hierarchical local-to-global pose optimization, with on-the-fly TSDF de-integration and re-integration whenever poses are corrected.

## Key ideas

- **Local-to-global optimization**: frames are grouped into chunks that are bundle-adjusted locally; chunk keyframes then enter a global optimization, giving a hierarchical structure that scales to long sequences.
- **Sparse RGB features for coarse poses**: SIFT correspondences across frames provide coarse global pose estimates and loop-closure candidates — sparse features handle large-scale alignment where dense methods would diverge.
- **Fine refinement, geometric + photometric**: coarse poses are refined by dense alignment that minimizes both depth (geometric) and color (photometric) residuals.
- **On-the-fly TSDF re-integration**: when optimization changes a frame's pose, its depth contribution is *de-integrated* from the TSDF using the old pose and re-integrated with the new one, so the dense model always reflects the best current pose estimates.
- **Chunk-based, unbounded scenes**: the TSDF is stored in spatial chunks activated as the camera moves, supporting apartment-scale reconstruction without a fixed volume.

## Why it matters for SLAM

BundleFusion was the first system to combine sparse-feature global bundle adjustment with dense TSDF re-integration in real time, solving the problem that had haunted volumetric SLAM since KinectFusion: how to correct the dense map after loop closure without deformation artifacts. It set the quality standard for real-time indoor 3D scanning, and the ScanNet dataset — a cornerstone of 3D deep learning — was captured with it. Its re-integration idea remains the reference approach for keeping volumetric maps consistent under pose updates.

## Related

- [KinectFusion](kinectfusion.md) — the fixed-volume TSDF fusion ancestor
- [ElasticFusion](elasticfusion.md) — the competing surfel-deformation approach to global consistency
- [InfiniTAM v3](infinitam-v3.md) — voxel-hashing framework for scalable TSDF storage
- [BAD SLAM](bad-slam.md) — later direct BA over dense geometry
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the design fork BundleFusion sits on

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
