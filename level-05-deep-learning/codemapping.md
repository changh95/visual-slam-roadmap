# CodeMapping

> Matsuki 2021 · [Paper](https://arxiv.org/abs/2107.08994)

**One-line summary** — CodeMapping (RA-L 2021) bolts a CodeSLAM-style learned dense mapper onto a reliable sparse SLAM system, predicting an uncertainty-aware dense depth map for every keyframe from the sparse system's outputs.

## Key ideas

- Sparse visual SLAM (e.g., ORB-SLAM3) gives accurate, robust trajectories and landmarks, but its maps are useless for obstacle avoidance or scene understanding; fully learned dense SLAM is fragile. CodeMapping decouples the two: classical tracking, learned dense mapping.
- A variational autoencoder predicts dense depth for each keyframe, conditioned not just on the image intensity but also on the **sparse depth** and **reprojection error** images produced by the SLAM system — the sparse geometry strongly constrains the learned depth.
- Depth is represented as a compact latent code (as in CodeSLAM), so the dense maps can be refined by multi-view optimization to improve consistency between overlapping keyframes.
- The mapper runs in a separate thread, loosely coupled and in parallel with the SLAM system, so dense mapping never destabilizes tracking.

## Why it matters for SLAM

CodeMapping is a clean example of the pragmatic "hybrid" design that dominates deployable systems: keep the battle-tested sparse front-end, add learning only where classical methods are weak (dense geometry). It carried the CodeSLAM/DeepFactors latent-code lineage into a production-shaped architecture, and the same pattern — sparse SLAM poses + learned dense depth, loosely coupled — reappears in systems like TANDEM and later monocular dense mapping work.

## Related

- [CodeSLAM](codeslam.md)
- [DeepFactors](deepfactors.md)
- [TANDEM](tandem.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
