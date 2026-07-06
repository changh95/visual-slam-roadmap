# HF-Net

> Sarlin 2019 · [Paper](https://arxiv.org/abs/1812.03506)

**One-line summary** — Coarse-to-fine hierarchical localization: global retrieval narrows the search to candidate database images, local feature matching then yields a precise 6-DoF pose — with HF-Net computing both feature types in a single CNN forward pass.

## Key ideas

- **The scale/accuracy dilemma**: large-scale localization cannot afford to match a query against every database image, yet global retrieval alone only gives coarse, meter-level place hypotheses. The hierarchical answer: retrieve coarsely, then match finely.
- **Coarse step — global retrieval**: a NetVLAD global descriptor retrieves the top-$k$ candidate database images for the query.
- **Fine step — local matching + PnP**: SuperPoint local features are matched against the candidates, and the resulting 2D-3D correspondences feed PnP + RANSAC for the final 6-DoF pose.
- **HF-Net (Hierarchical Features Network)**: a single multi-task CNN distilled from NetVLAD and SuperPoint teachers outputs the global descriptor and the local keypoints/descriptors in one forward pass, making the whole pipeline cheap enough for mobile robots.
- State-of-the-art robustness on long-term localization benchmarks with severe day-night and seasonal appearance change (Aachen Day-Night, RobotCar Seasons).

## Why it matters for SLAM

The coarse-to-fine paradigm HF-Net established is now the universal design for relocalization and loop-closure verification in SLAM: essentially every modern system retrieves places with a global descriptor and confirms them with local feature matching. Its companion toolbox hloc became the standard visual localization pipeline used in competitions and research, and the same recipe powers large-scale AR localization services.

## Related

- [hloc](hloc.md) — the open-source toolbox implementing this hierarchical pipeline
- [NetVLAD](netvlad.md) — the global retrieval descriptor
- [SuperPoint](superpoint.md) — the local features used for fine matching
- [SuperGlue](superglue.md) — the learned matcher that later upgraded the fine stage
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the coarse retrieval problem in general

[Back to Level 5](../README.md#level-5-applying-deep-learning)
