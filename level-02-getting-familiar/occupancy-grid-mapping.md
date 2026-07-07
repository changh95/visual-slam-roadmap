# Occupancy Grid Mapping

An **occupancy grid** discretizes space into cells (2D squares or 3D voxels) and stores, for each cell $m_i$, the probability $p(m_i)$ that it is occupied by an obstacle. Given known robot poses (from SLAM) and range measurements (LiDAR, sonar, depth camera), occupancy grid mapping fuses many noisy observations of each cell into a stable free/occupied/unknown classification — the map format that path planners actually consume.

## The binary Bayes filter per cell

The key modeling assumptions: each cell is a **binary, static** random variable (occupied or free, not changing over time), and cells are **independent** of each other. Under these assumptions the posterior over the whole map factorizes into per-cell posteriors, each updated with a binary Bayes filter as measurements $\mathbf{z}_{1:t}$ arrive.

Working with probabilities directly requires renormalizing every update. The standard trick is the **log-odds** representation:

$$
l = \log\frac{p}{1 - p}, \qquad p = 1 - \frac{1}{1 + \exp(l)}
$$

Log-odds maps $p \in (0,1)$ to $l \in (-\infty, \infty)$: $l = 0$ means unknown ($p = 0.5$), positive means likely occupied, negative means likely free. In log-odds form the Bayesian update becomes a simple **addition**:

$$
l_t(m_i) = l_{t-1}(m_i) + \log\frac{p(m_i \mid \mathbf{z}_t)}{1 - p(m_i \mid \mathbf{z}_t)} - l_0
$$

where:

- $l_t(m_i)$ — the cell's log-odds after incorporating measurement $\mathbf{z}_t$,
- $p(m_i \mid \mathbf{z}_t)$ — the **inverse sensor model**: the occupancy probability suggested by the current measurement alone,
- $l_0 = \log\frac{p(m_i)}{1 - p(m_i)}$ — the prior log-odds (zero for an uninformative prior of $0.5$).

No renormalization, no products — each observation just adds a constant increment. This is why occupancy mapping is cheap enough to run on embedded robots.

## The inverse sensor model and ray casting

For a range sensor, each beam is processed by **ray casting** the measured ray through the grid (e.g. with Bresenham line traversal):

- Cells **along the beam before the hit** were seen through, so they receive a *miss* update: a negative increment $l_{\text{free}}$ (e.g. inverse-model probability around $0.3-0.4$).
- The cell **at the measured range** reflected the beam: a positive *hit* increment $l_{\text{occ}}$ (e.g. probability around $0.6-0.7$).
- Cells **beyond the hit** are occluded — no information, no update.

Repeated agreeing observations accumulate, so a cell touched by twenty misses and one spurious hit still reads clearly free; a moving person leaves a temporary streak that later misses erase. Implementations typically **clamp** log-odds to a min/max range so cells stay updatable (this bounded-confidence clamping is what OctoMap does), and threshold $p$ (e.g. at $0.5$) to classify cells for planning.

## 2D grids, octrees, and voxels

A flat 2D grid is the classic representation for indoor mobile robots (ROS `nav_msgs/OccupancyGrid`). In 3D, dense grids cost $O(r^3)$ memory, so practical systems use hierarchical or sparse structures: **OctoMap** stores probabilistic occupancy in an octree that subdivides only where geometry exists and can prune uniform regions, while hash-based [voxel maps](voxel-map.md) trade the hierarchy for O(1) access. The per-cell log-odds math is identical in all of them.

## Why it matters for SLAM

SLAM gives you a trajectory and a landmark/point map — but a sparse [point cloud](point-cloud.md) cannot answer "is this space safe to drive through?", because it says nothing about *free* space. Occupancy grids explicitly represent free, occupied, and unknown volumes, which is what collision checking, frontier-based exploration, and path planning need. In practice the SLAM system supplies poses, and an occupancy mapper turns the posed scans into the costmap the navigation stack runs on; the log-odds filter also provides natural robustness to dynamic objects and sensor noise that raw geometric maps lack.

## Hands-on

- [Octree, OctoMap, Bonxai hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_08)
- [OctoMap on KITTI](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/octomap)

## Related

- [Voxel map](voxel-map.md)
- [Point cloud](point-cloud.md)
- [LiDAR](lidar.md)
- [Exteroceptive sensor](exteroceptive-sensor.md)
- [Basic Probability & Statistics](../level-01-beginner/basic-probability-and-statistics.md)
