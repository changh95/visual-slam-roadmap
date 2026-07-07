# NodeSLAM

> Sucar 2020 · [Paper](https://arxiv.org/abs/2004.04485)

**One-line summary** — Object-level SLAM that represents each detected object as a compact learned shape code, jointly optimizing object shapes, object poses, and the camera trajectory in one unified optimization.

## Problem

The choice of scene representation determines both the inference algorithms a SLAM system needs and the applications it enables. Traditional maps of points or surfels carry no notion of object identity, pose, or complete shape — yet robots need exactly those to grasp a mug, place an item, or avoid a chair. CodeSLAM had shown that learned latent codes can act as compact optimizable map variables at the *frame* level; NodeSLAM lifts the idea to the *object* level, asking for principled full object shape inference from one or more RGB-D images inside a SLAM-style joint estimation.

## Key ideas

- **Objects as first-class map elements**: The map contains objects, each with a 6-DoF pose $T_o$ and a latent shape code $\mathbf{z}_o$ decoded by a pre-trained multi-class generative shape model (a per-category occupancy network trained as a variational auto-encoder). The code captures shape; the pose captures placement.
- **Probabilistic, differentiable rendering as the measurement model**: NodeSLAM's novel rendering engine renders expected depth from the current object estimates, and the optimizer minimizes the discrepancy against observed depth:
  $$\mathcal{L} = \sum_{c,\,o}\ \sum_{p \in M_o} \big|D_c(p) - \hat{D}(T_c, T_o, \mathbf{z}_o, p)\big| \;+\; \lambda \|\mathbf{z}_o\|^2$$
  over camera poses $\{T_c\}$, object poses $\{T_o\}$, and shape codes $\{\mathbf{z}_o\}$ jointly — rendering is the bridge that lets image-space evidence update latent shape.
- **Shape prior regularization**: The $\|\mathbf{z}_o\|^2$ term keeps codes on the learned shape manifold, preventing degenerate shapes from noisy or partial observations.
- **Detection and association**: Per-frame instance masks (e.g., Mask R-CNN) are associated over time so each physical object accumulates observations from multiple views, and inference works from one or several RGB-D images.
- **Shape completion**: Because shapes come from a learned generative prior, unobserved parts of an object are plausibly completed from partial views — the map contains watertight objects, not fragments.

## Results & impact

NodeSLAM demonstrated accurate and robust 3D object reconstruction with applications including robot grasping and placing, augmented reality, and — as the abstract states — the first object-level SLAM system capable of optimizing object poses and shapes jointly with the camera trajectory. Object poses and completed shapes are recovered from as little as a single partial RGB-D view, with additional views refining the estimates.

## Why it matters for SLAM

NodeSLAM (with its contemporaries) established the modern object-level SLAM paradigm: learned shape priors as optimizable map variables inside a classical joint estimation. Complete object models with poses are exactly what robot manipulation needs (grasping, placement), unlike raw geometry. It is the conceptual bridge from code-based dense SLAM (CodeSLAM) to object-centric neural-field mapping (vMAP) and DeepSDF-based systems like DSP-SLAM.

## Related

- [CodeSLAM](codeslam.md) — the frame-level latent-code idea NodeSLAM lifts to objects
- [DSP-SLAM](../level-04-rgbd-slam/dsp-slam.md) — DeepSDF object priors on an ORB-SLAM2 backbone
- [vMAP](../level-03-monocular-slam/vmap.md) — object-level neural-field successor
- [Fusion++](../level-04-rgbd-slam/fusionpp.md) — object-level TSDF mapping without learned shape priors
- [MoreFusion](../level-04-rgbd-slam/morefusion.md) — object-level fusion for manipulation from the same lab era

[Back to Level 5](../README.md#level-5-applying-deep-learning)
