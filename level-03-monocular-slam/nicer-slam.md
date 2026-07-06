# NICER-SLAM

> Zhu 2024 · [Paper](https://arxiv.org/abs/2302.03594)

**One-line summary** — An RGB-only neural implicit SLAM system that jointly optimises poses and a hierarchical neural map, using monocular depth priors and optical flow as geometric supervision instead of a depth sensor.

## Key ideas

- **No depth sensor required**: NICE-SLAM and most neural implicit SLAM systems need RGB-D input; NICER-SLAM works from monocular RGB alone, which matters because depth sensors have limited range, fail outdoors, and add cost and weight.
- **Monocular depth integration**: a pre-trained monocular depth network (e.g., DPT/MiDaS) provides dense depth priors per frame, used as soft supervision with learned confidence weighting.
- **Optical flow consistency**: dense flow between consecutive frames adds multi-view geometric constraints via a warping loss that penalises inconsistency between rendered depth/pose and observed flow.
- **Hierarchical neural implicit map**: follows NICE-SLAM's multi-level feature grids, decoded into SDF and colour by small MLPs.
- **Locally adaptive SDF-to-density transformation**: spatially varying sharpness lets the representation model both crisp surfaces and fuzzy regions.

## Why it matters for SLAM

NICER-SLAM showed that neural implicit SLAM does not fundamentally depend on depth sensors: priors from monocular depth networks plus flow consistency can substitute for direct depth supervision. This broadened the applicability of dense neural SLAM to plain monocular cameras and influenced subsequent RGB-only neural and Gaussian SLAM systems such as MonoGS.

## Related

- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [MonoGS](monogs.md)
- [DPT](../level-05-deep-learning/dpt.md)
- [MiDaS](../level-05-deep-learning/midas.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
