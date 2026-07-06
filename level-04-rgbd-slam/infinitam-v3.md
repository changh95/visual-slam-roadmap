# InfiniTAM v3

> Prisacariu 2017 · [Paper](https://arxiv.org/abs/1708.00783)

**One-line summary** — A modular, cross-platform open-source RGB-D reconstruction framework combining voxel-hashed TSDF (or surfel) mapping, ICP/RGB tracking, random-fern relocalization, and loop closure.

## Key ideas

- **Voxel hashing for unbounded scenes**: instead of a fixed grid, TSDF voxel blocks are stored in a hash table and allocated only near observed surfaces, giving bounded memory for arbitrarily large scenes:
  $$h(\mathbf{b}) = \left(\mathbf{b}_x p_1 \oplus \mathbf{b}_y p_2 \oplus \mathbf{b}_z p_3\right) \bmod n$$
- **Pluggable map representations**: interchangeable backends — hashed TSDF volumetric reconstruction, surfel-based reconstruction, and sparse point cloud — behind a common integration/ray-cast interface.
- **Tracking against the scene raycast**: point-to-plane ICP aligns each depth image to a ray-cast prediction of the model, coarse-to-fine; RGB image alignment can be combined for robustness.
- **Relocalization with random ferns**: fern-encoded frame appearance recovers the pose after tracking loss, and supports loop-closure detection; pose corrections can trigger de-integration and re-integration of affected voxel blocks.
- **Cross-platform engineering**: runs on CPU, CUDA, and OpenCL — including mobile devices — with clean modular C++ that made it a favorite research baseline.

## Why it matters for SLAM

InfiniTAM v3 packaged the post-KinectFusion state of the art — voxel hashing, frame-to-model tracking, relocalization, loop closure — into one hackable framework, and became one of the most widely used open-source RGB-D reconstruction codebases. If you want to understand how a production-quality dense SLAM pipeline is engineered (memory management, GPU kernels, swappable map backends), reading InfiniTAM's code is one of the best exercises at this level.

## Related

- [KinectFusion](kinectfusion.md)
- [BundleFusion](bundlefusion.md)
- [ElasticFusion](elasticfusion.md)
- [Kintinuous](kintinuous.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
