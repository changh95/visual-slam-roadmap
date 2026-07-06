# Double Window Optimisation

> Strasdat 2011 · [Paper](https://ieeexplore.ieee.org/document/6126517)

**One-line summary** — A hierarchical backend that runs full bundle adjustment in a small inner window and pose-graph optimization in an outer window, achieving constant-time visual SLAM while preserving global consistency.

## Key ideas

- **Inner window (local BA)**: a fixed-size set of recent keyframes and their observed points is jointly optimized with full bundle adjustment, so per-step cost stays constant regardless of map size.
- **Outer window (pose graph)**: older keyframes are connected by relative pose constraints of the form $\| \log(\mathbf{T}_{ij}^{-1}\mathbf{T}_i^{-1}\mathbf{T}_j)^\vee \|_{\Sigma_{ij}}^2$, maintaining global consistency at pose-graph cost.
- **Information transfer via marginalization**: when a keyframe leaves the inner window, the Schur complement marginalizes its point observations into a relative pose constraint (with covariance) for the outer window — information is compressed, not thrown away.
- **Covisibility-based windowing**: the windows are built from covisibility — which keyframes share observed points — rather than pure time, so the local optimization follows the structure of the scene.
- **Principled middle ground**: full BA is too slow for long sequences, sliding-window BA forgets, pure pose graphs lose feature-level accuracy; the double window blends their strengths.

## Why it matters for SLAM

This paper supplied the backend blueprint that keyframe SLAM still follows: local BA where accuracy matters, pose-graph constraints where scale matters, connected by marginalization. ORB-SLAM's local-BA/essential-graph split and its covisibility graph are direct descendants, and the same inner/outer pattern reappears in modern sliding-window VIO with marginalization priors. Read it to understand *why* modern backends are structured the way they are.

## Related

- [Covisibility graph](../level-03-monocular-slam/covisibility-graph.md) — the graph structure driving window selection
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md) — the outer-window machinery
- [Marginalization](../level-02-getting-familiar/marginalization.md) — how information transfers between windows
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md) — the system that popularized this backend design
- [Visual-SLAM why filter?](../level-03-monocular-slam/visual-slam-why-filter.md) — companion analysis by the same author

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
