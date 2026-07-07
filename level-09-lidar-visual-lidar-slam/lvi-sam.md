# LVI-SAM

> Shan 2021 · [Paper](https://arxiv.org/abs/2104.10831)

**One-line summary** — LVI-SAM tightly couples a VINS-Mono-style visual-inertial subsystem with a LIO-SAM-style LiDAR-inertial subsystem atop a shared factor graph, with each subsystem bootstrapping and rescuing the other.

## Problem

LiDAR-inertial odometry fails in geometrically degenerate, feature-less environments (long corridors, open fields), while visual-inertial odometry fails in texture-less scenes, darkness, and overexposure. Neither modality alone is robust across the full range of real deployments. LVI-SAM builds a tightly-coupled LiDAR-visual-inertial system whose two halves not only share information in nominal operation but explicitly keep the whole system alive when one half fails.

## Key ideas

- **Two subsystems, one factor graph**: the visual-inertial system (VIS) and LiDAR-inertial system (LIS) are designed as a tightly-coupled pair atop a shared factor graph, rather than independent odometries fused after the fact. All measurement sources enter one MAP problem,

  $$\mathbf{X}^* = \arg\min_{\mathbf{X}} \sum \|\mathbf{r}^{\text{IMU}}\|^2_{\Sigma_I} + \sum \|\mathbf{r}^{\text{vis}}\|^2_{\Sigma_V} + \sum \|\mathbf{r}^{\text{lidar}}\|^2_{\Sigma_L} + \sum \|\mathbf{r}^{\text{loop}}\|^2_{\Sigma_{lp}},$$

  over shared poses and IMU biases $\mathbf{X}$.
- **Cross-system initialization**: the VIS leverages LIS estimation to initialize quickly and reliably — replacing VINS-Mono's slow standalone initialization and cutting visual initialization from roughly 15 s to about 1 s; in turn, the LIS uses VIS pose estimates as initial guesses for scan-matching.
- **LiDAR depth for visual features**: projecting LiDAR points into the camera gives visual features accurate metric depth, substantially improving VIS accuracy over depth from monocular triangulation alone.
- **Two-stage loop closure**: loop candidates are first identified visually (appearance-based place recognition), then geometrically refined by LiDAR scan-matching — combining the camera's place-recognition strength with LiDAR's metric precision before the constraint enters the graph.
- **Failure tolerance by design**: each subsystem monitors its own health, and LVI-SAM keeps functioning when either subsystem fails — exactly what texture-less scenes (VIS failure) and feature-less/degenerate geometry (LIS failure) demand.

## Results & impact

LVI-SAM was extensively evaluated on datasets gathered from several platforms over a variety of scales and environments, demonstrating real-time state estimation with high accuracy and robustness. The qualitative headline is the failure-mode coverage: the system continues operating in texture-less and in feature-less environments where one of its subsystems alone would fail. The open-source implementation made it the standard factor-graph LVI baseline that later direct, filter-based systems (R3LIVE, FAST-LIVO) compare themselves against.

## Why it matters for SLAM

LVI-SAM is the canonical factor-graph realization of LiDAR-visual-inertial fusion, and the clearest illustration of *bidirectional* sensor aiding: depth flows from LiDAR to camera, initialization and recovery flow in both directions. Built by the LIO-SAM authors as its natural extension, it became the standard LVI baseline that direct, filter-based competitors (R3LIVE, FAST-LIVO) measure themselves against. It is also the go-to case study for degradation handling in triple fusion.

## Related

- [LIO-SAM](lio-sam.md) — the LiDAR-inertial subsystem and factor-graph backbone
- [VINS-Mono](../level-06-vio-vins/vins-mono.md) — the design basis of the visual-inertial subsystem
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the fusion concept it exemplifies
- [Degradation handling](degradation-handling.md) — its cross-subsystem fallback behavior
- [FAST-LIVO](fast-livo.md) — the direct, filter-based alternative
- [Tightly-coupled LiDAR-camera](tightly-coupled-lidar-camera.md) — the architectural principle it realizes with a factor graph

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
