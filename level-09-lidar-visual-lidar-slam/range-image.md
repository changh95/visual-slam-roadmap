# Range image

A **range image** is a 2D projection of a 3D LiDAR sweep. For a spinning LiDAR, the natural projection is cylindrical: each column corresponds to an azimuth angle and each row to a laser ring (elevation), and each pixel stores the measured depth — often alongside intensity and the ring index. A point with azimuth $\phi$ and elevation $\theta$ maps to

$$
(u, v) = \left( \left\lfloor \frac{\phi}{2\pi} W \right\rfloor,\; \left\lfloor \frac{\theta - \theta_{\min}}{\theta_{\max} - \theta_{\min}} H \right\rfloor \right)
$$

for a $W \times H$ image. This works because a spinning LiDAR *is* effectively a rotating 1D sensor array — the range image simply recovers the sensor's native 2D structure that gets flattened into an unordered point list. Concretely, a 64-beam sensor gives $H = 64$ rows, and the horizontal resolution follows from the azimuth step (an angular step of $0.2°$ would give $W = 360/0.2 = 1800$ columns).

## Why the representation is so useful

- **Cheap neighborhoods**: a point's neighbors sit in adjacent pixels, so normals and local curvature can be estimated from neighboring pixels without any 3D nearest-neighbor search.
- **Projective data association**: SuMa renders its surfel map into a *synthetic* range image $\hat{\mathcal{R}}$ from the current pose estimate; the scan point at pixel $(u,v)$ is matched to the rendered surfel at the same pixel, and the pose is refined with a point-to-plane objective

  $$\mathbf{T}^* = \arg\min_{\mathbf{T}} \sum_k \big(\mathbf{n}_k^\top (\mathbf{T}\mathbf{p}_k - \hat{\mathbf{p}}_k)\big)^2 .$$

  Pixel-to-pixel lookup replaces k-d tree search — dramatically faster, and GPU-friendly since rendering *is* the association step.
- **2D deep learning on LiDAR**: RangeNet++ runs an encoder-decoder CNN on range images for real-time semantic segmentation. SuMa++ uses those per-pixel labels to filter dynamic objects out of registration — points labeled car, person, or bicycle are simply excluded from the ICP correspondence set, $\mathcal{P}_{\text{ICP}} = \{p_k \mid \text{label}(p_k) \notin \mathcal{C}_{\text{dynamic}}\}$ — and to weight correspondences whose labels agree.
- **Compactness**: a full sweep becomes a dense image, convenient for compression, visibility checks, and occlusion reasoning — rendering the map from a pose immediately tells you what *should* be visible from there.

## Common pitfalls

- **Quantization collisions**: multiple 3D points can land in one pixel (keep the nearest), and angular resolution means the same pixel covers a growing physical area with range — neighborhood-based normals get noisy far from the sensor.
- **Row geometry is hardware, not math**: real spinning LiDARs have non-uniformly spaced beam elevations, so indexing rows by the sensor's ring index is more faithful than the linear-in-$\theta$ formula above.
- **One viewpoint per sweep**: the projection assumes all points were captured from a single pose; motion during the sweep must be compensated (de-skewing) before projection, or the image is smeared.
- **Solid-state LiDARs break the model**: irregular, non-repeating scan patterns (e.g., Livox-style) do not map cleanly onto an image grid — one reason the direct point-cloud methods (FAST-LIO2 lineage) took over as those sensors spread.

## Why it matters for SLAM

The range image is the bridge between LiDAR processing and the mature toolbox of image processing and CNNs. An entire branch of LiDAR SLAM — SuMa's projective ICP, SuMa++'s semantic filtering, learned descriptors and loop-closure networks operating on range views — depends on it. Knowing when a method operates on raw point clouds (LOAM, FAST-LIO2) versus range images (SuMa family) tells you a lot about its speed profile, hardware requirements, and sensor assumptions.

## Related

- [SuMa](suma.md) — surfel SLAM built on projective ICP over range images
- [SuMa++](sumapp.md) — semantic segmentation of range images for dynamic filtering
- [LiDAR](../level-02-getting-familiar/lidar.md) — sensor fundamentals
- [ICP](../level-04-rgbd-slam/icp.md) — the registration algorithm that projective lookup accelerates
- [LOAM](loam.md) — the contrasting branch that works on the raw point list
