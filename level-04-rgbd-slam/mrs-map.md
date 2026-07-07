# MRS-Map

> Stückler 2014 · [Paper](https://doi.org/10.1016/j.jvcir.2013.02.008)

**One-line summary** — An octree-based multi-resolution surfel map for RGB-D SLAM that stores joint shape and color statistics per surfel, enabling noise-aware probabilistic registration, key-view pose-graph SLAM, and real-time object tracking on a CPU.

## Problem

Dense RGB-D mapping at a single fixed resolution faces an unavoidable trade-off: fine resolution captures detail but wastes memory, coarse resolution loses fidelity. RGB-D sensor noise also grows quadratically with depth, so treating all measurements at one resolution is statistically wrong. GPU-bound systems like KinectFusion further exclude light-weight or low-cost robot platforms. What is needed is a compact representation that adapts detail to measurement quality and supports fast, robust registration of images, maps, and multi-view object models — entirely on a CPU.

## Method & architecture

- **Multi-resolution surfels in an octree**: every octree node (inner and leaf, across all voxel sizes) stores a *surfel* — a normal approximation of the points $\mathcal{P}$ inside its volume. Statistics are maintained as sufficient statistics $\mathcal{S}(\mathcal{P}) := \sum_{p\in\mathcal{P}} p$ and $\mathcal{S}^2(\mathcal{P}) := \sum_{p\in\mathcal{P}} p p^T$, merged between point sets $\mathcal{P}^A, \mathcal{P}^B$ by the numerically stable one-pass update

$$\mathcal{S}^2(\mathcal{P}^{A\cup B}) \leftarrow \mathcal{S}^2(\mathcal{P}^A) + \mathcal{S}^2(\mathcal{P}^B) + \frac{\delta\delta^T}{N_A N_B (N_A + N_B)}, \qquad \delta := N_B\,\mathcal{S}(\mathcal{P}^A) - N_A\,\mathcal{S}(\mathcal{P}^B),$$

  from which mean $\mu = \frac{1}{\lvert\mathcal{P}\rvert}\mathcal{S}$ and covariance $\Sigma = \frac{1}{\lvert\mathcal{P}\rvert-1}\mathcal{S}^2 - \mu\mu^T$ follow. The distribution is 6D — position jointly with color in an L$\alpha\beta$ space that separates luminance from chrominance. Up to six orthogonal view directions keep distinct surfaces in one voxel apart; surfels need at least 10 points.
- **Noise-adaptive aggregation**: the maximum octree resolution at each pixel is adapted to the *squared* distance from the sensor (matching the sensor noise law), and contiguous image regions falling into the same node are aggregated first — a 640×480 image is absorbed with only several thousand node insertions instead of 307,200 point insertions. Nodes at image borders or occlusion borders (virtual borders) are excluded, since they only partially observe the surface.
- **Shape-texture descriptors**: FPFH-like three-bin angular histograms between each surfel and its up-to-26 same-resolution neighbors, plus luminance/chrominance contrast histograms, are used to gate associations by thresholding the descriptor distance $d_f(s_i,s_j) \le \tau$ with $\tau=0.1$.
- **Probabilistic registration**: to register a source map $m_s$ (e.g. the current image) to a target map $m_m$ under pose $x$, surfels are associated across all resolutions concurrently — implicitly coarse-to-fine, since the finest common resolution is chosen per node via a cube query — and the observation likelihood of each association is the difference of the two normal distributions:

$$p(s_{s,i} \mid x, s_{m,j}) = \mathcal{N}\big(d_{i,j}(x);\, 0,\, \Sigma_{i,j}(x)\big), \quad d_{i,j}(x) := \mu_{m,j} - T(x)\,\mu_{s,i}, \quad \Sigma_{i,j}(x) := \Sigma_{m,j} + R(x)\,\Sigma_{s,i}\,R(x)^T,$$

  so the covariances learned from data automatically weight reliable geometry — no keypoint extraction. The log-likelihood $L(x) = \sum_{a\in\mathcal{A}} \log\lvert\Sigma_a(x)\rvert + d_a^T(x)\,\Sigma_a^{-1}(x)\,d_a(x)$ is optimized by fast approximate Levenberg-Marquardt (typically 10-20 iterations) followed by ~5 Newton iterations with trilinear interpolation of model surfels; evaluation is parallelized over CPU cores. A closed-form estimate of the pose covariance captures uncertainty along unobservable dimensions (e.g. viewing a planar surface).
- **Key-view SLAM with randomized loop closing**: images are tracked against a reference key view; a new key view is spawned after sufficient motion, adding a spatial constraint edge. Each frame, exactly one additional constraint is tested by sampling a comparison key view according to $p_{\mathrm{chk}}(v_{\mathrm{cmp}}) = \mathcal{N}(d;0,\sigma_d^2)\cdot\mathcal{N}(\lvert\alpha\rvert;0,\sigma_\alpha^2)$ over pose distance, validating the match by a bidirectional surfel matching likelihood. The key-view graph $p(\mathcal{V}\mid\mathcal{E}) \propto \prod_{e_{ij}} p(x_i^j \mid x_i, x_j)$ is optimized once per frame with g2o (sparse Cholesky). Optimized key views are finally fused into one multi-view surfel map, which can also serve as an object model for real-time 6-DoF pose tracking.

## Results

All timings on a notebook Intel Core i7-3610QM (2.3 GHz quad-core) at full 640×480 resolution, maximum map resolution 0.0125 m. **Incremental registration** (TUM RGB-D benchmark, median translational RPE): 4.4 mm on fr1/desk vs warp 5.8, GICP 10.2, 3D-NDT 7.9, fovis 6.3; best on most fr1 sequences (e.g. fr1/plant 3.5 mm, fr1/xyz 2.6 mm, fr2/xyz 1.4 mm). Average runtime 75.15 ms on fr1/desk vs warp 108.64, GICP 4015.4, 3D-NDT 414.87 — about 15 Hz, and it retains ICP-like robustness for skipped frames where warp diverges. **SLAM**: better RMSE RPE than RGB-D SLAM on eight of eleven sequences when all frames are processed, e.g. freiburg1_room 0.111 m vs 0.219 m, freiburg2_desk 0.100 m vs 0.143 m, freiburg1_teddy 0.066 m vs 0.138 m; failures on freiburg1_floor (texture-poor floor) and freiburg2_large_loop (far, uncertain depth). One graph-optimization iteration takes up to a few ms (freiburg2_desk: median 0.79 ms at max 64 key views, 138 edges). **Object modeling/tracking**: median ATE about 1-2 cm for 360° model building; tracking of learned models with median ATE 16-30 mm at 32-50 ms per frame; demonstrated live at RoboCup@Home 2011/2012 (both won) on the robot Cosero.

## Why it matters for SLAM

MRS-Map showed that statistical surfel representations — rather than dense voxel grids — support accurate RGB-D tracking with modest memory and no GPU, making dense-ish SLAM and object tracking feasible on real robot hardware. Its uncertainty-aware surfel registration (an RGB-D descendant of NDT) and multi-resolution octree design influenced later surfel-based systems such as ElasticFusion and surfel-based LiDAR mapping, and it was a standard comparison baseline for dense RGB-D SLAM systems (DVO-SLAM, ElasticFusion) through the mid-2010s.

## Related

- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [KinectFusion](kinectfusion.md)
- [DVO](dvo.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [SuMa](../level-09-lidar-visual-lidar-slam/suma.md)
