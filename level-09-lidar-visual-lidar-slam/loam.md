# LOAM

> Zhang 2014 · [Paper](https://www.ri.cmu.edu/pub_files/2014/7/Ji_LidarMapping_RSS2014_v8.pdf)

**One-line summary** — LOAM established the foundational LiDAR SLAM recipe — extract edge and planar features, then split estimation into high-frequency scan-to-scan odometry and low-frequency scan-to-map refinement — that virtually every later LiDAR system builds on or reacts against.

## Key ideas

- **Edge + planar features**: points on each scan ring are classified by local curvature — high-curvature points become *edge* features, low-curvature points become *planar* features — drastically reducing the data used for registration.
- **Two algorithms at two frequencies**: a fast odometry process registers consecutive sweeps using point-to-line and point-to-plane distances for low-latency motion estimates, while a slower mapping process registers the sweep against the accumulated map to correct drift with higher accuracy.
- **Point-to-line / point-to-plane residuals**: the pose is estimated by minimizing geometric distances of edge points to matched map lines and planar points to matched map planes, rather than raw point-to-point ICP.
- **Motion de-skewing**: because a spinning LiDAR moves during a sweep, each point is timestamped and corrected by interpolating the pose across the sweep — a preprocessing step that became standard in all subsequent LiDAR pipelines.
- Achieved real-time operation and ranked among the top methods on the KITTI odometry benchmark for years, all without loop closure.

## Why it matters for SLAM

LOAM is to LiDAR SLAM what PTAM is to visual SLAM: the architectural template. LeGO-LOAM and LIO-SAM inherit its feature extraction and odometry/mapping split directly; FAST-LIO2 defines itself in opposition to it by dropping feature extraction entirely. If you read one classical LiDAR paper, read this one — the vocabulary of "edge features," "planar features," and "scan-to-map refinement" that pervades the field starts here.

## Related

- [LIO-SAM](lio-sam.md) — adds IMU preintegration, factor graph, GPS, and loop closure to the LOAM recipe
- [FAST-LIO2](fast-lio2.md) — the direct, feature-free counterpoint
- [SuMa](suma.md) — contemporary alternative built on surfels and range images
- [LiDAR](../level-02-getting-familiar/lidar.md) — sensor background

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
