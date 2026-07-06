# Frame-to-model tracking

Frame-to-model tracking means aligning each incoming frame against the *accumulated map* instead of against the previous frame. In frame-to-frame tracking, every pairwise alignment carries a small error, and composing hundreds of relative poses accumulates drift quickly. The accumulated model, by contrast, averages many observations: its surfaces are smoother and less noisy than any single frame, so aligning against it is both more accurate and more stable.

The classic recipe comes from KinectFusion:

1. Maintain a dense scene model (a TSDF volume or a surfel map).
2. From the previous camera pose, *predict* what the model looks like — ray-cast the TSDF (or render the surfels) to synthesize a vertex/normal map.
3. Align the new depth frame to this prediction with ICP, typically the point-to-plane variant:

$$E(\mathbf{T}) = \sum_i \big( (\mathbf{T}\,\mathbf{p}_i - \mathbf{q}_i) \cdot \mathbf{n}_i \big)^2$$

where $\mathbf{p}_i$ are points from the new frame, and $\mathbf{q}_i, \mathbf{n}_i$ are the corresponding predicted model points and normals. Correspondences use projective data association (project model points into the new frame) rather than expensive nearest-neighbor search, and the optimization runs coarse-to-fine on the GPU.

4. Fuse the newly aligned frame into the model, improving the prediction for the next frame.

ElasticFusion applies the same idea to a surfel map and adds a photometric term, tracking against a rendered color+depth prediction of the map. DVO-style direct methods show the complementary ingredient: robust dense residuals over all pixels rather than sparse features.

The approach has known failure modes. If tracking errors corrupt the model, the corrupted model then misguides tracking — errors can feed back on themselves. Fast motion can exceed ICP's convergence basin, since ICP needs a good initial guess. And frame-to-model tracking alone is still odometry: it reduces drift but does not eliminate it, which is why full systems add loop closure (pose graphs, map deformation, or TSDF re-integration) on top.

## Why it matters for SLAM

Frame-to-model tracking is the defining trick of dense RGB-D SLAM: it is why KinectFusion could produce drift-free-looking desk-scale reconstructions in 2011 with no bundle adjustment at all. Almost every dense system since — Kintinuous, ElasticFusion, InfiniTAM, BundleFusion — is built around some form of it, and understanding the model-predict-align-fuse loop is the key to reading any of those papers.

## Related

- [ICP](icp.md) — the alignment algorithm at the core of the loop
- [KinectFusion](kinectfusion.md) — the canonical TSDF frame-to-model system
- [ElasticFusion](elasticfusion.md) — surfel-based frame-to-model tracking
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the two model representations you track against
- [DVO](dvo.md) — robust direct RGB-D alignment

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
