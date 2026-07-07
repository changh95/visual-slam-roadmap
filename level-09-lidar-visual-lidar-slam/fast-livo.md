# FAST-LIVO

> Zheng 2022 · [Paper](https://arxiv.org/abs/2203.00893)

**One-line summary** — FAST-LIVO unified direct LiDAR-inertial and direct visual odometry on a single map by attaching image patches to LiDAR map points, removing feature extraction from both modalities.

## Problem

Earlier LVI systems ran a feature-based visual frontend (ORB/FAST corners, descriptor matching) beside the LiDAR pipeline — a per-frame computational bottleneck that also fails outright in texture-poor scenes where few corners exist. FAST-LIO2 had just shown that the LiDAR side works better *without* features; FAST-LIVO asks whether the same direct philosophy extends to the camera, and whether both sensors can share one map instead of maintaining separate visual and LiDAR representations.

## Key ideas

- **Two tightly-coupled direct subsystems**: the LIO subsystem registers *raw* scan points (no edge/plane features) to an incrementally built point-cloud map, inheriting the FAST-LIO2 approach; the VIO subsystem aligns each new image by minimizing *direct photometric errors* — no ORB or FAST corners anywhere in the pipeline.
- **Image patches on map points**: map points are attached with image patches from when they were observed; a new frame is aligned by minimizing the patch photometric error

  $$r_i^V = \sum_{\mathbf{u} \in \Omega} \Big( I_{\text{cur}}\big(\pi(\mathbf{T}\,\mathbf{p}_i) + \mathbf{u}\big) - P_i(\mathbf{u}) \Big)^2$$

  over each visible point's patch neighborhood $\Omega$. Because LiDAR supplies accurate 3D positions for these anchors, the camera gets a dense pool of well-localized landmarks with no triangulation and no depth ambiguity.
- **One filter, stacked residuals**: LiDAR point-to-plane residuals and visual photometric residuals enter the *same* iterated Kalman filter update — the Jacobians are simply stacked, $\mathbf{H} = [\mathbf{H}^{\text{LiDAR}}; \mathbf{H}^{\text{Visual}}]$ — so both modalities correct one shared state (pose, velocity, IMU biases).
- **Outlier rejection for visual stability**: a novel mechanism rejects unstable map points — those lying on edges or occluded in the current image view — which would otherwise corrupt the photometric alignment.
- **Efficiency and portability**: supports both multi-line spinning LiDARs and emerging solid-state LiDARs with completely different scanning patterns, and runs in real time on both Intel and ARM processors.

## Results & impact

Experiments on open data sequences and the authors' own device data show FAST-LIVO outperforming counterpart LVI systems while handling challenging environments at reduced computational cost. The code and the dataset were open-sourced to the robotics community. Architecturally, it proved that a single shared map (geometry from LiDAR, appearance patches for the camera) is a viable alternative to running two separate feature pipelines — the design refined by FAST-LIVO2.

## Why it matters for SLAM

FAST-LIVO is the proof that the "direct" philosophy that FAST-LIO2 brought to LiDAR extends cleanly to the visual modality — one shared map structure, one filter, no feature frontends. This architectural economy (versus LVI-SAM's two feature-based subsystems, or R3LIVE's coloring-only VIO where vision textures the map) made it the template for high-rate LVI odometry on small onboard computers, and it leads directly to FAST-LIVO2.

## Related

- [FAST-LIO2](fast-lio2.md) — the direct LIO foundation
- [FAST-LIVO2](fast-livo2.md) — the refined successor with sequential ESIKF updates
- [R3LIVE](r3live.md) — sibling system with a map-coloring VIO philosophy
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the concept this system defines
- [LVI-SAM](lvi-sam.md) — the feature-based, factor-graph alternative

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
