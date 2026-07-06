# LVI-SAM

> Shan 2021 · [Paper](https://arxiv.org/abs/2104.10831)

**One-line summary** — LVI-SAM tightly couples a VINS-Mono-style visual-inertial subsystem with a LIO-SAM-style LiDAR-inertial subsystem atop a shared factor graph, with each subsystem bootstrapping and rescuing the other.

## Key ideas

- **Two subsystems, one factor graph**: the visual-inertial system (VIS) and LiDAR-inertial system (LIS) are designed as a tightly-coupled pair rather than independent odometries fused after the fact.
- **Cross-system initialization**: the VIS leverages LIS estimation to initialize quickly and reliably; in turn, the LIS uses VIS pose estimates as initial guesses for scan-matching.
- **LiDAR depth for visual features**: projecting LiDAR points into the camera gives visual features accurate depth, substantially improving VIS accuracy over monocular triangulation.
- **Two-stage loop closure**: loop candidates are first identified visually (appearance-based), then geometrically refined by LiDAR scan-matching — combining the camera's place-recognition strength with LiDAR's metric precision.
- **Failure tolerance by design**: LVI-SAM keeps functioning when either subsystem fails, which is exactly what texture-less scenes (VIS failure) and feature-less/degenerate geometry (LIS failure) demand.

## Why it matters for SLAM

LVI-SAM is the canonical factor-graph realization of LiDAR-visual-inertial fusion, and the clearest illustration of *bidirectional* sensor aiding: depth flows from LiDAR to camera, initialization and recovery flow in both directions. Built by the LIO-SAM authors as its natural extension, it became the standard LVI baseline that direct, filter-based competitors (R3LIVE, FAST-LIVO) measure themselves against. It is also the go-to case study for degradation handling in triple fusion.

## Related

- [LIO-SAM](lio-sam.md) — the LiDAR-inertial subsystem and factor-graph backbone
- [VINS-Mono](../level-06-vio-vins/vins-mono.md) — the design basis of the visual-inertial subsystem
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the fusion concept it exemplifies
- [Degradation handling](degradation-handling.md) — its cross-subsystem fallback behavior
- [FAST-LIVO](fast-livo.md) — the direct, filter-based alternative

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
