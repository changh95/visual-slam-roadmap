# RTG-SLAM

> Peng 2024 · [Paper](https://arxiv.org/abs/2404.19706)

**One-line summary** — Achieves real-time, large-scale 3DGS SLAM by forcing binary Gaussian opacity, optimising only unstable Gaussians, and re-rendering only affected pixels, decoupling per-frame cost from total map size.

## Key ideas

- **Binary opacity**: after a settling period each Gaussian becomes fully opaque or fully transparent, eliminating expensive alpha compositing of many overlapping semi-transparent Gaussians.
- **Stability-based selective optimisation**: Gaussians are classified as stable (converged) or unstable (recently added or perturbed); only unstable ones are optimised each iteration, so cost does not grow with the map.
- **Selective rendering**: only pixels covered by unstable Gaussians are re-rendered during mapping, while stable regions keep their cached rendering.
- **Adaptive Gaussian budget**: a budget mechanism prunes low-contribution Gaussians, balancing reconstruction quality against compute and memory limits.
- **Embedded real-time**: the design targets real-time rates on embedded hardware (around 25 FPS on Jetson AGX Orin per the paper), not just desktop GPUs.

## Why it matters for SLAM

Early 3DGS SLAM systems optimised every Gaussian and rendered every pixel each frame, which cannot scale beyond small rooms. RTG-SLAM showed how to make Gaussian SLAM computation proportional to what changed rather than to map size — the same insight that made classical large-scale SLAM tractable (local BA, covisibility windows) translated to the splatting era. It is a key reference for deploying Gaussian SLAM on real robots.

## Related

- [SplaTAM](splatam.md)
- [Photo-SLAM](photo-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [MonoGS](monogs.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
