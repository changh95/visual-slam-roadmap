# Pop-up SLAM

> Yang 2016 · [Paper](https://arxiv.org/abs/1703.07334)

**One-line summary** — Integrates single-image plane detection into monocular SLAM, enabling dense semantic mapping in low-texture environments where point-feature methods fail.

## Key ideas

- **Pop-up 3D plane model**: ground and vertical planes are detected from a single image using geometric cues (vanishing points, line segments), producing a "pop-up" 3D model of planar surfaces without any depth sensor.
- **Plane-point joint optimisation**: detected planes enter bundle adjustment as constraints alongside point features; plane parameters $(\mathbf{n}, d)$ with $\mathbf{n}^\top \mathbf{X} = d$ constrain points lying on planes and reduce drift.
- **Semantic labels on structure**: each plane carries a label (ground, wall, object), so the map conveys scene understanding, not just geometry.
- **Dense maps for navigation**: combining sparse points with dense planar surfaces yields a 3D model actually usable for motion planning — something sparse point maps cannot offer.
- **Robustness where features fail**: in corridors and white-walled scenes where ORB-SLAM and LSD-SLAM break down, planar priors keep tracking and mapping alive.

## Why it matters for SLAM

Pop-up SLAM is an early example of injecting structural and semantic priors into geometric SLAM, showing that scene understanding and SLAM are mutually beneficial: single-image priors rescue SLAM in degenerate scenes, and SLAM gives the priors 3D consistency. It influenced later planar and structure-aware SLAM work and is a direct precursor to the same authors' object-level CubeSLAM.

## Related

- [ORB-SLAM](orb-slam.md)
- [PL-SLAM](pl-slam.md)
- [CubeSLAM](cubeslam.md)
- [LSD-SLAM](lsd-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
