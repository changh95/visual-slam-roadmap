# KinectFusion

> Newcombe 2011 · [Paper](https://ieeexplore.ieee.org/document/6162880)

**One-line summary** — The first real-time RGB-D dense SLAM system, using GPU-accelerated volumetric TSDF fusion and coarse-to-fine point-to-plane ICP tracking to reconstruct room-sized scenes at 30 Hz.

## Key ideas

- **GPGPU pipeline**: the entire system runs on the GPU (CUDA) — depth preprocessing, ICP, TSDF integration, and ray-casting — which is what made dense fusion real-time for the first time.
- **Tracking**: raw depth is bilateral-filtered, projected to a 3D vertex map with surface normals, and aligned to a ray-cast prediction of the model using coarse-to-fine point-to-plane ICP over three pyramid levels:
  $$\mathbf{T}^* = \arg\min_{\mathbf{T}} \sum_{i} \left( \mathbf{n}_i^\top \left(\mathbf{T}\,\mathbf{v}_i - \mathbf{u}_i\right) \right)^2$$
- **Mapping via volumetric TSDF integration**: a fixed voxel grid (e.g. $512^3$) stores a truncated signed distance $F(\mathbf{x})$ and weight $W(\mathbf{x})$ per voxel; each frame is fused by a weighted running average, so sensor noise averages out over time.
- **Frame-to-model tracking**: aligning against the accumulated model (ray-cast from the TSDF) instead of the previous frame greatly reduces drift and makes tracking robust to small scene changes.
- **Known limitations**: assumes a rigid, static scene (cannot model deformation), and the fixed-size volume means memory grows cubically with extent — restricting it to room-size scenes. Kintinuous and voxel hashing later addressed the scale limit; DynamicFusion addressed deformation.

## Why it matters for SLAM

KinectFusion established the standard pipeline — depth preprocessing, ICP tracking, TSDF fusion, ray-cast prediction — that virtually every subsequent RGB-D dense SLAM system builds on. It demonstrated that cheap consumer depth sensors plus GPU parallelism could deliver dense reconstruction that had previously required offline processing, sparking the entire wave of fusion systems (Kintinuous, ElasticFusion, BundleFusion, InfiniTAM) covered in this level.

## Related

- [ICP](icp.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [Kintinuous](kintinuous.md)
- [ElasticFusion](elasticfusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
