# FAST-LIVO

> Zheng 2022 · [Paper](https://arxiv.org/abs/2203.00893)

**One-line summary** — FAST-LIVO unified direct LiDAR-inertial and direct visual odometry on a single map by attaching image patches to LiDAR map points, removing feature extraction from both modalities.

## Key ideas

- **Two tightly-coupled direct subsystems**: the LIO subsystem registers *raw* scan points (no edge/plane features) to an incrementally built point-cloud map, inheriting the FAST-LIO2 approach; the VIO subsystem aligns each new image by minimizing *direct photometric errors* — no ORB or FAST corners anywhere in the pipeline.
- **Image patches on map points**: map points carry small image patches from when they were observed; visual alignment matches the current image against these patches at the points' known 3D positions, giving the camera a dense pool of accurately-located anchors for free.
- **Outlier rejection for visual stability**: a novel mechanism rejects unstable map points — those lying on edges or occluded in the current view — which would otherwise corrupt the photometric alignment.
- **Efficiency and portability**: handling both multi-line spinning LiDARs and solid-state LiDARs with completely different scan patterns, running in real time on both Intel and ARM processors at reduced computational cost versus counterparts.
- Outperformed contemporary LVI systems on open sequences and the authors' own device data, particularly in challenging environments; code and dataset are open source.

## Why it matters for SLAM

FAST-LIVO is the proof that the "direct" philosophy that FAST-LIO2 brought to LiDAR extends cleanly to the visual modality — one shared map structure, one filter, no feature frontends. This architectural economy (versus LVI-SAM's two feature-based subsystems, or R3LIVE's coloring-only VIO where vision textures the map) made it the template for high-rate LVI odometry on small onboard computers, and it leads directly to FAST-LIVO2.

## Related

- [FAST-LIO2](fast-lio2.md) — the direct LIO foundation
- [FAST-LIVO2](fast-livo2.md) — the refined successor with sequential ESIKF updates
- [R3LIVE](r3live.md) — sibling system with a map-coloring VIO philosophy
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the concept this system defines
- [LVI-SAM](lvi-sam.md) — the feature-based, factor-graph alternative

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
