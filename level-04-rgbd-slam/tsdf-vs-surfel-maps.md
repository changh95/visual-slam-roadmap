# TSDF vs Surfel maps

Dense RGB-D SLAM needs a map representation that can absorb noisy depth frames into a clean surface. Two families dominate, exemplified by KinectFusion and ElasticFusion.

**TSDF (Truncated Signed Distance Function)** is a volumetric representation: space is divided into voxels, and each voxel stores the signed distance to the nearest surface, truncated to a narrow band around it, plus a fusion weight. New depth frames are fused by a running weighted average per voxel:

$$F(\mathbf{x}) \leftarrow \frac{W(\mathbf{x})\,F(\mathbf{x}) + w\,f_{\text{new}}(\mathbf{x})}{W(\mathbf{x}) + w}, \qquad W(\mathbf{x}) \leftarrow W(\mathbf{x}) + w$$

The surface is the zero-crossing of $F$, extracted by ray-casting or marching cubes. Fusion is trivially parallel (ideal for GPUs) and averaging cancels sensor noise, producing smooth watertight surfaces. The costs: memory grows with volume rather than surface area (mitigated by voxel hashing or octrees), resolution is fixed by voxel size, and correcting past poses is expensive — the volume must be de-integrated and re-integrated (BundleFusion) or shifted (Kintinuous).

**Surfel maps** are point-based: the scene is a set of surfels — disk-shaped surface elements, each with position, normal, radius, color, confidence weight, and timestamp. New measurements either update an existing nearby surfel (weighted averaging of its attributes) or spawn a new one. Memory scales with observed surface area, resolution adapts to measurement density, and because surfels are independent primitives, the map can be *deformed*: ElasticFusion applies a non-rigid deformation graph to the surfel cloud at loop closure instead of maintaining a pose graph. The costs: no connected mesh comes for free, rendering-based model prediction is needed for tracking, and deformation can blur fine surface detail.

| | TSDF (KinectFusion) | Surfels (ElasticFusion) |
|---|---|---|
| Structure | Voxel grid over space | Unstructured point set on surface |
| Fusion | Running average per voxel | Per-surfel attribute update |
| Surface extraction | Zero-crossing (ray-cast / marching cubes) | Splat rendering |
| Memory | Scales with volume (needs hashing/octrees) | Scales with surface area |
| Loop-closure correction | De-/re-integration or volume shifting | Non-rigid map deformation |
| Output quality | Smooth, watertight meshes | Adaptive, deformable, no mesh |

Neither wins outright: BAD SLAM optimizes surfels jointly with poses in a direct bundle adjustment, while BundleFusion shows TSDFs can stay globally consistent through re-integration. Later neural representations (neural fields, 3D Gaussians) are best understood as descendants of these two philosophies — implicit volumetric versus explicit primitive-based mapping.

## Why it matters for SLAM

The map representation dictates almost everything downstream in a dense SLAM system: how tracking predictions are generated, how memory scales with scene size, and — most critically — how the system can correct the map when loop closure reveals accumulated drift. "TSDF with re-integration or surfels with deformation" is the fundamental design fork of RGB-D SLAM, and recognizing it lets you place any dense system on the map quickly.

## Related

- [KinectFusion](kinectfusion.md) — the canonical TSDF fusion system
- [ElasticFusion](elasticfusion.md) — the canonical surfel fusion system
- [BundleFusion](bundlefusion.md) — TSDF kept consistent via de-/re-integration
- [BAD SLAM](bad-slam.md) — direct bundle adjustment over a surfel map
- [Frame-to-model tracking](frame-to-model-tracking.md) — how these maps are used for tracking

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
