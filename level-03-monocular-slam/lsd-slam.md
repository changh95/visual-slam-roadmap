# LSD-SLAM

> Engel 2014 · [Paper](https://cvg.cit.tum.de/research/vslam/lsdslam)

**One-line summary** — The first large-scale direct monocular SLAM: semi-dense depth maps tracked by photometric error minimisation on a CPU, with Sim(3) pose-graph loop closure to handle monocular scale drift.

## Problem

By 2014 the two existing options for monocular SLAM each had a hard limitation. Feature-based systems (PTAM lineage) were accurate but produced only sparse landmark maps and threw away all image information except corners. DTAM had shown fully dense direct tracking, but needed a GPU and was confined to small workspaces. And any monocular system accumulates *scale* drift on long trajectories, which a 6-DoF pose graph cannot represent. LSD-SLAM (Engel, Schöps, Cremers — TU Munich, ECCV 2014) aimed at all three: direct, large-scale, and CPU real-time.

## Key ideas

- **Direct image alignment**: camera pose is estimated by minimising the photometric error of high-gradient pixels between the current frame and the active keyframe,
  $$E(\boldsymbol{\xi}) = \sum_{\mathbf{p} \in \Omega} \rho\!\left( \frac{I_2(\pi(\mathbf{T}(\boldsymbol{\xi})\, \pi^{-1}(\mathbf{p}, d_{\mathbf{p}}))) - I_1(\mathbf{p})}{\sigma_{d_{\mathbf{p}}}} \right),$$
  with a robust Huber norm $\rho$ and residuals normalised by the depth variance $\sigma_{d_\mathbf{p}}$ — no feature detection or matching anywhere in the pipeline.
- **Semi-dense probabilistic depth**: every pixel with sufficient gradient (edges, intensity boundaries) carries an inverse-depth estimate plus variance, refined by per-pixel filtering over many small-baseline frames — denser than feature maps, far cheaper than fully dense (DTAM needed a GPU; LSD-SLAM runs on a CPU, even ported to smartphones).
- **Sim(3) tracking and loop closure**: since monocular SLAM drifts in scale, keyframes are linked by 7-DoF similarity transforms $\boldsymbol{\xi} \in \mathfrak{sim}(3)$; direct alignment between keyframes estimates relative *scale* along with pose, and loop closures correct pose *and* scale simultaneously in the pose graph.
- **Keyframe pose graph for scale**: the map is a graph of keyframes (each with its own semi-dense depth map) connected by $\mathrm{Sim}(3)$ constraints; appearance-based place recognition (FAB-MAP) proposes loop candidates that are then verified by direct alignment.
- **Scale-drift-aware formulation**: representing the world as similarity-connected local maps rather than one metric map is what lets the system traverse long trajectories where absolute scale is unobservable.

## Results & impact

- First direct monocular SLAM to run large-scale in real time on a CPU, mapping trajectories far beyond the desk-sized workspaces of PTAM/DTAM-era systems.
- Its $\mathrm{Sim}(3)$ pose graph became the standard treatment of monocular scale drift — ORB-SLAM adopted the same essential-graph-in-$\mathrm{Sim}(3)$ idea for its loop closing.
- Directly seeded DSO (same group, replacing the pose graph with windowed photometric BA) and influenced CNN-SLAM (which grafted learned depth onto the LSD-SLAM skeleton) and many hybrid systems.

## Why it matters for SLAM

LSD-SLAM proved that direct methods could be a serious, scalable alternative to feature-based SLAM: more of the image used, richer semi-dense maps, robustness where corners are scarce. Its two exports — photometric alignment as the tracking primitive, and $\mathrm{Sim}(3)$ graphs for monocular scale — are now standard vocabulary. Its semi-dense maps also foreshadowed today's demand for dense, usable reconstructions rather than sparse landmark clouds.

## Related

- [DTAM](dtam.md)
- [DSO](dso.md)
- [CNN-SLAM](cnn-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [LDSO](ldso.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
