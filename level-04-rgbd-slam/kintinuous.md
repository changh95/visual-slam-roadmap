# Kintinuous

> Whelan 2012 · [Paper](https://ieeexplore.ieee.org/document/6907054)

**One-line summary** — Extended KinectFusion to large-scale environments with a continuously shifting (rolling) TSDF volume plus place recognition, pose-graph optimization, and non-rigid map deformation for loop closure.

## Key ideas

- **Volume shift**: as the camera translates, the TSDF volume moves with it; voxels that fall behind the boundary are extracted as a triangulated mesh and appended to a cumulative cloud, breaking KinectFusion's fixed-volume constraint.
- **Geometric + photometric tracking**: camera pose estimation combines ICP-style geometric alignment with photometric (RGB) alignment, improving robustness where depth-only tracking degenerates.
- **Loop closure with DBoW + SURF**: a bag-of-words vocabulary over SURF features detects previously visited places; candidates are verified geometrically before being accepted.
- **Pose-graph optimization**: camera poses form a pose graph that is optimized when a loop closes, and the correction is propagated to the accumulated mesh by a non-rigid deformation based on an embedded deformation graph.
- **Real-time at building scale**: demonstrated dense mapping of multi-room environments and corridors, far beyond KinectFusion's desk/room scale.

## Why it matters for SLAM

Kintinuous was the first system to take dense volumetric fusion out of a single fixed volume and into corridors and whole buildings, showing that dense RGB-D SLAM could be a genuine large-scale mapping tool rather than a desktop scanning demo. Its rolling-volume idea was adopted and refined by later systems (e.g. InfiniTAM's voxel hashing solves the same problem differently), and it is the direct predecessor of ElasticFusion by the same lead author, which replaced the rolling volume with a deformable surfel map.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [InfiniTAM v3](infinitam-v3.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
