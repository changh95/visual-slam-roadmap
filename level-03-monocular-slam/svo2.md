# SVO2

> Forster 2017 · [Paper](https://rpg.ifi.uzh.ch/svo2.html)

**One-line summary** — Extends the semi-direct visual odometry of SVO to multi-camera rigs with fisheye and omnidirectional lenses, adding a rigorous convergence analysis and a probabilistic depth filter that made semi-direct VO practical on real robots.

## Key ideas

- **Multi-camera support**: the sparse model-based image alignment is generalized to rigs of multiple cameras with arbitrary relative poses; the photometric error is minimized jointly across all cameras.
- **Generic camera models**: perspective, fisheye (equidistant), and omnidirectional projections are handled through a unified interface, so wide-FoV lenses can be used to maximize coverage.
- **Probabilistic depth estimation**: a Bayesian depth filter models the inverse-depth posterior as a Gaussian-uniform mixture, with a formal analysis of how many observations are needed for depth convergence as a function of baseline and noise.
- **Direct-method convergence analysis**: the convergence basin of direct alignment is characterized as a function of image blur, pixel displacement, and pyramid level, which guides the coarse-to-fine alignment strategy.
- **Edgelets + sparsity**: in addition to corners, edge pixels (edgelets) are tracked with 1D alignment along the edge normal; the method stays sparse, so it runs far faster than dense or semi-dense direct methods, with an optional bundle-adjustment backend for accuracy.

## Why it matters for SLAM

SVO2 turned the semi-direct paradigm introduced by SVO into a system deployable on real robotic platforms — especially micro aerial vehicles that carry several wide-angle cameras. Its convergence analysis gave direct methods a theoretical grounding that influenced later direct and semi-direct systems, and the depth-filter formulation became a common reference for probabilistic per-pixel depth estimation. It remains a go-to choice when you need very fast, lightweight odometry on embedded hardware.

## Related

- [SVO](svo.md) — the original semi-direct monocular VO this work extends
- [DSO](dso.md) — fully direct sparse odometry, a contemporary alternative
- [PTAM](ptam.md) — origin of the tracking/mapping split that SVO builds on
- [ROVIO](../level-06-vio-vins/rovio.md) — filter-based VIO also aimed at MAV platforms

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
