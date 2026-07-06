# PIN-SLAM

> Pan (Bonn) 2024 · [Paper](https://arxiv.org/abs/2401.09101)

**One-line summary** — PIN-SLAM replaces the explicit point-cloud map with a sparse set of optimizable neural points encoding a local implicit SDF, enabling correspondence-free registration and — crucially — a map that deforms elastically when loop closures correct the trajectory.

## Key ideas

- **Point-based implicit neural map**: the map is a sparse set of neural points with learnable features; a small decoder turns them into a local signed distance field (SDF). This is far more compact than dense voxel grids while remaining reconstructable into accurate, complete meshes.
- **Correspondence-free registration**: incoming range measurements are aligned by minimizing the SDF values at scan endpoints (point-to-implicit registration) — no nearest-neighbor data association at all, and fast enough to run at sensor frame rate on a moderate GPU thanks to voxel-hashed neural point indexing.
- **Elastic loop closure**: because the map lives in the neural points themselves, a global pose adjustment simply moves the points with the corrected poses — the map deforms smoothly instead of tearing or ghosting the way rigid point-cloud maps do when re-aligned.
- **Neural point features double as descriptors**: loop closures are detected using the same local features that encode geometry.
- **Sensor-versatile**: validated on diverse environments with both LiDAR and RGB-D input, with pose accuracy better than or on par with state-of-the-art LiDAR odometry/SLAM and superior to earlier neural implicit SLAM systems.

## Why it matters for SLAM

Neural implicit SLAM (iMAP, NICE-SLAM) began as a slow, room-scale RGB-D affair; PIN-SLAM is the demonstration that implicit maps scale to outdoor LiDAR SLAM with global consistency — the first system to make the neural map itself loop-closure-aware through elastic deformation. It marks the credible entry of learned map representations into the LiDAR domain that FAST-LIO2 and LOAM dominated with classical structures, and it points toward maps that are simultaneously compact, dense-reconstructable, and globally consistent.

## Related

- [FAST-LIO2](fast-lio2.md) — classical direct registration baseline it competes with
- [SuMa](suma.md) — earlier dense (surfel) LiDAR map representation
- [iMAP](../level-03-monocular-slam/imap.md) — origin of neural implicit SLAM
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md) — hierarchical neural implicit RGB-D SLAM predecessor

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
