# LOAM

> Zhang 2014 · [Paper](https://www.ri.cmu.edu/pub_files/2014/7/Ji_LidarMapping_RSS2014_v8.pdf)

**One-line summary** — LOAM established the foundational LiDAR SLAM recipe — extract edge and planar features, then split estimation into high-frequency scan-to-scan odometry and low-frequency scan-to-map refinement — that virtually every later LiDAR system builds on or reacts against.

## Problem

LiDAR SLAM faces two competing requirements: real-time operation demands fast processing, but accuracy demands registering each sweep against a large, consistent global map — while also undoing the motion distortion a moving scanner imprints on every sweep. Naive scan-to-map matching is too slow for real time; pure frame-to-frame odometry drifts. LOAM (RSS 2014) resolves the tension by dividing the problem between two cooperating algorithms running in parallel at different frequencies: coarse, fast odometry and fine, slow mapping.

## Method & architecture

**Feature extraction.** Points in each scan are scored by a local-surface smoothness term over their set $S$ of same-scan neighbors,

$$c = \frac{1}{|S| \cdot \big\| X^{L}_{(k,i)} \big\|} \, \Big\| \sum_{j \in S,\, j \neq i} \big( X^{L}_{(k,i)} - X^{L}_{(k,j)} \big) \Big\|,$$

where $X^{L}_{(k,i)}$ is point $i$ of sweep $k$ in the LiDAR frame $L$. Maximum-$c$ points become *edge points*, minimum-$c$ points *planar points*; each scan is split into four subregions providing at most 2 edge and 4 planar points, and points on beam-parallel surfaces or occlusion boundaries are excluded as unreliable.

**LiDAR odometry (~10 Hz).** The previous sweep's cloud, reprojected to the sweep boundary, is stored in a KD-tree. Each new edge point is matched to the line through its two nearest edge points $j, l$ (from different scans), and each planar point to the plane through three points $j, l, m$. The residuals are the point-to-line and point-to-plane distances

$$d_{\mathcal{E}} = \frac{\big| (\tilde{X}^{L}_{(k+1,i)} - \bar{X}^{L}_{(k,j)}) \times (\tilde{X}^{L}_{(k+1,i)} - \bar{X}^{L}_{(k,l)}) \big|}{\big| \bar{X}^{L}_{(k,j)} - \bar{X}^{L}_{(k,l)} \big|}, \qquad d_{\mathcal{H}} = \frac{\big| (\tilde{X}^{L}_{(k+1,i)} - \bar{X}^{L}_{(k,j)}) \cdot \big( (\bar{X}^{L}_{(k,j)} - \bar{X}^{L}_{(k,l)}) \times (\bar{X}^{L}_{(k,j)} - \bar{X}^{L}_{(k,m)}) \big) \big|}{\big| (\bar{X}^{L}_{(k,j)} - \bar{X}^{L}_{(k,l)}) \times (\bar{X}^{L}_{(k,j)} - \bar{X}^{L}_{(k,m)}) \big|}.$$

Motion within a sweep is modeled with constant angular/linear velocity, so the pose of each point at its own timestamp $t_i$ is linearly interpolated from the sweep transform $T^{L}_{k+1} = [t_x, t_y, t_z, \theta_x, \theta_y, \theta_z]^{\top}$:

$$T^{L}_{(k+1,i)} = \frac{t_i - t_{k+1}}{t - t_{k+1}} \, T^{L}_{k+1},$$

which simultaneously de-skews the cloud. Stacking a residual row per feature into $f(T^{L}_{k+1}) = d$, the pose is solved by robust Levenberg–Marquardt with bisquare weights (large-residual features are down-weighted, beyond a threshold zeroed):

$$T^{L}_{k+1} \leftarrow T^{L}_{k+1} - \big( J^{\top} J + \lambda \, \mathrm{diag}(J^{\top} J) \big)^{-1} J^{\top} d.$$

**LiDAR mapping (1 Hz).** Once per sweep, the undistorted cloud is registered to the accumulated map using 10x more feature points. The map is stored in 10 m cubes; correspondences come from the eigen-decomposition of the covariance matrix of each feature's map neighborhood (one dominant eigenvalue = edge line, two = planar patch, with the associated eigenvectors giving the direction), the same distance residuals are minimized, and the map is downsampled with a 5 cm voxel grid. The final pose output fuses the mapping pose $T^{W}_{k}$ with the odometry motion $T^{L}_{k+1}$ at the odometry's 10 Hz rate. There is no loop closure by design.

## Results

- **KITTI odometry benchmark** (39.2 km over urban/country/highway, Velodyne HDL-64E at 10 Hz): average position error of **0.88%** of distance traveled (100–800 m segments, 3D), **ranked #1 among all methods irrespective of sensing modality** at publication, ahead of state-of-the-art stereo visual odometry.
- **Own hardware** (custom 2-axis unit: Hokuyo UTM-30LX, 180° FoV, 0.25° resolution, 40 lines/sec): closed-loop drift of 0.9%/1.1% over 58/46 m in an indoor corridor and 2.3%/2.8% over 52/67 m in an orchard — roughly 1% relative accuracy indoors and 2.5% outdoors at 0.5 m/s.
- **Compute:** runs in real time on a 2.5 GHz quad-core laptop, odometry and mapping consuming one core each.
- **IMU assistance** (Xsens MTi-10): using IMU orientation/acceleration only to pre-undistort the cloud (not in the optimization) gives the highest accuracy under aggressive hand-carried motion — the IMU cancels nonlinear motion while LOAM handles the linear part.

## Why it matters for SLAM

LOAM is to LiDAR SLAM what PTAM is to visual SLAM: the architectural template. LeGO-LOAM and LIO-SAM inherit its curvature-based edge/planar feature extraction and odometry/mapping split directly; FAST-LIO2 defines itself in opposition to it by dropping feature extraction entirely. Motion de-skewing became a required preprocessing step for every subsequent spinning-LiDAR pipeline, and LOAM held a top KITTI rank for years while remaining the standard baseline. If you read one classical LiDAR paper, read this one — the vocabulary of "edge features," "planar features," and "scan-to-map refinement" that pervades the field starts here.

## Related

- [LIO-SAM](lio-sam.md) — adds IMU preintegration, factor graph, GPS, and loop closure to the LOAM recipe
- [FAST-LIO2](fast-lio2.md) — the direct, feature-free counterpoint
- [SuMa](suma.md) — contemporary alternative built on surfels and range images
- [LiDAR](../level-02-getting-familiar/lidar.md) — sensor background
- [ICP](../level-04-rgbd-slam/icp.md) — the classical registration algorithm LOAM's residuals refine
