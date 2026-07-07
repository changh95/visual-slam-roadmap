# LOAM

> Zhang 2014 · [Paper](https://www.ri.cmu.edu/pub_files/2014/7/Ji_LidarMapping_RSS2014_v8.pdf)

**One-line summary** — LOAM established the foundational LiDAR SLAM recipe — extract edge and planar features, then split estimation into high-frequency scan-to-scan odometry and low-frequency scan-to-map refinement — that virtually every later LiDAR system builds on or reacts against.

## Problem

LiDAR SLAM faces two competing requirements: real-time operation demands fast processing, but accuracy demands registering each sweep against a large, consistent global map. Naive scan-to-map matching is too slow for real time, while pure frame-to-frame odometry drifts quickly. LOAM (RSS 2014) resolves the tension by decoupling the problem into two cooperating processes running at different frequencies — a design that let a spinning LiDAR on a moving vehicle be tracked accurately with the compute of a standard laptop.

## Key ideas

- **Edge + planar features from curvature**: points on each scan ring are classified by a local curvature score computed from their neighbors on the same ring,

  $$c = \frac{1}{|S| \cdot \|\mathbf{p}_i\|} \Big\| \sum_{j \in S,\, j \neq i} (\mathbf{p}_j - \mathbf{p}_i) \Big\|,$$

  with the highest-curvature points kept as *edge* features and the lowest-curvature points as *planar* features — drastically reducing the data used for registration.
- **Two algorithms at two frequencies**: a fast odometry process (around 10 Hz) registers consecutive sweeps for low-latency motion estimates, while a slower mapping process (around 1 Hz) registers the sweep against the accumulated feature map with a more exhaustive search, correcting the odometry's drift.
- **Point-to-line / point-to-plane residuals**: the pose $\mathbf{T}$ is estimated by minimizing geometric distances rather than point-to-point ICP,

  $$\min_{\mathbf{T}} \sum_{\text{edges}} d_e(\mathbf{T})^2 + \sum_{\text{planes}} d_p(\mathbf{T})^2,$$

  where $d_e$ is the distance of an edge point to the line through two matched map edge points, and $d_p$ is the distance of a planar point to the plane through three matched map points.
- **Motion de-skewing**: because a spinning LiDAR moves during a sweep (~100 ms), each point is timestamped and corrected by interpolating the pose across the sweep duration — a preprocessing step that became standard in all subsequent LiDAR pipelines.
- **No loop closure by design**: LOAM is an odometry-and-mapping system; global consistency mechanisms were left to its descendants.

## Results & impact

On the KITTI odometry benchmark, LOAM achieved relative translation error below 1% and ranked first at publication — and it held a top position for years while running in real time on a standard laptop with a Velodyne HDL-64E. Its vocabulary and structure propagated everywhere: LeGO-LOAM and LIO-SAM inherit the edge/planar feature extraction and odometry/mapping split directly, and countless "X-LOAM" variants adapted the recipe to new platforms and sensors.

## Why it matters for SLAM

LOAM is to LiDAR SLAM what PTAM is to visual SLAM: the architectural template. LeGO-LOAM and LIO-SAM inherit its feature extraction and odometry/mapping split directly; FAST-LIO2 defines itself in opposition to it by dropping feature extraction entirely. If you read one classical LiDAR paper, read this one — the vocabulary of "edge features," "planar features," and "scan-to-map refinement" that pervades the field starts here.

## Related

- [LIO-SAM](lio-sam.md) — adds IMU preintegration, factor graph, GPS, and loop closure to the LOAM recipe
- [FAST-LIO2](fast-lio2.md) — the direct, feature-free counterpoint
- [SuMa](suma.md) — contemporary alternative built on surfels and range images
- [LiDAR](../level-02-getting-familiar/lidar.md) — sensor background
- [ICP](../level-04-rgbd-slam/icp.md) — the classical registration algorithm LOAM's residuals refine

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
