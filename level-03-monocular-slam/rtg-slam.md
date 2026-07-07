# RTG-SLAM

> Peng 2024 · [Paper](https://arxiv.org/abs/2404.19706)

**One-line summary** — Achieves real-time, large-scale 3DGS SLAM by forcing binary Gaussian opacity, optimising only unstable Gaussians, and re-rendering only affected pixels, decoupling per-frame cost from total map size.

## Problem

Early 3DGS SLAM systems optimised every Gaussian and rendered every pixel each frame, so both optimisation and rendering costs grow without bound as the map grows — fine for a desk-sized scene, fatal for a building. Vanilla 3DGS also fits surfaces with many overlapping semi-transparent Gaussians, which is wasteful in memory and compute. RTG-SLAM is "a real-time 3D reconstruction system with an RGBD camera for large-scale environments using Gaussian splatting" (abstract), built around a compact representation and an on-the-fly optimisation scheme whose cost tracks *change*, not map size.

## Key ideas

- **Binary opacity**: each Gaussian is forced "to be either opaque or nearly transparent, with the opaque ones fitting the surface and dominant colors, and transparent ones fitting residual colors" (abstract) — eliminating deep alpha-compositing stacks of semi-transparent Gaussians.
- **Depth rendered differently from colour**: "by rendering depth in a different way from color rendering, we let a single opaque Gaussian well fit a local surface region without the need of multiple overlapping Gaussians, hence largely reducing the memory and computation cost" (abstract).
- **Targeted densification**: new Gaussians are explicitly added for three pixel types per frame — newly observed, large colour error, large depth error — so map growth is driven by measured deficiency rather than a generic gradient heuristic.
- **Stable/unstable classification with selective optimisation**: Gaussians expected to already fit previous RGB-D observations are marked stable; "we only optimize the unstable Gaussians and only render the pixels occupied by unstable Gaussians" (abstract), so per-frame cost is proportional to the unconverged frontier, not to the whole map.
- **Adaptive Gaussian budget**: low-contribution Gaussians are pruned to balance reconstruction quality against compute and memory limits, keeping the representation compact over long sequences.

## Results & impact

The paper shows real-time reconstructions of a variety of large scenes; "compared with the state-of-the-art NeRF-based RGBD SLAM, our system achieves comparable high-quality reconstruction but with around twice the speed and half the memory cost, and shows superior performance in the realism of novel view synthesis and camera tracking accuracy" (abstract). Its stable/unstable bookkeeping became a reference design for scaling Gaussian SLAM.

## Why it matters for SLAM

Early 3DGS SLAM systems optimised every Gaussian and rendered every pixel each frame, which cannot scale beyond small rooms. RTG-SLAM showed how to make Gaussian SLAM computation proportional to what changed rather than to map size — the same insight that made classical large-scale SLAM tractable (local BA, covisibility windows) translated to the splatting era. It is a key reference for deploying Gaussian SLAM on real robots.

## Related

- [SplaTAM](splatam.md)
- [Photo-SLAM](photo-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [MonoGS](monogs.md)
- [EGG-Fusion](egg-fusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
