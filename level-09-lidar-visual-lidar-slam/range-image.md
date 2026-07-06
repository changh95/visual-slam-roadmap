# Range image

A **range image** is a 2D projection of a 3D LiDAR sweep. For a spinning LiDAR, the natural projection is cylindrical: each column corresponds to an azimuth angle and each row to a laser ring (elevation), and each pixel stores the measured depth — often alongside intensity and the ring index. A point with azimuth $\phi$ and elevation $\theta$ maps to

$$
(u, v) = \left( \left\lfloor \frac{\phi}{2\pi} W \right\rfloor,\; \left\lfloor \frac{\theta - \theta_{\min}}{\theta_{\max} - \theta_{\min}} H \right\rfloor \right)
$$

for a $W \times H$ image. This works because a spinning LiDAR *is* effectively a rotating 1D sensor array — the range image simply recovers the sensor's native 2D structure that gets flattened into an unordered point list.

Why is this representation so useful?

- **Cheap neighborhoods**: a point's neighbors sit in adjacent pixels, so normals and local curvature can be estimated without any 3D nearest-neighbor search.
- **Projective data association**: SuMa renders its surfel map into a synthetic range image from the current pose estimate and finds ICP correspondences by pixel-to-pixel lookup — dramatically faster than k-d tree search, and GPU-friendly.
- **2D deep learning on LiDAR**: RangeNet++ runs an encoder-decoder CNN on range images for real-time semantic segmentation, which SuMa++ then uses to filter dynamic objects (cars, pedestrians) out of registration.
- **Compactness**: a full sweep becomes a dense image, convenient for compression, visibility checks, and occlusion reasoning.

The main caveats: the projection discretizes (multiple points can fall into one pixel, and resolution varies with range), it assumes a single viewpoint per sweep (motion during the sweep must be compensated), and solid-state LiDARs with irregular scan patterns do not map as cleanly onto an image grid.

## Why it matters for SLAM

The range image is the bridge between LiDAR processing and the mature toolbox of image processing and CNNs. An entire branch of LiDAR SLAM — SuMa's projective ICP, SuMa++'s semantic filtering, learned descriptors and loop-closure networks operating on range views — depends on it. Knowing when a method operates on raw point clouds (LOAM, FAST-LIO2) versus range images (SuMa family) tells you a lot about its speed profile, hardware requirements, and sensor assumptions.

## Related

- [SuMa](suma.md) — surfel SLAM built on projective ICP over range images
- [SuMa++](sumapp.md) — semantic segmentation of range images for dynamic filtering
- [LiDAR](../level-02-getting-familiar/lidar.md) — sensor fundamentals
- [ICP](../level-04-rgbd-slam/icp.md) — the registration algorithm that projective lookup accelerates

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
