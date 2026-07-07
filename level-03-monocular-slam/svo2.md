# SVO2

> Forster 2017 · [Paper](https://rpg.ifi.uzh.ch/svo2.html)

**One-line summary** — Extends the semi-direct visual odometry of SVO to multi-camera rigs with fisheye and omnidirectional lenses, adding a rigorous convergence analysis and a probabilistic depth filter that made semi-direct VO practical on real robots.

## Problem

The original SVO operated with a single perspective camera, but real robotic platforms — especially micro aerial vehicles — carry multiple cameras with wide-angle or fisheye lenses to maximize field of view. Direct methods were also used largely on faith: there was little formal analysis of when and why photometric alignment converges. SVO2 (formally *"SVO: Semi-Direct Visual Odometry for Monocular and Multi-Camera Systems"*) generalizes the semi-direct approach to arbitrary multi-camera configurations while supplying that missing theoretical grounding.

## Key ideas

- **Semi-direct pipeline**: motion is first estimated by *sparse image alignment* — direct photometric alignment of small patches around tracked features — and then refined via feature alignment and reprojection-error optimization, combining the speed of direct alignment with the accuracy of feature-style refinement.
- **Multi-camera support**: the sparse model-based image alignment is generalized to rigs of multiple cameras with arbitrary fixed relative poses; the photometric error is minimized *jointly* across all cameras, so every camera that sees structure contributes to a single body-pose estimate.
- **Generic camera models**: perspective, fisheye (equidistant), and omnidirectional projections are handled through a unified projection interface, so wide-FoV lenses can be used directly, without undistorting images and throwing away peripheral coverage.
- **Probabilistic depth estimation**: each new feature's inverse depth is estimated recursively with a Bayesian depth filter whose posterior is modeled as a Gaussian–uniform mixture — Gaussian for good measurements, uniform for outliers. The paper gives a formal analysis of how many observations are needed for depth convergence as a function of baseline and noise.
- **Direct-method convergence analysis**: the convergence basin of direct alignment is characterized as a function of image blur, pixel displacement, and pyramid level, which justifies (and tunes) the coarse-to-fine alignment strategy used in practice.
- **Edgelets + sparsity**: in addition to corners, edge pixels (edgelets) are tracked with 1D alignment along the edge normal, adding constraints in corner-poor structured environments; the method stays sparse, so it runs far faster than dense or semi-dense direct methods, with an optional bundle-adjustment backend for accuracy.

## Results & impact

On the EuRoC MAV sequences, SVO2 achieves an ATE of roughly 5–10 cm in monocular and 3–6 cm in stereo configurations while running at 70+ FPS on a standard laptop; on custom MAV datasets with fisheye cameras it significantly outperforms the original SVO and ORB-SLAM. The system was widely deployed on commercial and research drones, and its edgelet tracking and depth-filter design influenced subsequent semi-direct and direct methods.

## Why it matters for SLAM

SVO2 turned the semi-direct paradigm introduced by SVO into a system deployable on real robotic platforms — especially micro aerial vehicles that carry several wide-angle cameras. Its convergence analysis gave direct methods a theoretical grounding that influenced later direct and semi-direct systems, and the depth-filter formulation became a common reference for probabilistic per-pixel depth estimation. It remains a go-to choice when you need very fast, lightweight odometry on embedded hardware.

## Related

- [SVO](svo.md) — the original semi-direct monocular VO this work extends
- [DSO](dso.md) — fully direct sparse odometry, a contemporary alternative
- [PTAM](ptam.md) — origin of the tracking/mapping split that SVO builds on
- [ROVIO](../level-06-vio-vins/rovio.md) — filter-based VIO also aimed at MAV platforms
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — the fisheye/omnidirectional models SVO2 supports

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
