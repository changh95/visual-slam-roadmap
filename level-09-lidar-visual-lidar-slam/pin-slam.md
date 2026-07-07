# PIN-SLAM

> Pan (Bonn) 2024 · [Paper](https://arxiv.org/abs/2401.09101)

**One-line summary** — PIN-SLAM replaces the explicit point-cloud map with a sparse set of optimizable neural points encoding a local implicit SDF, enabling correspondence-free registration and — crucially — a map that deforms elastically when loop closures correct the trajectory.

## Problem

Classical LiDAR maps — point clouds, voxel grids, surfels, TSDF volumes — are rigid: when a loop closure corrects accumulated drift, the already-built map cannot be smoothly re-shaped to match the corrected trajectory, so systems either rebuild it, use submaps, or live with duplicated structures. Neural implicit maps are compact and continuous, but earlier neural SLAM systems targeted room-scale RGB-D input and were far too slow for outdoor LiDAR rates (Nerf-LOAM: > 4 s per frame). PIN-SLAM brings implicit neural mapping to LiDAR scale while making global consistency a first-class property of the map itself.

## Method & architecture

Per frame: (1) deskew and voxel-downsample the scan into a registration cloud $\mathcal{P}_r$ and a mapping cloud $\mathcal{P}_m$; (2) register $\mathcal{P}_r$ to the local map's SDF; (3) update the map by incremental learning; (4) detect loops with a neural-point descriptor; (5) optimize the pose graph and deform the map.

- **Point-based implicit neural (PIN) map**: $\mathcal{M} = \{\mathbf{m}_i = (\mathbf{x}_i, \mathbf{q}_i, \mathbf{f}_i^{g}, t_i^{c}, t_i^{u}, \mu_i)\}$ — position, orientation quaternion, optimizable latent feature, creation/update timesteps, stability. The SDF at a query $\mathbf{p}$ is decoded per neighbor by a shallow shared MLP from the feature and the *relative* coordinate,

  $$s_j = D_{\theta}^{g}\left(\mathbf{f}_j^{g}, \mathbf{d}_j\right), \qquad \mathbf{d}_j = \mathbf{q}_j\left(\mathbf{p} - \mathbf{x}_j\right)\mathbf{q}_j^{-1},$$

  then interpolated over the $K$ nearest neural points with inverse-square distance weights $w_j = \lVert \mathbf{p} - \mathbf{x}_j \rVert^{-2}$: $S(\mathbf{p}) = \sum_j \frac{w_j}{\sum_k w_k} s_j$. Because $\mathbf{d}_j$ is expressed in each point's own frame, the prediction is invariant to rigid-body transformation of the points — the source of the map's elasticity. Voxel hashing (one active neural point per voxel) gives constant-time neighborhood search.
- **Incremental map training**: samples are drawn along each ray (surface-adjacent and free-space) with projective SDF targets, kept in a sliding training pool $\mathcal{D}_p$ to fight catastrophic forgetting. The loss is $\mathcal{L} = \mathcal{L}_{\text{bce}} + \lambda_e \mathcal{L}_{\text{eik}}$: a binary cross-entropy loss on sigmoid-mapped SDF values (a soft truncation) plus the Eikonal regularizer

  $$\mathcal{L}_{\text{eik}} = \frac{1}{N}\sum_{i=1}^{N} \left( \lVert \nabla S(\mathbf{u}_W^{i}) \rVert_2 - 1 \right)^2.$$

  The decoder is frozen after the first frames; only neural point features keep training.
- **Correspondence-free odometry**: the scan is aligned by driving all points onto the zero level set,

  $$\mathbf{T}^{*} = \underset{\mathbf{T}}{\operatorname{argmin}} \sum_{\mathbf{p} \in \mathcal{P}_r} S\left(\mathbf{T}\mathbf{p}\right)^2,$$

  solved with Levenberg–Marquardt using the analytical Jacobian $\mathbf{J}_i = [\,\mathbf{g}_i^{\top},\ (\mathbf{p}_i' \times \mathbf{g}_i)^{\top}\,]$ with $\mathbf{g}_i = \nabla S(\mathbf{p}_i')$ — no nearest-neighbor data association; the field supplies direction and magnitude. Geman–McClure robust kernels down-weight points by SDF residual and by gradient anomaly $\varepsilon_i = |\lVert \nabla S(\mathbf{p}_i') \rVert_2 - 1|$, and an eigenvalue check on the Hessian detects degeneracy. An implicit local bundle adjustment every $F_{\text{ba}}$ frames jointly refines recent poses and local features.
- **Dynamic filtering**: measured points predicted to lie in *stable free space* — $S(\mathbf{p}_W) > \gamma_d$ with stability $H(\mathbf{p}_W) > \gamma_\mu$ — are excluded from mapping.
- **Loop closure and elastic map correction**: global loops are detected with a polar-context descriptor that bins the local map's *neural point features* (Scan-Context-style, $\mathbf{U}_t \in \mathbb{R}^{H_r \times H_s \times F_g}$) — geometry encoding and place recognition share one learned representation. After pose graph optimization, every neural point moves with its associated frame:

  $$\mathbf{x}_i \leftarrow \delta\mathbf{T}_{t_i^{m}}\, \mathbf{x}_i, \qquad \mathbf{q}_i \leftarrow \delta\mathbf{q}_{t_i^{m}}\, \mathbf{q}_i,$$

  so the map deforms consistently with the corrected trajectory instead of tearing or ghosting.

## Results

- **KITTI odometry**: average relative translation error 0.51% (std 0.02% over 10 seeds) — on par with KISS-ICP and CT-ICP, better than all compared learning-based methods, with no pre-training.
- **KITTI SLAM**: ATE RMSE 1.0 m averaged on loop sequences (PIN odometry alone: 3.2 m) and 1.2 m over all 11 sequences — outperforming SC-LeGO-LOAM and SC-F-LOAM and even the offline HLBA post-processing baseline, while running online.
- **Other domains**: best overall accuracy on MulRan, IPB-Car, Newer College, and Hilti-21; on the Newer College stairs sequence it achieves 6 cm RMSE where half the compared methods fail. The RGB-D extension is competitive on Replica.
- **Map compactness**: the KITTI 00 map takes 102.1 MB — about 0.7% of the raw point cloud (13.6 GB) — vs 887.7 MB for SuMa's surfel map and 160.6 MB for the grid-based SHINE map; loop correction even *shrinks* the map ~20% by eliminating duplicated neural points.
- **Runtime**: the light version runs at ~11 Hz (sensor frame rate) on a single NVIDIA A4000 GPU with constant per-frame time; Nerf-LOAM, the only other implicit-neural LiDAR odometry, is about 30× slower. Code: `PRBonn/PIN_SLAM`.

## Why it matters for SLAM

Neural implicit SLAM (iMAP, NICE-SLAM) began as a slow, room-scale RGB-D affair; PIN-SLAM is the demonstration that implicit maps scale to outdoor LiDAR SLAM with global consistency — the first system to make the neural map itself loop-closure-aware through elastic deformation. It marks the credible entry of learned map representations into the LiDAR domain that FAST-LIO2 and LOAM dominated with classical structures, and it points toward maps that are simultaneously compact, dense-reconstructable, and globally consistent.

## Hands-on

- [Run PIN-SLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/pin_slam)

## Related

- [FAST-LIO2](fast-lio2.md) — classical direct registration baseline it competes with
- [SuMa](suma.md) — earlier dense (surfel) LiDAR map representation
- [iMAP](../level-05-deep-learning/imap.md) — origin of neural implicit SLAM
- [NICE-SLAM](../level-05-deep-learning/nice-slam.md) — hierarchical neural implicit RGB-D SLAM predecessor
- [Point-SLAM](../level-05-deep-learning/point-slam.md) — neural point representation for RGB-D SLAM
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the global adjustment that the elastic map absorbs
