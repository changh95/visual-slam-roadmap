# ElasticFusion

> Whelan 2015 · [Paper](https://ieeexplore.ieee.org/document/7274882)

**One-line summary** — A surfel-based dense RGB-D SLAM system that achieves globally consistent reconstruction without a pose graph by applying non-rigid elastic deformations directly to the map at loop closure.

## Problem

KinectFusion's fixed volume restricts scene size, and Kintinuous's rolling volume extends the range but still accumulates drift that must be corrected. Pose-graph approaches correct the camera trajectory, but keeping a *dense* map consistent with an optimized trajectory requires complex bookkeeping — every measurement must be re-associated with its corrected pose. ElasticFusion asks: what if we drop the pose graph entirely and treat the dense surfel map itself as an elastic surface that can be deformed into global consistency?

## Key ideas

- **Fused surfel-based model**: the map is a set of surfels $\mathcal{M} = \{(\mathbf{p}_i, \mathbf{n}_i, r_i, \mathbf{c}_i, w_i, t_i)\}$ — position, normal, radius, color, confidence weight, timestamp — split into *active* (recently observed) and *inactive* parts by time-windowing on $t_i$.
- **Frame-to-model tracking (photometric + geometric)**: each frame is tracked against a prediction rendered from the active surfel map (not against the previous frame), jointly minimizing a point-to-plane ICP cost and a photometric RGB cost:
  $$E = \sum_{i} \left[ w_{\mathrm{icp}} \left(\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)\right)^2 + w_{\mathrm{rgb}} \left(I(\pi(\mathbf{T}\mathbf{v}_i)) - \hat{I}(\mathbf{u}_i)\right)^2 \right]$$
- **Surfel fusion**: new depth measurements are merged into existing surfels when close enough (updating position, normal, color, and confidence), otherwise new surfels are created; surfels not seen recently become inactive and wait to be reconciled.
- **Local loop closure**: when the camera revisits a region, the active model overlaps an inactive sub-model; a model-to-model surface alignment produces a local deformation that stitches the two back together, catching small drift continuously rather than only at big loop events.
- **Global loop closure with randomized ferns**: fern-encoded frame appearance detects globally revisited places; the resulting constraint is propagated through the entire map by a non-rigid space deformation over a sparse embedded deformation graph with energy of the form
  $$E_{\mathrm{def}} = \sum_k \left( \mathbf{R}_k^\top \mathbf{R}_k - \mathbf{I} \right)^2 + \sum_{k,\,j\in\mathcal{N}(k)} \|\mathbf{R}_k(\mathbf{g}_j - \mathbf{g}_k) + \mathbf{g}_k + \mathbf{t}_k - \mathbf{g}_j - \mathbf{t}_j\|^2,$$
  where $\mathbf{g}_k, \mathbf{R}_k, \mathbf{t}_k$ are deformation-node position, rotation, and translation — no pose graph, no trajectory bookkeeping.
- **Map-centric pipeline**: the full loop is `RGB-D input → surfel prediction (rendering) → frame-to-model ICP+RGB tracking → surfel fusion → local loop check → fern loop check → elastic deformation`. Joint optimization of map consistency through deformation replaces the usual "optimize poses, then rebuild map" cycle of pose-graph systems.

## Results & impact

Published at RSS 2015, ElasticFusion achieved state-of-the-art trajectory accuracy on the TUM RGB-D and ICL-NUIM benchmarks at the time, with visually superior reconstruction quality to KinectFusion and Kintinuous, running at roughly 30 Hz on an NVIDIA Titan X GPU. It established surfel-based dense SLAM with frame-to-model tracking as a primary paradigm alongside TSDF fusion, and pioneered non-rigid map deformation as a loop-closure mechanism. SemanticFusion (2016) extended it directly by attaching CNN semantic label distributions to its surfels, and its active/inactive model split and fern-based relocalization recur throughout later dense systems.

## Why it matters for SLAM

ElasticFusion made "the map is the state" a viable design: instead of correcting a camera trajectory and re-integrating measurements, it corrects the dense surface itself. It became the standard surfel-based dense SLAM backbone — SemanticFusion adds CNN semantics directly on its surfels — and its active/inactive model and fern relocalization ideas recur throughout later dense systems. Use it (or study it) whenever you want high-quality dense room-scale reconstruction with online loop closure.

## Related

- [KinectFusion](kinectfusion.md)
- [Kintinuous](kintinuous.md)
- [SemanticFusion](semanticfusion.md)
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [BundleFusion](bundlefusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
