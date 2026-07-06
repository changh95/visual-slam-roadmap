# MASt3R-Fusion

> Zhou 2025 · [Paper](https://arxiv.org/abs/2509.20757)

**One-line summary** — Tightly fuses the MASt3R feed-forward visual model with IMU and GNSS measurements, giving foundation-model dense SLAM metric scale and global geo-referencing for outdoor use.

## Key ideas

- **Why fusion is needed**: MASt3R-SLAM produces excellent dense reconstructions but lives in a local coordinate frame — no reliable metric scale, no absolute position. Outdoor applications (driving, surveying, mapping) need both.
- **MASt3R visual frontend**: pairwise pointmaps and dense correspondences from the feed-forward model provide visual data association and geometry, replacing hand-crafted feature pipelines.
- **IMU integration**: preintegrated IMU factors between keyframes contribute relative motion constraints, resolve metric scale, and provide the gravity direction — the same role IMUs play in classical VIO.
- **GNSS anchoring**: GNSS position factors tie the trajectory to a global geographic frame, bounding long-term drift.
- **Factor-graph backend**: visual (pointmap-alignment), IMU-preintegration, and GNSS factors are optimised jointly, $E = E_{\text{visual}} + E_{\text{IMU}} + E_{\text{GNSS}}$, yielding globally consistent, metric-scale, geo-referenced trajectories and dense maps.

## Why it matters for SLAM

MASt3R-Fusion demonstrates that 3D foundation-model front-ends are compatible with the classical multi-sensor factor-graph machinery that production systems rely on — you do not have to choose between learned dense geometry and rigorous sensor fusion. It points at where deployed SLAM is heading: feed-forward models for perception, factor graphs for estimation, and absolute sensors for grounding.

## Related

- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R](mast3r.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
