# TSDF vs Surfel maps

Dense RGB-D SLAM needs a map representation that can absorb noisy depth frames into a clean surface. Two families dominate, exemplified by KinectFusion and ElasticFusion.

## TSDF: fusing into a voxel grid

**TSDF (Truncated Signed Distance Function)** is a volumetric representation: space is divided into voxels, and each voxel stores the signed distance to the nearest surface, truncated to a narrow band around it, plus a fusion weight. Each new depth frame is first converted into a per-voxel distance observation: project the voxel center $\mathbf{x}$ into the depth image and compare the measured depth against the voxel's distance along the camera ray,

$$f_t(\mathbf{x}) = \Psi\!\left(\frac{d_t\big(\pi(\mathbf{K}\,\mathbf{T}_t^{-1}\mathbf{x})\big) - \|\mathbf{x} - \mathbf{t}_t\|/\lambda}{\mu}\right), \qquad \Psi(\eta) = \min(1, \max(-1, \eta)),$$

where $\mu$ is the truncation distance and $\Psi$ clamps values into $[-1, 1]$. These observations are fused by a running weighted average per voxel:

$$F(\mathbf{x}) \leftarrow \frac{W(\mathbf{x})\,F(\mathbf{x}) + w\,f_{\text{new}}(\mathbf{x})}{W(\mathbf{x}) + w}, \qquad W(\mathbf{x}) \leftarrow W(\mathbf{x}) + w$$

The surface is the zero-crossing of $F$, extracted by ray-casting or marching cubes. Fusion is trivially parallel (ideal for GPUs) and averaging cancels sensor noise, producing smooth watertight surfaces. The costs: memory grows with volume rather than surface area — KinectFusion's fixed grid (e.g. $512^3$ voxels at 2-3 mm resolution) covers only a few cubic meters, which is what voxel hashing and octrees were invented to mitigate — resolution is fixed by voxel size, and correcting past poses is expensive: the volume must be de-integrated and re-integrated (BundleFusion) or shifted (Kintinuous).

## Surfels: fusing into surface primitives

**Surfel maps** are point-based: the scene is a set of surfels — disk-shaped surface elements

$$\mathcal{M} = \{(\mathbf{p}_i, \mathbf{n}_i, r_i, \mathbf{c}_i, w_i, t_i)\}$$

each carrying position, normal, radius, color, confidence weight, and timestamp. New measurements either update an existing nearby surfel (weighted averaging of its attributes) or spawn a new one. Memory scales with observed surface area, resolution adapts to measurement density, and because surfels are independent primitives, the map can be *deformed*: ElasticFusion applies a non-rigid deformation graph (in the spirit of embedded deformation) to the surfel cloud at loop closure instead of maintaining a pose graph. The costs: no connected mesh comes for free, rendering-based model prediction is needed for tracking, and deformation can blur fine surface detail.

## Side by side

| | TSDF (KinectFusion) | Surfels (ElasticFusion) |
|---|---|---|
| Structure | Voxel grid over space | Unstructured point set on surface |
| Fusion | Running average per voxel | Per-surfel attribute update |
| Surface extraction | Zero-crossing (ray-cast / marching cubes) | Splat rendering |
| Memory | Scales with volume (needs hashing/octrees) | Scales with surface area |
| Loop-closure correction | De-/re-integration or volume shifting | Non-rigid map deformation |
| Output quality | Smooth, watertight meshes | Adaptive, deformable, no mesh |

## Choosing in practice — and the pitfalls

Neither wins outright: BAD SLAM optimizes surfels jointly with poses in a direct bundle adjustment, while BundleFusion shows TSDFs can stay globally consistent through re-integration. Some rules of thumb and traps:

- **Truncation distance $\mu$ is a real trade-off**: too small and sensor noise makes surfaces vanish or double; too large and nearby surfaces (thin walls, table tops seen from both sides) interfere with each other inside the truncation band.
- **Thin structures are the TSDF's blind spot**: geometry thinner than a few voxels cannot be represented — averaging from both sides erases it. Surfels handle thin structures more gracefully since they live *on* the surface.
- **Voxel size vs memory is cubic**: halving the voxel size costs 8× the memory of the affected region; voxel hashing only helps because most of space is empty.
- **Surfels need good normals**: every surfel update relies on normals estimated from noisy depth; poor normals produce misaligned disks and fuzzy surfaces, and choosing the surfel radius (from depth and viewing angle) matters more than it looks.
- **Plan for loop closure from day one**: the representation determines your correction mechanism — de-/re-integration requires keeping per-frame depth around to undo old integrations, and map deformation trades global consistency for some local blurring. Retrofitting either onto a system that assumed poses never change is painful.

Later neural representations (neural fields, 3D Gaussians) are best understood as descendants of these two philosophies — implicit volumetric versus explicit primitive-based mapping.

## Why it matters for SLAM

The map representation dictates almost everything downstream in a dense SLAM system: how tracking predictions are generated, how memory scales with scene size, and — most critically — how the system can correct the map when loop closure reveals accumulated drift. "TSDF with re-integration or surfels with deformation" is the fundamental design fork of RGB-D SLAM, and recognizing it lets you place any dense system on the map quickly.

## Related

- [KinectFusion](kinectfusion.md) — the canonical TSDF fusion system
- [ElasticFusion](elasticfusion.md) — the canonical surfel fusion system
- [BundleFusion](bundlefusion.md) — TSDF kept consistent via de-/re-integration
- [BAD SLAM](bad-slam.md) — direct bundle adjustment over a surfel map
- [Frame-to-model tracking](frame-to-model-tracking.md) — how these maps are used for tracking
