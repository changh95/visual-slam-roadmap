# BundleFusion

> Dai 2016 · [Paper](https://arxiv.org/abs/1604.01093)

**One-line summary** — Globally consistent real-time RGB-D reconstruction via hierarchical local-to-global pose optimization, with on-the-fly TSDF de-integration and re-integration whenever poses are corrected.

## Problem

Scalable real-time 3D scanning suffers from pose drift that accumulates significant errors in the reconstructed model; global correction traditionally required hours of offline processing. The online methods that existed either needed minutes to perform correction (not truly real-time), used brittle frame-to-frame or frame-to-model tracking that failed catastrophically without recovery, or supported only unstructured point representations that limit scan quality. BundleFusion set out to solve all three at once: globally optimized poses, robust tracking with relocalization, and a high-quality volumetric model — all in real time.

## Key ideas

- **Global, not temporal, pose estimation**: rather than relying on temporal frame-to-frame tracking, every frame is continually localized against the *complete history* of RGB-D input — each new frame's pose is optimized within a global set of camera poses, which enables recovery from gross tracking failures (relocalization) for free.
- **Hierarchical local-to-global optimization**: frames are grouped into chunks that are bundle-adjusted locally; chunk keyframes then enter a global optimization. The hierarchy keeps per-frame cost bounded and scales to long sequences.
- **Sparse-then-dense correspondences**: sparse SIFT feature matches across all frames give coarse global pose estimates and loop-closure candidates; dense geometric (depth) and photometric (color) alignment then refines the poses — sparse features for large-scale robustness, dense residuals for accuracy.
- **On-the-fly TSDF re-integration**: when optimization changes a frame's pose, that frame's depth contribution is *de-integrated* from the TSDF using the old pose and re-integrated with the new one, so the dense model always reflects the current best pose estimates — global consistency without deforming the map.
- **Chunk-based, unbounded scenes**: the TSDF is stored in spatial chunks activated as the camera moves, supporting apartment-scale reconstruction without a fixed volume; a parallelizable optimization framework keeps the whole loop real-time on GPU.

## Results & impact

BundleFusion outperformed the online state of the art with quality on par with offline methods, at unprecedented speed and scan completeness — real-time globally consistent scanning of large indoor environments with recovery from tracking failure. It was the first system to combine sparse-feature global BA with dense TSDF re-integration in real time, set the quality standard for indoor 3D scanning, and was used to capture the ScanNet dataset, a cornerstone of 3D deep learning. Its re-integration idea remains the reference approach for keeping volumetric maps consistent under pose updates.

## Why it matters for SLAM

BundleFusion solved the problem that had haunted volumetric SLAM since KinectFusion: how to correct the dense map after loop closure without deformation artifacts. The de-integration/re-integration mechanism is the TSDF-world answer to ElasticFusion's map deformation, defining one side of the fundamental design fork in dense SLAM. Whenever a modern dense system needs to reconcile "poses change after optimization" with "the map is already fused", it is reusing this playbook.

## Related

- [KinectFusion](kinectfusion.md) — the fixed-volume TSDF fusion ancestor
- [ElasticFusion](elasticfusion.md) — the competing surfel-deformation approach to global consistency
- [InfiniTAM v3](infinitam-v3.md) — voxel-hashing framework for scalable TSDF storage
- [BAD SLAM](bad-slam.md) — later direct BA over dense geometry
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the design fork BundleFusion sits on

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
