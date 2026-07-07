# Frame-to-model tracking

Frame-to-model tracking means aligning each incoming frame against the *accumulated map* instead of against the previous frame. In frame-to-frame tracking, every pairwise alignment carries a small error, and composing hundreds of relative poses accumulates drift quickly. The accumulated model, by contrast, averages many observations: its surfaces are smoother and less noisy than any single frame, so aligning against it is both more accurate and more stable.

## The model-predict-align-fuse loop

The classic recipe comes from KinectFusion:

1. Maintain a dense scene model (a TSDF volume or a surfel map).
2. From the previous camera pose, *predict* what the model looks like — ray-cast the TSDF (or render the surfels) to synthesize a vertex/normal map.
3. Align the new depth frame to this prediction with ICP, typically the point-to-plane variant:

$$E(\mathbf{T}) = \sum_i \big( (\mathbf{T}\,\mathbf{p}_i - \mathbf{q}_i) \cdot \mathbf{n}_i \big)^2$$

where $\mathbf{p}_i$ are points from the new frame, and $\mathbf{q}_i, \mathbf{n}_i$ are the corresponding predicted model points and normals. Correspondences use projective data association (project model points into the new frame) rather than expensive nearest-neighbor search, and the optimization runs coarse-to-fine on the GPU.

4. Fuse the newly aligned frame into the model, improving the prediction for the next frame.

## How the alignment is actually solved

Point-to-plane ICP becomes a tiny linear problem once the motion update is parameterized as a twist $\boldsymbol{\xi} = (\boldsymbol{\omega}, \mathbf{t}) \in \mathfrak{se}(3)$ and assumed small. For the current estimate $\hat{\mathbf{p}}_i = \hat{\mathbf{T}}\,\mathbf{p}_i$, the residual linearizes as

$$r_i(\boldsymbol{\xi}) \approx \mathbf{n}_i^\top\big( \hat{\mathbf{p}}_i + \boldsymbol{\omega} \times \hat{\mathbf{p}}_i + \mathbf{t} - \mathbf{q}_i \big),$$

so each valid pixel contributes one row to a least-squares problem in only 6 unknowns. The $6\times 6$ normal equations $\mathbf{J}^\top\mathbf{J}\,\boldsymbol{\xi} = -\mathbf{J}^\top\mathbf{r}$ are accumulated in parallel on the GPU (a reduction over hundreds of thousands of pixels) and solved on the CPU in microseconds; a few iterations per pyramid level suffice. This is why dense tracking can run at frame rate: the *data* is dense, but the *state* is just one pose.

Hybrid systems add a photometric term. ElasticFusion tracks against a rendered color+depth prediction of the surfel map by minimizing a weighted joint cost

$$E = \sum_i \Big[ w_{\mathrm{icp}} \big(\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)\big)^2 + w_{\mathrm{rgb}} \big(I(\pi(\mathbf{T}\mathbf{v}_i)) - \hat{I}(\mathbf{u}_i)\big)^2 \Big],$$

which keeps tracking constrained where geometry alone is degenerate (see below). DVO-style direct methods contribute the complementary ingredient: robust dense residuals over all pixels rather than sparse features.

## Common pitfalls

- **Model corruption feeds back**: if a bad alignment is fused into the model, the corrupted model then misguides subsequent tracking — errors can compound instead of averaging out. Fusion weights and outlier-aware integration are the usual defenses.
- **Small convergence basin**: ICP needs a good initial guess; fast rotation or large displacement can exceed the basin and cause irrecoverable tracking loss. Coarse-to-fine pyramids widen the basin but do not remove the limit.
- **Geometric degeneracy**: point-to-plane ICP against a single flat wall leaves three motion directions unconstrained (in-plane translation and rotation about the normal) — $\mathbf{J}^\top\mathbf{J}$ becomes rank-deficient and the pose slides. Adding a photometric term or features restores the missing constraints.
- **It is still odometry**: frame-to-model tracking reduces drift but does not eliminate it — the model itself drifts slowly with the trajectory. Full systems add loop closure on top: pose graphs, map deformation (ElasticFusion), or TSDF re-integration (BundleFusion).

## Why it matters for SLAM

Frame-to-model tracking is the defining trick of dense RGB-D SLAM: it is why KinectFusion could produce drift-free-looking desk-scale reconstructions in 2011 with no bundle adjustment at all. Almost every dense system since — Kintinuous, ElasticFusion, InfiniTAM, BundleFusion — is built around some form of it, and understanding the model-predict-align-fuse loop is the key to reading any of those papers.

## Related

- [ICP](icp.md) — the alignment algorithm at the core of the loop
- [KinectFusion](kinectfusion.md) — the canonical TSDF frame-to-model system
- [ElasticFusion](elasticfusion.md) — surfel-based frame-to-model tracking
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the two model representations you track against
- [DVO](dvo.md) — robust direct RGB-D alignment
