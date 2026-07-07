# GLOMAP

> Pan 2024 · [Paper](https://arxiv.org/abs/2407.20219)

**One-line summary** — Revisited global Structure-from-Motion and showed it can match incremental SfM (COLMAP) in accuracy while being dramatically faster, by replacing separate translation averaging with a joint global positioning step.

## Problem

Structure-from-Motion solutions split into two paradigms. *Incremental* SfM (COLMAP being the dominant system) registers images one at a time with repeated bundle adjustment; it is accurate and robust but scales poorly, since cost grows steeply with collection size. *Global* SfM estimates all cameras at once and is drastically more scalable and efficient, but it had never matched incremental pipelines in accuracy and robustness — mostly because its translation-averaging stage is fragile. GLOMAP set out to close that gap and make global SfM a general-purpose replacement.

## Key ideas

- **Global instead of incremental SfM**: rather than registering images one by one with repeated rounds of bundle adjustment (as COLMAP does), GLOMAP estimates all camera poses at once, which removes the main scalability bottleneck of incremental pipelines. The pipeline follows the classical global recipe — estimate two-view geometries, then solve for all rotations, then all positions — but redesigns the fragile parts.
- **Rotation averaging first**: absolute camera orientations $R_i \in SO(3)$ are recovered by averaging the relative rotations $R_{ij}$ from two-view geometries, a comparatively well-conditioned subproblem that is solved before any positions are touched.
- **Joint global positioning instead of translation averaging**: the classical weak point of global SfM is translation averaging — recovering camera centres from relative translation directions — which breaks down under noisy two-view translations, unknown baselines, and degenerate (e.g., collinear/forward) motion. GLOMAP's central design decision is to skip it: camera positions *and* 3D point positions are estimated directly and jointly from image observations, so structure constrains the cameras from the start.
- **Global bundle adjustment as refinement**: the joint positioning result is refined with standard BA, giving the final metric-quality reconstruction without ever entering an incremental register-triangulate-adjust loop.
- **COLMAP-compatible by construction**: it consumes the same database (features, matches, two-view geometries) and produces the same output format as COLMAP, so it works as a drop-in replacement for the reconstruction (mapping) stage in existing workflows — including NeRF/3DGS data-preparation scripts.

## Results & impact

- The abstract's headline claim: accuracy and robustness "on-par or superior to COLMAP, the most widely used incremental SfM, while being orders of magnitude faster."
- Released open source at [github.com/colmap/glomap](https://github.com/colmap/glomap) — hosted inside the COLMAP organisation itself, which accelerated adoption as the default "fast mapper" in reconstruction toolchains.
- Rehabilitated global SfM as a serious general-purpose paradigm after a decade in which incremental pipelines were assumed to be the only robust option; GPU-native systems such as InstantSfM continue this line.

## Why it matters for SLAM

SfM tools like COLMAP are the standard way to generate ground-truth trajectories, offline maps, and training data (e.g., for NeRF/3DGS and for learning-based SLAM). GLOMAP makes this offline mapping step much cheaper at scale, which matters whenever you need to reconstruct thousands of images. It also revived interest in global SfM as a serious alternative to the incremental paradigm, a trend continued by GPU-native pipelines such as InstantSfM. Conceptually, its "solve everything at once" stance mirrors the SLAM backend's global bundle adjustment — the difference is that GLOMAP never needs an incremental frontend at all.

## Related

- [COLMAP](colmap.md)
- [InstantSfM](instantsfm.md)
- [VGGT](vggt.md)
- [MASt3R](mast3r.md)
- [Schur complement / Sparsity](../level-02-getting-familiar/schur-complement-sparsity.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
