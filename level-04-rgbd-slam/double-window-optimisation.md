# Double Window Optimisation

> Strasdat 2011 · [Paper](https://ieeexplore.ieee.org/document/6126517)

**One-line summary** — A hierarchical backend that runs full bundle adjustment in a small inner window and pose-graph optimization in an outer window, achieving constant-time visual SLAM while preserving global consistency.

## Problem

Full bundle adjustment has cubic complexity in the number of keyframes, making it infeasible for long-duration SLAM. Sliding-window BA keeps cost constant but discards old information, causing drift; pure pose-graph optimization is fast but loses feature-level accuracy. What was missing was a principled middle ground: constant-time local optimization that still propagates global corrections through the whole map.

## Key ideas

- **Inner window (local BA)**: a fixed-size set of recent keyframes and their observed 3D points is jointly optimized with full bundle adjustment; because the window size $N_{\text{inner}}$ is fixed, per-step cost stays constant regardless of total map size.
- **Outer window (pose graph)**: keyframes outside the inner window are connected by relative pose constraints derived from earlier BA solutions, maintaining global consistency at pose-graph cost:
  $$E_{\text{outer}} = \sum_{(i,j) \in \mathcal{E}} \left\| \log\!\left(\mathbf{T}_{ij}^{-1}\,\mathbf{T}_i^{-1}\,\mathbf{T}_j\right)^{\vee} \right\|_{\boldsymbol{\Sigma}_{ij}}^{2}$$
  where $\mathbf{T}_{ij}$ is the measured relative pose and $\boldsymbol{\Sigma}_{ij}$ its covariance from local BA.
- **Information transfer via marginalization**: when a keyframe leaves the inner window, the Schur complement marginalizes its point observations into a relative pose constraint (with covariance) for the outer window — the information is *compressed* into the pose graph, not thrown away as in sliding-window BA.
- **Covisibility-based windowing**: windows are built from covisibility — which keyframes share observed points — rather than pure temporal order, so after revisiting a place the inner window contains old keyframes of the same scene, and loop closures are absorbed by local BA naturally.
- **Principled unification**: the design makes explicit the trade-off between BA (accurate, expensive), pose graphs (cheap, lossy), and filtering, and shows how marginalization connects them into one constant-time backend.

## Results & impact

Evaluated on simulated and real monocular sequences, the double-window backend achieved accuracy close to full bundle adjustment while maintaining constant processing time per frame, outperforming both pure pose-graph approaches and sliding-window BA on long trajectories. Its deepest impact is architectural: the local-BA + pose-graph + covisibility recipe became the standard backend of keyframe SLAM, most visibly in ORB-SLAM's local BA / essential graph split.

## Why it matters for SLAM

This paper supplied the backend blueprint that keyframe SLAM still follows: local BA where accuracy matters, pose-graph constraints where scale matters, connected by marginalization. ORB-SLAM's local-BA/essential-graph split and its covisibility graph are direct descendants, and the same inner/outer pattern reappears in modern sliding-window VIO with marginalization priors. Read it to understand *why* modern backends are structured the way they are.

## Related

- [Covisibility graph](../level-03-monocular-slam/covisibility-graph.md) — the graph structure driving window selection
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the outer-window machinery
- [Marginalization](../level-02-getting-familiar/marginalization.md) — how information transfers between windows
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md) — the system that popularized this backend design
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md) — companion analysis by the same author

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
