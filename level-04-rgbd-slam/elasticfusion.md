# ElasticFusion

> Whelan 2015 · [Paper](https://ieeexplore.ieee.org/document/7274882)

**One-line summary** — A surfel-based dense RGB-D SLAM system that achieves globally consistent reconstruction without a pose graph by applying non-rigid elastic deformations directly to the map at loop closure.

## Key ideas

- **Fused surfel-based model**: the map is a set of surfels $(\mathbf{p}, \mathbf{n}, r, \mathbf{c}, w, t)$ — position, normal, radius, color, confidence, timestamp — split into *active* (recently seen) and *inactive* parts.
- **Frame-to-model tracking (photometric + geometric)**: each frame is tracked against a prediction rendered from the active surfel map, jointly minimizing a point-to-plane ICP cost and a photometric RGB cost:
  $$E = \sum_{i} \left[ w_{\mathrm{icp}} \left(\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)\right)^2 + w_{\mathrm{rgb}} \left(I(\pi(\mathbf{T}\mathbf{v}_i)) - \hat{I}(\mathbf{u}_i)\right)^2 \right]$$
- **Local loop closure**: when the active model overlaps an inactive sub-model (model-to-model surface alignment), a local deformation stitches them back together, catching small drift continuously.
- **Global loop closure**: randomized fern encoding of frame appearance detects globally revisited places; the constraint is propagated by a non-rigid space deformation of the whole surfel map via a sparse embedded deformation graph — no pose graph, no trajectory bookkeeping.
- **Joint optimization of map consistency through deformation** replaces the usual "optimize poses, then rebuild map" loop of pose-graph systems.

## Why it matters for SLAM

ElasticFusion made "the map is the state" a viable design: instead of correcting a camera trajectory and re-integrating measurements, it corrects the dense surface itself. It became the standard surfel-based dense SLAM backbone — SemanticFusion adds CNN semantics directly on its surfels — and its active/inactive model and fern relocalization ideas recur throughout later dense systems. Use it (or study it) whenever you want high-quality dense room-scale reconstruction with online loop closure.

## Related

- [KinectFusion](kinectfusion.md)
- [Kintinuous](kintinuous.md)
- [SemanticFusion](semanticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
