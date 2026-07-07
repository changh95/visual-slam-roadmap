# Kintinuous

> Whelan 2012 · [Paper](https://ieeexplore.ieee.org/document/6907054)

**One-line summary** — Extended KinectFusion to large-scale environments with a continuously shifting (rolling) TSDF volume plus place recognition, pose-graph optimization, and non-rigid map deformation for loop closure.

## Problem

KinectFusion's fixed-size TSDF volume (typically a few meters on a side) cannot represent environments larger than a desk or small room — once the camera moves beyond the volume boundary, tracking fails. Large-scale indoor mapping (hallways, apartments, buildings) requires a mechanism to extend the reconstruction indefinitely while still correcting the drift that inevitably accumulates over long trajectories.

## Key ideas

- **Rolling (shifting) TSDF volume**: as the camera translates, the TSDF volume moves with it — the volume is re-centered whenever the camera drifts beyond a threshold from the volume center ($\Delta\mathbf{t} = \mathbf{t}_{\text{cam}} - \mathbf{t}_{\text{volume center}}$). Voxels that fall behind the boundary are extracted as a triangulated mesh and appended to a cumulative cloud, breaking KinectFusion's fixed-volume constraint while keeping the live fusion machinery unchanged.
- **Geometric + photometric tracking**: camera pose estimation combines ICP-style geometric alignment with photometric (RGB) alignment, improving robustness where depth-only tracking degenerates (e.g. planar corridors with little geometric structure).
- **Loop closure with DBoW + SURF**: a bag-of-words vocabulary over SURF features detects previously visited places from keyframe appearance; candidate matches are verified for geometric consistency before being accepted.
- **Pose-graph optimization**: camera poses form a pose graph (optimized with iSAM/g2o-style solvers) that is corrected when a loop closes — the sparse counterpart to the dense rolling-volume front-end.
- **Non-rigid mesh deformation**: the pose-graph correction is propagated to the already-extracted mesh through an embedded deformation graph, moving each vertex with its nearest deformation nodes:
  $$\tilde{\mathbf{v}}_i = \mathbf{R}_k(\mathbf{v}_i - \mathbf{g}_k) + \mathbf{g}_k + \mathbf{t}_k$$
  where $\mathbf{g}_k, \mathbf{R}_k, \mathbf{t}_k$ are the position, rotation, and translation of deformation node $k$ — so the dense map bends into consistency instead of being rebuilt.

## Results & impact

Kintinuous demonstrated real-time dense mapping of multi-room environments and building corridors — far beyond KinectFusion's desk/room scale — with loop closure visibly reducing drift on long trajectories while maintaining reconstruction quality. It was the first system to break KinectFusion's fixed-volume constraint, and its two big ideas each had a lasting afterlife: the rolling-volume concept was adopted and refined by later systems (InfiniTAM's voxel hashing solves the same scalability problem differently), and the embedded-deformation-graph loop closure became the core mechanism of ElasticFusion, its direct successor by the same lead author.

## Why it matters for SLAM

Kintinuous was the first system to take dense volumetric fusion out of a single fixed volume and into corridors and whole buildings, showing that dense RGB-D SLAM could be a genuine large-scale mapping tool rather than a desktop scanning demo. Its rolling-volume idea was adopted and refined by later systems (e.g. InfiniTAM's voxel hashing solves the same problem differently), and it is the direct predecessor of ElasticFusion by the same lead author, which replaced the rolling volume with a deformable surfel map.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [InfiniTAM v3](infinitam-v3.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
