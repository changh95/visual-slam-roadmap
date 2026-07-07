# Voxel Map

A **voxel map** discretizes 3D space into a regular grid of cubes ("volume elements"), each storing local properties of the environment: occupancy probability, a truncated signed distance (TSDF), color, intensity, or semantic labels. Where a point cloud is a bag of surface samples, a voxel map is a **field over space** — it can represent free space and unknown space, not just surfaces, and it fuses repeated measurements of the same region instead of accumulating duplicates.

## What a voxel stores

- **Occupancy**: $p(\text{occupied})$ per voxel, updated with the log-odds Bayesian rule

$$
l_t = l_{t-1} + \log\frac{p(m \mid \mathbf{z}_t)}{1 - p(m \mid \mathbf{z}_t)} - l_0
$$

  so each new measurement adds/subtracts evidence; voxels along a sensor ray are updated as free, the voxel at the ray endpoint as occupied.
- **TSDF**: the signed distance from the voxel center to the nearest surface, clipped to a truncation band $t$:

$$
\mathrm{TSDF}(\mathbf{v}) = \mathrm{clip}\!\left(\frac{d(\mathbf{v}, \text{surface})}{t},\, -1,\, 1\right)
$$

  with sign distinguishing the free side from the occupied side. Successive depth frames are fused by a weighted running average per voxel (KinectFusion), and the surface is extracted at the zero crossing with Marching Cubes.
- **Color / semantics**: per-voxel appearance or class labels for semantic mapping.

## Taming $O(r^3)$ memory

A dense grid over volume $V$ at resolution $r$ costs $O\left((V/r)^3\right)$ memory — prohibitive for large scenes at centimeter resolution. Standard remedies:

- **Octrees (OctoMap)**: recursively subdivide space; large homogeneous regions (free or unknown) are represented by a single coarse node, occupied surfaces by fine leaves. Adaptive resolution plus probabilistic occupancy; the de-facto standard 3D occupancy map in robotics.
- **Voxel hashing**: only allocate voxel *blocks* (e.g., $8^3$ voxels) near observed surfaces, indexed by a spatial hash of their integer block coordinates. Gives $O(1)$ lookup and memory proportional to surface area rather than volume; the basis of large-scale real-time TSDF fusion (Nießner et al.'s voxel hashing, InfiniTAM).
- **Hierarchical sparse grids (OpenVDB-style)**: tree-of-grids structures from the graphics world, used in modern mapping backends for sparse storage at fine resolution.

## Trade-offs

- **Pros**: explicit free/unknown space (essential for collision checking and exploration), bounded memory per region regardless of how often it is re-observed, principled probabilistic fusion, constant-time spatial queries.
- **Cons**: resolution fixed by voxel size (fine detail costs memory cubically), discretization artifacts, and rigid grids make map deformation after loop closure awkward — correcting drift requires re-integration or submap shifting, which is why deformable surfel maps are the main competitor for dense SLAM.

## Why it matters for SLAM

- Voxel maps are the bridge from SLAM to **robotics use of the map**: path planning, obstacle avoidance, and exploration all need to ask "is this region free?" — a query point clouds cannot answer.
- TSDF voxel grids underpin dense RGB-D SLAM (KinectFusion and descendants) and provide the smooth surface models used for frame-to-model tracking via raycasting.
- OctoMap-style occupancy maps are the standard output representation when a SLAM system feeds a navigation stack (e.g., in ROS).

## Hands-on

- [Octree, OctoMap, Bonxai hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_08)

## Related

- [Occupancy grid mapping](occupancy-grid-mapping.md)
- [Point cloud](point-cloud.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
