# PIN-SLAM

> Pan (Bonn) 2024 · [Paper](https://arxiv.org/abs/2401.09101)

**One-line summary** — PIN-SLAM replaces the explicit point-cloud map with a sparse set of optimizable neural points encoding a local implicit SDF, enabling correspondence-free registration and — crucially — a map that deforms elastically when loop closures correct the trajectory.

## Problem

Classical LiDAR maps — point clouds, voxel grids, surfels — are rigid: when a loop closure corrects accumulated drift, the already-built map cannot be smoothly re-shaped to match the corrected trajectory, so systems either rebuild it or live with seams and ghosting. Neural implicit maps are deformable and compact, but earlier neural SLAM systems targeted room-scale RGB-D input and were far too slow for outdoor LiDAR rates. PIN-SLAM brings implicit neural mapping to LiDAR scale while making global consistency a first-class property of the map itself.

## Key ideas

- **Point-based implicit neural map**: the map is a sparse set of optimizable neural points carrying learnable feature vectors; a small decoder turns a query location and its neighboring point features into a local **signed distance field (SDF)** value. The representation is highly compact compared to dense grids yet can be reconstructed into accurate, complete meshes.
- **Alternating odometry and mapping**: the system alternates between *incremental learning* of the local SDF and *pose estimation* against the current local map. The map update fits the neural point features to signed-distance supervision derived from the range measurements,

  $$\mathcal{L}_{\text{SDF}} = \sum_s \big(\phi(\mathbf{q}_s) - d_s\big)^2 + \lambda\, \mathcal{L}_{\text{Eikonal}},$$

  where $d_s$ are signed distances sampled along the beams and the Eikonal term encourages a valid distance field with $\|\nabla \phi\| = 1$.
- **Correspondence-free registration**: incoming range measurements are aligned by minimizing the SDF at the scan endpoints — conceptually $\hat{\mathbf{T}} = \arg\min_{\mathbf{T}} \sum_i \phi\big(\mathbf{T}\,\mathbf{p}_i\big)^2$ — a point-to-implicit model registration with **no nearest-neighbor data association at all**: the implicit surface supplies residual and gradient directly.
- **Elastic loop closure**: the neural points are inherently elastic and deformable — when a loop closure triggers a global pose adjustment, the points (and thus the map) move consistently with the corrected poses instead of tearing or ghosting the way rigid maps do when re-aligned.
- **Neural point features double as descriptors**: loop closures are *detected* using the same local neural point features that encode geometry — the map representation and the place recognition share one learned encoding.
- **Efficient by construction**: voxel hashing indexes the neural points, and the correspondence-free registration avoids closest-point search, letting the system run at the sensor frame rate on a moderate GPU.

## Results & impact

Extensive experiments validate that PIN-SLAM is robust across various environments and versatile across range sensors — both LiDAR and RGB-D. Its pose estimation accuracy is better than or on par with state-of-the-art LiDAR odometry and SLAM systems, and it outperforms recent neural implicit SLAM approaches, while maintaining a more consistent and highly compact implicit map that can be reconstructed into accurate and complete meshes. It runs at the sensor frame rate on a moderate GPU, and the code is open source (`PRBonn/PIN_SLAM`).

## Why it matters for SLAM

Neural implicit SLAM (iMAP, NICE-SLAM) began as a slow, room-scale RGB-D affair; PIN-SLAM is the demonstration that implicit maps scale to outdoor LiDAR SLAM with global consistency — the first system to make the neural map itself loop-closure-aware through elastic deformation. It marks the credible entry of learned map representations into the LiDAR domain that FAST-LIO2 and LOAM dominated with classical structures, and it points toward maps that are simultaneously compact, dense-reconstructable, and globally consistent.

## Related

- [FAST-LIO2](fast-lio2.md) — classical direct registration baseline it competes with
- [SuMa](suma.md) — earlier dense (surfel) LiDAR map representation
- [iMAP](../level-03-monocular-slam/imap.md) — origin of neural implicit SLAM
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — hierarchical neural implicit RGB-D SLAM predecessor
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the global adjustment that the elastic map absorbs

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
