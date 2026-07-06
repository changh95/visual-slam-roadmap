# SuMa

> Behley (Bonn) 2018 · [Paper](http://www.roboticsproceedings.org/rss14/p16.pdf)

**One-line summary** — SuMa (Surfel-based Mapping) performs real-time LiDAR SLAM by maintaining the environment as a surfel map and tracking each new scan with projective ICP on cylindrical range images, showing that dense-map LiDAR SLAM can work at urban scale without hand-crafted feature extraction.

## Key ideas

- **Surfel map representation**: the global map is a set of surfels — oriented discs $(\mathbf{p}_i, \mathbf{n}_i, r_i, w_i)$ with position, unit normal, radius, and a confidence accumulated over observations. Surfels give a compact, continuous surface approximation that supports GPU rendering, unlike raw point clouds or voxel grids.
- **Range image projection**: each spinning-LiDAR sweep is projected into a 2D cylindrical range image (rows ≈ elevation/laser rings, columns ≈ azimuth), where every pixel stores depth and a normal estimated from neighboring pixels. This exploits the natural 2D structure of the scan.
- **Projective ICP tracking**: instead of expensive 3D nearest-neighbor search, the current surfel map is rendered from the pose estimate into a synthetic range image, and correspondences are found by pixel-to-pixel lookup. A point-to-plane ICP objective $\sum_k \left(\mathbf{n}_k^\top(\mathbf{T}\mathbf{p}_k - \hat{\mathbf{p}}_k)\right)^2$ is minimized by iterative linearization on $\mathfrak{se}(3)$.
- **Map update by surfel fusion**: after pose estimation, scan points are fused into the map — existing surfels are refined with confidence-weighted averaging, and new surfels are created for previously unobserved regions.
- **Loop closure**: candidate loops are verified by aligning the current scan against rendered views of the map, and accepted closures are propagated through pose-graph optimization to keep the surfel map globally consistent.

## Why it matters for SLAM

SuMa brought the surfel-based dense mapping idea pioneered for short-range RGB-D sensors (ElasticFusion) to outdoor spinning LiDAR, handling far larger ranges and non-uniform point densities. It established GPU-rendered range images plus projective ICP as a standard LiDAR tracking mechanism, offering a dense-map alternative to feature-based pipelines like LOAM. Its range-image pipeline directly enabled the semantic extension SuMa++ and later learned processing of LiDAR range images.

## Related

- [SuMa++](sumapp.md)
- [LOAM](loam.md)
- [Range image](range-image.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [ICP](../level-04-rgbd-slam/icp.md)

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
