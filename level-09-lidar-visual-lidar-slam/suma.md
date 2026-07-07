# SuMa

> Behley (Bonn) 2018 · [Paper](http://www.roboticsproceedings.org/rss14/p16.pdf)

**One-line summary** — SuMa (Surfel-based Mapping) performs real-time LiDAR SLAM by maintaining the environment as a surfel map and tracking each new scan with projective ICP on cylindrical range images, showing that dense-map LiDAR SLAM can work at urban scale without hand-crafted feature extraction.

## Problem

Feature-based LiDAR SLAM in the LOAM lineage depends on hand-tuned edge and planar feature detectors that are sensitive to the sensor's beam count and angular resolution — change the LiDAR model and the detectors need re-tuning. Using the full point-cloud geometry directly is more principled, but the dense surfel-based systems that pioneered this idea (ElasticFusion, InfiniTAM) were designed for short-range RGB-D sensors. Bringing surfel mapping outdoors to spinning LiDAR means coping with much larger scan ranges (roughly 0–100 m instead of 0–5 m), point density that thins out with distance, and the non-uniform angular sampling of a rotating sensor — all under a real-time budget at urban scale.

## Key ideas

- **Surfel map representation**: the global map is a set of surfels — oriented discs $(\mathbf{p}_i, \mathbf{n}_i, r_i, w_i)$ with position, unit normal, radius, and a confidence $w_i$ accumulated over observations. Surfels give a compact, continuous surface approximation that supports fast GPU rendering (they are stored in a GPU buffer), unlike raw point clouds or voxel grids.
- **Range image projection**: each spinning-LiDAR sweep is projected into a 2D cylindrical range image via

  $$(u, v) = \left(\left\lfloor \tfrac{\phi}{2\pi} W \right\rfloor,\; \left\lfloor \tfrac{\theta - \theta_{\min}}{\theta_{\max} - \theta_{\min}} H \right\rfloor\right)$$

  where $\phi$ is azimuth (columns) and $\theta$ is elevation (rows ≈ laser rings); every pixel stores depth and a normal estimated from neighboring pixels. This exploits the natural 2D structure of the scan.
- **Projective ICP tracking**: instead of expensive 3D nearest-neighbor search, the current surfel map is rendered from the pose estimate into a synthetic range image, and correspondences are found by pixel-to-pixel lookup at the same $(u, v)$. A point-to-plane ICP objective $\sum_k \left(\mathbf{n}_k^\top(\mathbf{T}\mathbf{p}_k - \hat{\mathbf{p}}_k)\right)^2$ is minimized by iterative linearization on $\mathfrak{se}(3)$.
- **Map update by surfel fusion**: after pose estimation, scan points are fused into the map — existing surfels are refined with confidence-weighted averaging of position and normal, and new surfels are created for previously unobserved regions.
- **Loop closure**: candidate loops are found by matching rendered views at keyframe poses, verified by aligning the current scan against rendered views of the map, and accepted closures are propagated through pose-graph optimization to keep the surfel map globally consistent.

## Results & impact

- On the KITTI odometry benchmark (sequences 00–10), SuMa achieves a mean relative translation error of about $1.01\%$ and rotation error of about $0.43°$ per 100 m — competitive with LOAM at the time — while running at roughly 15 Hz on a mid-range GPU (GTX 980).
- A dense surfel map of a full KITTI sequence (~2 km) fits in about 4 GB of GPU memory with surfel culling, showing that dense mapping scales to urban-length trajectories.
- Projective correspondence lookup is significantly faster than k-d-tree nearest-neighbor ICP at comparable accuracy — this is what makes dense-map tracking real-time.
- GPU-accelerated range-image rendering became a standard LiDAR tracking mechanism, and the range-image pipeline was adopted by SuMa++, RangeNet++, and later learned range-image methods.

## Why it matters for SLAM

SuMa brought the surfel-based dense mapping idea pioneered for short-range RGB-D sensors (ElasticFusion) to outdoor spinning LiDAR, handling far larger ranges and non-uniform point densities. It established GPU-rendered range images plus projective ICP as a standard LiDAR tracking mechanism, offering a dense-map alternative to feature-based pipelines like LOAM. Its range-image pipeline directly enabled the semantic extension SuMa++ and later learned processing of LiDAR range images.

## Related

- [SuMa++](sumapp.md)
- [LOAM](loam.md)
- [Range image](range-image.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
