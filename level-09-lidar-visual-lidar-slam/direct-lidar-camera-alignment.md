# Direct LiDAR-camera alignment

**Direct** methods align sensor data to the map without first extracting sparse features. Applied to LiDAR-camera fusion, this means two things happening on the same map:

- **Direct LiDAR registration**: raw scan points are registered against the map with point-to-plane (or point-to-implicit) residuals — no edge/planar feature extraction as in LOAM. FAST-LIO2 showed this is both faster and more accurate, and it adapts automatically to any scanning pattern (spinning or solid-state LiDAR).
- **Direct visual alignment**: instead of detecting and matching corners (ORB, FAST), the camera pose is estimated by minimizing **photometric error** between the current image and appearance stored in the map.

## The core residual

In FAST-LIVO, each LiDAR map point $\mathbf{p}_i$ carries a small image patch $P_i$ from when it was first seen; a new frame is aligned by minimizing

$$
r_i = \sum_{\mathbf{u} \in \Omega} \Big( I_{\text{cur}}\big(\pi(\mathbf{T}\,\mathbf{p}_i) + \mathbf{u}\big) - P_i(\mathbf{u}) \Big)^2
$$

over the patch neighborhood $\Omega$ (e.g., a few pixels on each side). Because LiDAR supplies accurate 3D positions for these anchor points, the visual module gets a dense pool of well-localized landmarks for free — no triangulation, no depth ambiguity. R3LIVE uses the same principle in its leanest form: map points store a color $C_i$, and the VIO minimizes $\sum_i (I(\pi(\mathbf{T}^{-1}\mathbf{P}_i)) - C_i)^2$ to align the frame and then refine the map's texture.

## How it enters the estimator

Two patterns exist for feeding these residuals into a tightly-coupled filter:

- **Stacked update** (FAST-LIVO): LiDAR point-to-plane Jacobians and visual photometric Jacobians are concatenated, $\mathbf{H} = [\mathbf{H}^{\text{LiDAR}}; \mathbf{H}^{\text{Visual}}]$, and applied in one iterated Kalman update.
- **Sequential update** (FAST-LIVO2): within the same ESIKF iteration, the LiDAR update is applied first and the visual update runs on the intermediate state — $\hat{\mathbf{x}}_1 = \hat{\mathbf{x}}_0 \oplus \mathbf{K}_L \mathbf{r}_L(\hat{\mathbf{x}}_0)$, then $\hat{\mathbf{x}}_2 = \hat{\mathbf{x}}_1 \oplus \mathbf{K}_V \mathbf{r}_V(\hat{\mathbf{x}}_1)$ — which sidesteps the dimension mismatch between thousands of LiDAR residuals and image measurements.

Keeping the alignment honest also requires housekeeping on the appearance side: reference patches are updated as new views arrive (FAST-LIVO2 does this dynamically; R3LIVE blends colors over time), unstable points lying on depth edges or occluded in the current view are rejected (FAST-LIVO's outlier mechanism), and LiDAR plane priors can constrain the patch alignment itself (FAST-LIVO2).

## Why go direct?

The appeal is threefold. First, **latency**: skipping feature extraction and descriptor matching removes a substantial per-frame cost. Second, **robustness in low-texture scenes**: photometric alignment can exploit weak gradients where corner detectors find nothing. Third, **architectural simplicity**: one shared map (an ikd-Tree or voxel map) serves both modalities, instead of separate visual and LiDAR maps that must be kept consistent.

## Common pitfalls

- **Small convergence basin.** Photometric error is highly non-convex; alignment succeeds only near the true pose. Direct LVI systems get away with it because IMU propagation and LiDAR registration hand the visual module an excellent initial guess — remove that prior and the method falls apart.
- **Brightness constancy is a lie.** Auto-exposure, vignetting, and the camera's non-linear response make the same surface change intensity between frames. This is why FAST-LIVO2 estimates exposure time online and why R3LIVE++ calibrates the response function and vignetting to reconstruct radiance rather than raw RGB.
- **Edge and occlusion points.** A patch anchored on a depth discontinuity mixes foreground and background appearance; such points must be filtered or they systematically bias the alignment.
- **Stale appearance.** Patches captured long ago under different lighting slowly poison the residuals unless reference patches are refreshed — but refreshing too eagerly lets drift leak into the map's appearance.

## Why it matters for SLAM

Direct LiDAR-camera alignment is the design behind the currently strongest open-source LVI odometry systems (FAST-LIVO, FAST-LIVO2) and the RGB-mapping R3LIVE line. It represents the LiDAR-era continuation of the direct visual odometry tradition (DTAM, LSD-SLAM, DSO): once depth is no longer the bottleneck — LiDAR measures it — photometric alignment becomes an extremely cheap and effective way to add visual information to a state estimator.

## Related

- [FAST-LIVO](fast-livo.md) — patches on LiDAR map points, joint direct alignment
- [FAST-LIVO2](fast-livo2.md) — sequential-update ESIKF refinement of the idea
- [FAST-LIO2](fast-lio2.md) — the direct LiDAR registration foundation
- [R3LIVE](r3live.md) — frame-to-map photometric error for map texturing
- [R3LIVE++](r3livepp.md) — photometric calibration that makes direct alignment physically consistent
- [DSO](../level-03-monocular-slam/dso.md) — the direct/photometric tradition in visual SLAM

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
