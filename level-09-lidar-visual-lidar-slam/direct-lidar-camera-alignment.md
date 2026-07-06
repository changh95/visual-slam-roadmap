# Direct LiDAR-camera alignment

**Direct** methods align sensor data to the map without first extracting sparse features. Applied to LiDAR-camera fusion, this means two things happening on the same map:

- **Direct LiDAR registration**: raw scan points are registered against the map with point-to-plane (or point-to-implicit) residuals — no edge/planar feature extraction as in LOAM. FAST-LIO2 showed this is both faster and more accurate, and it adapts automatically to any scanning pattern (spinning or solid-state LiDAR).
- **Direct visual alignment**: instead of detecting and matching corners (ORB, FAST), the camera pose is estimated by minimizing **photometric error** between the current image and appearance stored in the map. In FAST-LIVO, each LiDAR map point carries a small image patch $P_i$ from when it was first seen; a new frame is aligned by minimizing

$$
r_i = \sum_{\mathbf{u} \in \Omega} \Big( I_{\text{cur}}\big(\pi(\mathbf{T}\,\mathbf{p}_i) + \mathbf{u}\big) - P_i(\mathbf{u}) \Big)^2
$$

over the patch neighborhood $\Omega$. Because LiDAR supplies accurate 3D positions for these anchor points, the visual module gets a dense pool of well-localized landmarks for free — no triangulation, no depth ambiguity.

The appeal is threefold. First, **latency**: skipping feature extraction and descriptor matching removes a substantial per-frame cost. Second, **robustness in low-texture scenes**: photometric alignment can exploit weak gradients where corner detectors find nothing. Third, **architectural simplicity**: one shared map (an ikd-Tree or voxel map) serves both modalities, instead of separate visual and LiDAR maps that must be kept consistent.

The caveats are the classic ones of direct methods: photometric alignment needs a good initial pose (provided here by IMU propagation and LiDAR registration), and it is sensitive to exposure and illumination changes — which is why FAST-LIVO2 estimates camera exposure time online and updates reference patches dynamically, and why R3LIVE++ models the camera's photometric calibration (response function, vignetting).

## Why it matters for SLAM

Direct LiDAR-camera alignment is the design behind the currently strongest open-source LVI odometry systems (FAST-LIVO, FAST-LIVO2) and the RGB-mapping R3LIVE line. It represents the LiDAR-era continuation of the direct visual odometry tradition (DTAM, LSD-SLAM, DSO): once depth is no longer the bottleneck — LiDAR measures it — photometric alignment becomes an extremely cheap and effective way to add visual information to a state estimator.

## Related

- [FAST-LIVO](fast-livo.md) — patches on LiDAR map points, joint direct alignment
- [FAST-LIVO2](fast-livo2.md) — sequential-update ESIKF refinement of the idea
- [FAST-LIO2](fast-lio2.md) — the direct LiDAR registration foundation
- [R3LIVE](r3live.md) — frame-to-map photometric error for map texturing
- [DSO](../level-03-monocular-slam/dso.md) — the direct/photometric tradition in visual SLAM

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
