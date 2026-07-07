# MRS-Map

> Stückler 2014 · [Paper](https://doi.org/10.1016/j.jvcir.2013.02.008)

**One-line summary** — An octree-based multi-resolution surfel map for RGB-D SLAM that stores shape and color statistics per surfel, enabling noise-aware registration and real-time dense tracking on a CPU.

## Problem

Dense RGB-D maps at a single fixed resolution face an unavoidable trade-off: fine resolution captures detail but consumes excessive memory for large scenes, while coarse resolution loses geometric fidelity. Moreover, RGB-D sensor noise grows with distance, so treating all measurements at one resolution is statistically wrong. A multi-resolution representation can allocate detail where it is warranted — near well-observed surfaces — and coarser statistics elsewhere, while staying light enough to run without a GPU.

## Key ideas

- **Multi-resolution surfels in an octree**: each octree node holds a surfel with aggregated statistics — mean position, normal, color mean, and a full covariance matrix — with deeper levels providing finer resolution where the scene has detail:
  $$\boldsymbol{\mu}_k = \frac{1}{N_k}\sum_{i} \mathbf{p}_i, \quad \boldsymbol{\Sigma}_k = \frac{1}{N_k}\sum_{i} (\mathbf{p}_i - \boldsymbol{\mu}_k)(\mathbf{p}_i - \boldsymbol{\mu}_k)^\top$$
  Storing distributions rather than raw points makes the map both compact and uncertainty-aware.
- **Noise-aware registration without features**: frame-to-model alignment proceeds coarse-to-fine across octree levels; at each level, surfel-to-surfel correspondences are established and the rigid transform is estimated by minimizing a combined shape and color distance,
  $$E = \sum_{(i,j)} \left[ w_g\,d_{\text{shape}}(\mathbf{s}_i, \mathbf{s}_j) + w_c\,d_{\text{color}}(\mathbf{s}_i, \mathbf{s}_j) \right],$$
  where $d_{\text{shape}}$ is a Mahalanobis distance between surfel distributions — so the covariances learned from the data automatically weight reliable geometry more heavily. No explicit keypoint extraction is required.
- **Adaptive resolution = bounded memory**: new observations are merged into surfel statistics at the appropriate octree level; detail is allocated only near well-observed surfaces and sparsely observed nodes are pruned, so large scenes stay compact compared to fixed-resolution voxel grids.
- **Real-time on CPU**: registration runs at interactive rates (roughly 10-30 Hz depending on scene complexity) without a GPU — in deliberate contrast to the GPU-bound KinectFusion family, making it deployable on modest robot hardware.

## Results & impact

Evaluated on TUM RGB-D benchmark sequences and large indoor environments, MRS-Map achieved tracking accuracy competitive with contemporary dense systems while consuming significantly less memory than voxel-grid approaches, with registration running in real time at 10-30 Hz on a CPU. It introduced a principled multi-resolution map representation that adapts detail to scene structure, and demonstrated that surfel-level statistics (covariance, color) support robust registration without feature extraction — ideas that influenced later surfel-based systems such as ElasticFusion and surfel-based LiDAR mapping (SuMa).

## Why it matters for SLAM

MRS-Map showed that statistical surfel representations — rather than dense voxel grids — can support accurate RGB-D tracking with far lower memory and no GPU requirement, making dense-ish SLAM feasible on modest robot hardware. Its surfel-statistics registration and multi-resolution design influenced later surfel-based systems such as ElasticFusion and surfel-based LiDAR mapping, and it remains a good example of principled uncertainty-aware map representation.

## Related

- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [KinectFusion](kinectfusion.md)
- [SuMa](../level-09-lidar-visual-lidar-slam/suma.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
