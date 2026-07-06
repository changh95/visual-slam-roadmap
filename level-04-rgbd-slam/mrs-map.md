# MRS-Map

> Stückler 2014 · [Paper](https://doi.org/10.1016/j.jvcir.2013.02.008)

**One-line summary** — An octree-based multi-resolution surfel map for RGB-D SLAM that stores shape and color statistics per surfel, enabling noise-aware registration and real-time dense tracking on a CPU.

## Key ideas

- **Multi-resolution surfels in an octree**: each octree node holds a surfel with aggregated statistics — mean position, normal, color mean, and a full covariance matrix — with deeper levels providing finer resolution where the scene has detail:
  $$\boldsymbol{\mu}_k = \frac{1}{N_k}\sum_{i} \mathbf{p}_i, \quad \boldsymbol{\Sigma}_k = \frac{1}{N_k}\sum_{i} (\mathbf{p}_i - \boldsymbol{\mu}_k)(\mathbf{p}_i - \boldsymbol{\mu}_k)^\top$$
- **Noise-aware registration**: frame-to-model alignment proceeds coarse-to-fine across octree levels, matching surfel distributions with a Mahalanobis (shape) distance plus a color distance — no explicit feature extraction required.
- **Adaptive resolution = bounded memory**: detail is allocated only near well-observed surfaces; sparsely observed nodes are pruned, so large scenes stay compact compared to fixed-resolution voxel grids.
- **Real-time on CPU**: registration runs at interactive rates (roughly 10-30 Hz depending on scene complexity) without a GPU, unlike the KinectFusion family.

## Why it matters for SLAM

MRS-Map showed that statistical surfel representations — rather than dense voxel grids — can support accurate RGB-D tracking with far lower memory and no GPU requirement, making dense-ish SLAM feasible on modest robot hardware. Its surfel-statistics registration and multi-resolution design influenced later surfel-based systems such as ElasticFusion and surfel-based LiDAR mapping, and it remains a good example of principled uncertainty-aware map representation.

## Related

- [ElasticFusion](elasticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [KinectFusion](kinectfusion.md)
- [SuMa](../level-09-lidar-visual-lidar-slam/suma.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
