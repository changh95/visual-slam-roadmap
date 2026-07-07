# Point Cloud

A **point cloud** is a set of 3D points $\{\mathbf{X}_i\}$, $\mathbf{X}_i \in \mathbb{R}^3$, optionally carrying per-point attributes such as color, surface normal, or return intensity (LiDAR). It is the simplest and most universal 3D map representation: no connectivity, no grid, just samples of the environment's surfaces.

## Where the points come from

- **Sparse point cloud**: only triangulated feature map points (ORB-SLAM style). Thousands of points; very low memory; good for localization but carries no dense surface geometry.
- **Dense point cloud**: every valid depth-image pixel back-projected to 3D. For a pixel $(u, v)$ with depth $d$ and intrinsics $(f_x, f_y, c_x, c_y)$:

$$
\mathbf{X} = d \begin{bmatrix} (u - c_x)/f_x \\ (v - c_y)/f_y \\ 1 \end{bmatrix}
$$

  A single VGA depth frame yields ~300k points, so dense clouds are memory-hungry and need spatial indexing (kd-tree or voxel hash map, as in PCL and Open3D).
- **LiDAR scans**: direct range measurements converted to Cartesian points, typically 10–20 Hz sweeps.

## Core operations

**Downsampling (voxel-grid filter).** Partition space into cubes of edge length $\ell$; replace all points in a cube by their centroid. This bounds density, removes redundancy, and makes later processing (ICP, normal estimation) tractable.

**Normal estimation via local PCA.** For each point, collect its $k$ nearest neighbors, form the local covariance

$$
C = \frac{1}{k} \sum_{i=1}^{k} (\mathbf{p}_i - \bar{\mathbf{p}})(\mathbf{p}_i - \bar{\mathbf{p}})^T
$$

and take the eigenvector of $C$ with the **smallest** eigenvalue as the surface normal (the direction of least local spread). The eigenvalue ratios also give a local planarity/curvature measure, used e.g. to pick edge vs. planar features in LiDAR odometry.

**Nearest-neighbor search.** Correspondence search (the inner loop of ICP) requires fast NN queries, provided by kd-trees or voxel hashing.

**Registration.** Two clouds are aligned by estimating the rigid transform $(R, \mathbf{t})$ minimizing $\sum_i \lVert \mathbf{q}_i - (R\mathbf{p}_i + \mathbf{t}) \rVert^2$ — solved in closed form by SVD of the cross-covariance matrix when correspondences are known, and iterated with re-matching otherwise (ICP).

## Strengths and weaknesses

- **Strengths**: trivially incremental (just append points), sensor-agnostic, exact sample positions preserved, easy to transform (apply $R, \mathbf{t}$ per point).
- **Weaknesses**: no explicit surface or free-space information (you cannot ray-cast "is this cell empty?" directly), unbounded growth over time, duplicated points on re-observed surfaces, and no built-in noise fusion — unlike occupancy grids or TSDF voxel maps, a raw point cloud does not average repeated measurements.

This is why dense SLAM systems typically use point clouds as the **input/intermediate** representation and fuse them into voxel (TSDF/occupancy) or surfel maps for the persistent model.

## Why it matters for SLAM

- The sparse map in feature-based SLAM *is* a point cloud; tracking solves PnP against it.
- RGB-D and LiDAR odometry align consecutive point clouds (ICP and variants) to estimate ego-motion.
- Dense mapping pipelines convert depth frames to point clouds, then integrate them into TSDF or occupancy structures.
- Map quality checks (density, coverage, degenerate coplanar geometry) are performed on the cloud; a coplanar cloud is a degenerate configuration for initialization.

## Hands-on

- [Point cloud preprocessing](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_04)

## Related

- [Voxel map](voxel-map.md)
- [kd-tree](kd-tree.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [LiDAR](lidar.md)
