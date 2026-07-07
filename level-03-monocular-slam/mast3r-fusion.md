# MASt3R-Fusion

> Zhou 2025 · [Paper](https://arxiv.org/abs/2509.20757)

**One-line summary** — Tightly fuses the MASt3R feed-forward visual model with IMU and GNSS measurements in a hierarchical factor graph, giving foundation-model dense SLAM metric scale and global geo-referencing.

## Problem

Classical visual SLAM "often struggle[s] with low-texture environments, scale ambiguity, and degraded performance under challenging visual conditions" (abstract); feed-forward pointmap regression (MASt3R) fixes much of that by recovering high-fidelity geometry directly from images. But these new pipelines discard "the widely validated advantages of probabilistic multi-sensor information fusion": no metric scale from an IMU, no absolute geo-referencing from GNSS, no principled uncertainty bookkeeping. MASt3R-Fusion asks how to couple a feed-forward visual model *tightly* with inertial and GNSS sensing rather than post-hoc.

## Key ideas

- **Feed-forward visual frontend**: MASt3R-style pointmap regression provides dense geometry and data association from image pairs, replacing hand-crafted feature pipelines and leveraging learned spatial priors where multi-view geometry is weak (low texture, poor conditions).
- **Sim(3) visual constraints in an SE(3) graph**: the system "introduces Sim(3)-based visual alignment constraints (in the Hessian form) into a universal metric-scale SE(3) factor graph" (abstract) — the visual model's reconstructions are internally scale-ambiguous, so they enter the graph as 7-DoF constraints whose scale is pinned down by the metric sensors.
- **IMU preintegration**: inertial factors between keyframes contribute relative motion, gravity direction, and metric scale — the classical VIO roles — now anchoring a foundation-model frontend instead of a sparse feature frontend.
- **GNSS anchoring**: GNSS factors tie the trajectory to a global geographic frame, bounding long-term drift and making the output directly usable for outdoor navigation and surveying.
- **Hierarchical factor graph**: a two-level design allows "both real-time sliding-window optimization and global optimization with aggressive loop closures" (abstract), so the system simultaneously delivers real-time pose tracking, metric-scale structure perception, and globally consistent mapping.

## Results & impact

- Evaluated "on both public benchmarks and self-collected datasets, demonstrating substantial improvements in accuracy and robustness over existing visual-centered multi-sensor SLAM systems" (abstract).
- Code released open source ([GREAT-WHU/MASt3R-Fusion](https://github.com/GREAT-WHU/MASt3R-Fusion)), from the GNSS/geodesy-focused group at Wuhan University — notable in itself, as it brings the foundation-model SLAM line into the high-precision navigation community.
- One of the first systems to show a full sensor-fusion stack (visual + inertial + GNSS) built around a feed-forward 3D foundation model.

## Why it matters for SLAM

MASt3R-Fusion demonstrates that 3D foundation-model front-ends are compatible with the classical multi-sensor factor-graph machinery that production systems rely on — you do not have to choose between learned dense geometry and rigorous sensor fusion. The Sim(3)-constraints-into-SE(3)-graph device is the key pattern to remember: it is how scale-ambiguous learned geometry gets grounded by metric sensors. It points at where deployed SLAM is heading: feed-forward models for perception, factor graphs for estimation, absolute sensors for grounding.

## Related

- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R](mast3r.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
