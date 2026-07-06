# NodeSLAM

> Sucar 2020 · [Paper](https://arxiv.org/abs/2004.04485)

**One-line summary** — Object-level SLAM that represents each detected object as a compact learned shape code, jointly optimizing object shapes, object poses, and the camera trajectory in one unified optimization.

## Key ideas

- **Objects as first-class map elements**: Instead of points or surfels, the map contains objects, each with a 6-DoF pose $T_o$ and a latent shape code $\mathbf{z}_o$ decoded by a pre-trained generative shape model (a per-category occupancy/shape network trained as a VAE).
- **Rendering as the measurement model**: Camera poses, object poses, and shape codes are optimized jointly by minimizing the difference between observed depth and depth rendered from the current object estimates, with a prior term $\|\mathbf{z}_o\|^2$ keeping codes on the learned shape manifold.
- **Detection and association**: Per-frame instance masks (e.g., Mask R-CNN) are associated over time so each physical object accumulates observations from multiple views.
- **Shape completion**: Because shapes come from a learned prior, unobserved parts of an object are plausibly completed from partial views — the map contains watertight objects, not fragments.

## Why it matters for SLAM

NodeSLAM (with its contemporaries) established the modern object-level SLAM paradigm: learned shape priors as optimizable map variables inside a classical joint estimation. Complete object models with poses are exactly what robot manipulation needs (grasping, placement), unlike raw geometry. It is the conceptual bridge from code-based dense SLAM (CodeSLAM) to object-centric neural-field mapping (vMAP) and DeepSDF-based systems like DSP-SLAM.

## Related

- [CodeSLAM](codeslam.md) — the frame-level latent-code idea NodeSLAM lifts to objects
- [DSP-SLAM](../level-04-rgbd-slam/dsp-slam.md) — DeepSDF object priors on an ORB-SLAM2 backbone
- [vMAP](../level-03-monocular-slam/vmap.md) — object-level neural-field successor
- [Fusion++](../level-04-rgbd-slam/fusionpp.md) — object-level TSDF mapping without learned shape priors

[Back to Level 5](../README.md#level-5-applying-deep-learning)
