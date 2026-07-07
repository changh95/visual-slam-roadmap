# SuMa

> Behley (Bonn) 2018 · [Paper](http://www.roboticsproceedings.org/rss14/p16.pdf)

**One-line summary** — SuMa (Surfel-based Mapping) performs real-time LiDAR SLAM by maintaining the environment as a surfel map and tracking each new scan with projective frame-to-model ICP on rendered range-image views, showing that dense-map LiDAR SLAM with online loop closure works at urban scale without hand-crafted feature extraction.

## Problem

Laser-based mapping systems mostly reduce the 3D point cloud before alignment — features (LOAM), subsampled clouds, voxel grids, or NDT maps — while dense frame-to-model approaches from RGB-D SLAM (KinectFusion, ElasticFusion) use all available information. Bringing the dense paradigm to rotating outdoor LiDAR means coping with (1) fast sensor motion causing large displacements between scans, (2) comparably sparse point clouds, and (3) large-scale environments — all in real time, with loop closures integrated online rather than as an offline afterthought.

## Method & architecture

The pipeline runs seven steps per scan: preprocessing, model rendering, frame-to-model ICP, map update, loop-closure detection, loop-closure verification, and pose-graph optimization (in a separate thread).

- **Preprocessing to vertex/normal maps**: each point cloud $\mathcal{P}$ is projected via $\Pi:\mathbb{R}^3 \mapsto \mathbb{R}^2$ into a vertex map $\mathcal{V}_D$ (900×64 for KITTI's HDL-64E) using spherical coordinates,

  $$u = \tfrac{1}{2}\left(1 - \arctan(y, x)\,\pi^{-1}\right) w, \qquad v = \left(1 - \left(\arcsin(z\, r^{-1}) + f_{\mathrm{up}}\right) f^{-1}\right) h,$$

  where $r = \lVert \mathbf{p} \rVert_2$ and $f = f_{\mathrm{up}} + f_{\mathrm{down}}$ is the vertical field of view. A normal map $\mathcal{N}_D$ is computed by cross products over forward differences of neighboring vertices.
- **Projective frame-to-model ICP**: the active surfel map is rendered at the last pose into model maps $\mathcal{V}_M, \mathcal{N}_M$; correspondences come from pixel lookup instead of nearest-neighbor search. The point-to-plane error

  $$E(\mathcal{V}_D, \mathcal{V}_M, \mathcal{N}_M) = \sum_{\mathbf{u} \in \mathcal{V}_D} \left( \mathbf{n}_u^{\top}\left( \mathbf{T}^{(k)}_{C_{t-1}C_t}\, \mathbf{u} - \mathbf{v}_u \right) \right)^2$$

  is minimized by Gauss–Newton with $\mathfrak{se}(3)$ increments $\delta = (\mathbf{J}^{\top}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{\top}\mathbf{W}\mathbf{r}$, Huber weighting, and outlier rejection (distance > 2 m or normal angle > 30°).
- **Surfel map with stability filtering**: each surfel carries position $\mathbf{v}_s$, normal $\mathbf{n}_s$, radius $r_s$, creation/update timestamps, and a stability log-odds ratio maintained by a binary Bayes filter,

  $$l_s^{(t)} = l_s^{(t-1)} + \mathrm{odds}\left(p_{\text{stable}} \cdot e^{-\alpha^2/\sigma_\alpha^2}\, e^{-d^2/\sigma_d^2}\right) - \mathrm{odds}(p_{\text{prior}}),$$

  where $\alpha$ is the angle and $d$ the distance between measurement and surfel. Only stable surfels are rendered; compatible measurements refine surfels by exponential moving average ($\gamma = 0.9$); unstable old surfels (dynamics, clutter) are removed.
- **Map deformation via poses**: surfel coordinates live in the frame of their creation pose, so after pose-graph optimization the map is corrected by simply updating poses — no re-integration of past scans.
- **Map-based loop closure**: the map is split into active ($t_u \geq t - \Delta_{\text{active}}$, with $\Delta_{\text{active}} = 100$) and inactive parts; odometry uses only the former, loop search only the latter. The nearest inactive pose within 50 m is tried with multiple ICP initializations, and a candidate is accepted only if the residual against a *composed virtual view* of map plus scan satisfies $E_{\text{map}} < \kappa_{\text{residual}} \cdot E_{\text{odom}}$ (with $\kappa_{\text{residual}} = 1.15$), then verified over 5 subsequent scans before a constraint enters the gtsam pose graph.

## Results

- KITTI odometry training set (relative rotational error in deg/100 m / translational error in %): frame-to-frame ICP 0.9/2.9; frame-to-model 0.3/0.7; frame-to-model with loop closure 0.3/0.8 — versus LOAM −/0.8, Stereo LSD-SLAM 0.3/0.9, SOFT-SLAM 0.2/0.7. Loop closures barely change the KITTI relative metrics but visibly improve global trajectory consistency.
- KITTI test set: 0.0032 deg/m rotational and 1.4% translational error (LOAM: 0.0017 deg/m, 0.7%).
- Runtime on an i7-6700 + GTX 960 (4 GB): odometry + map update take 31 ms on average (max 71 ms); with loop-closure detection and verification at most 189 ms; 48 ms per scan overall — about 20 Hz, twice the sensor rate.
- Reported failure modes: highways with few structured objects, and consistently moving traffic (e.g. traffic jams) that gets wrongly integrated as surfels — precisely the gap SuMa++ later addressed with semantics.

## Why it matters for SLAM

SuMa brought the surfel-based dense mapping idea pioneered for short-range RGB-D sensors (ElasticFusion) to outdoor spinning LiDAR, handling far larger ranges and non-uniform point densities. It established GPU-rendered range images plus projective ICP as a standard LiDAR tracking mechanism, offering a dense-map alternative to feature-based pipelines like LOAM, and its map-based loop-closure criterion showed how to verify loops with low scan overlap. Its range-image pipeline directly enabled the semantic extension SuMa++ and later learned processing of LiDAR range images.

## Related

- [SuMa++](sumapp.md)
- [LOAM](loam.md)
- [Range image](range-image.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
