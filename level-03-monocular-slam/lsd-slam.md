# LSD-SLAM

> Engel 2014 · [Paper](https://cvg.cit.tum.de/research/vslam/lsdslam)

**One-line summary** — The first large-scale direct monocular SLAM: semi-dense depth maps tracked by photometric error minimisation on a CPU, with Sim(3) pose-graph loop closure to handle monocular scale drift.

## Key ideas

- **Direct image alignment**: camera pose is estimated by minimising the photometric error of high-gradient pixels between the current frame and the active keyframe,
  $$E(\boldsymbol{\xi}) = \sum_{\mathbf{p} \in \Omega} \rho\!\left( \frac{I_2(\pi(\mathbf{T}(\boldsymbol{\xi})\, \pi^{-1}(\mathbf{p}, d_{\mathbf{p}}))) - I_1(\mathbf{p})}{\sigma_{d_{\mathbf{p}}}} \right),$$
  with a robust Huber norm $\rho$ — no feature detection or matching anywhere in the pipeline.
- **Semi-dense probabilistic depth**: every pixel with sufficient gradient (edges, intensity boundaries) carries an inverse-depth estimate plus variance, refined by per-pixel filtering over many frames — denser than feature maps, far cheaper than fully dense (DTAM needed a GPU; LSD-SLAM runs on a CPU).
- **Sim(3) tracking and loop closure**: since monocular SLAM drifts in scale, keyframes are linked by 7-DoF similarity transforms; loop closures correct pose *and* scale simultaneously in the pose graph.
- **Large scale**: the keyframe pose graph lets the system map trajectories far beyond the small AR workspaces of PTAM/DTAM-era systems.

## Why it matters for SLAM

LSD-SLAM proved that direct methods could be a serious, scalable alternative to feature-based SLAM, and its Sim(3) pose graph became the standard treatment of monocular scale drift (adopted by ORB-SLAM's loop closing too). It is the direct ancestor of DSO and influenced CNN-SLAM and many hybrid systems; its semi-dense maps also foreshadowed today's demand for dense, usable reconstructions rather than sparse landmark clouds.

## Related

- [DTAM](dtam.md)
- [DSO](dso.md)
- [CNN-SLAM](cnn-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
