# KinectFusion

> Newcombe 2011 · [Paper](https://ieeexplore.ieee.org/document/6162880)

**One-line summary** — The first real-time RGB-D dense SLAM system, using GPU-accelerated volumetric TSDF fusion and coarse-to-fine point-to-plane ICP tracking to reconstruct room-sized scenes at 30 Hz.

## Problem

Before KinectFusion, dense 3D reconstruction required expensive offline processing or slow sequential algorithms. The consumer Kinect sensor suddenly provided cheap depth streams at 30 fps, but no system could fuse that data into a coherent surface model in real time. KinectFusion bridged the gap with an entirely GPU-resident pipeline — no offline steps, no feature extraction — turning a $150 game peripheral into a live 3D scanner.

## Key ideas

- **GPGPU pipeline**: the entire loop — `depth capture → bilateral filter → vertex/normal maps → ICP (3 levels) → TSDF update → ray-cast prediction` — runs on the GPU (CUDA), which is what made dense fusion real-time for the first time.
- **Depth preprocessing**: raw Kinect depth is bilateral-filtered to reduce noise, then back-projected to a 3D vertex map with surface normals computed by finite differences.
- **Coarse-to-fine point-to-plane ICP tracking**: the camera pose $\mathbf{T} \in \mathrm{SE}(3)$ is estimated by aligning the current vertex/normal maps against a ray-cast prediction of the model over three pyramid levels:
  $$\mathbf{T}^* = \arg\min_{\mathbf{T}} \sum_{i} \left( \mathbf{n}_i^\top \left(\mathbf{T}\,\mathbf{v}_i - \mathbf{u}_i\right) \right)^2$$
  where $\mathbf{v}_i$ is a measured vertex and $\mathbf{u}_i, \mathbf{n}_i$ the corresponding model vertex and normal. Correspondences come from projective data association, avoiding expensive nearest-neighbor search.
- **Mapping via volumetric TSDF integration**: a fixed voxel grid (e.g. $512^3$ at 2-3 mm resolution) stores a truncated signed distance $F(\mathbf{x})$ and weight $W(\mathbf{x})$ per voxel; each frame is fused by the weighted running average
  $$F_{t+1}(\mathbf{x}) = \frac{W_t(\mathbf{x})\,F_t(\mathbf{x}) + w_t(\mathbf{x})\,f_t(\mathbf{x})}{W_t(\mathbf{x}) + w_t(\mathbf{x})},$$
  so sensor noise averages out over time. The per-frame measurement is the projective signed distance, truncated to a narrow band: $f_t(\mathbf{x}) = \Psi\big((d_t(\pi(\mathbf{K}\mathbf{T}_t^{-1}\mathbf{x})) - \lambda^{-1}\|\mathbf{x} - \mathbf{t}_t\|)/\mu\big)$ with $\Psi(\eta) = \min(1, \max(-1, \eta))$.
- **Surface prediction via ray-casting**: marching rays through the TSDF to its zero crossing yields a predicted vertex/normal map — the reference for the next frame's ICP and the rendered surface shown to the user.
- **Frame-to-model tracking**: aligning against the accumulated model instead of the previous frame greatly reduces drift and makes tracking robust to small scene changes — a defining design choice inherited by nearly all later dense systems.
- **Known limitations**: assumes a rigid, static scene (cannot model deformation), and the fixed-size volume (~a few meters cubed) means memory grows cubically with extent — restricting it to room-size scenes. Kintinuous and voxel hashing later addressed the scale limit; DynamicFusion addressed deformation.

## Results & impact

KinectFusion demonstrated real-time (30 Hz) dense reconstruction of room-sized scenes with a single Kinect and GPU, and won the Best Paper award at ISMAR 2011. It established the standard pipeline — depth preprocessing, ICP tracking, TSDF fusion, ray-cast prediction — for all subsequent RGB-D dense SLAM systems, and proved that GPU parallelism could bring dense reconstruction from offline batch processing to interactive rates. Its main limitations (fixed volume, static-scene assumption) defined the research agenda for the systems that followed: Kintinuous, ElasticFusion, BundleFusion, InfiniTAM, and DynamicFusion.

## Why it matters for SLAM

KinectFusion established the standard pipeline — depth preprocessing, ICP tracking, TSDF fusion, ray-cast prediction — that virtually every subsequent RGB-D dense SLAM system builds on. It demonstrated that cheap consumer depth sensors plus GPU parallelism could deliver dense reconstruction that had previously required offline processing, sparking the entire wave of fusion systems (Kintinuous, ElasticFusion, BundleFusion, InfiniTAM) covered in this level.

## Related

- [ICP](icp.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [Kintinuous](kintinuous.md)
- [ElasticFusion](elasticfusion.md)
- [DynamicFusion](dynamicfusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
