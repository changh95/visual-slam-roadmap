# HF-Net

> Sarlin 2019 · [Paper](https://arxiv.org/abs/1812.03506)

**One-line summary** — Coarse-to-fine hierarchical localization: global retrieval narrows the search to candidate database images, local feature matching then yields a precise 6-DoF pose — with HF-Net computing both feature types in a single CNN forward pass.

## Problem

Robust and accurate visual localization is fundamental for autonomous driving, mobile robotics, and augmented reality, but it remains challenging at large scale and under significant appearance change (day-night, seasons). State-of-the-art methods at the time not only struggled in those conditions but were also too resource-intensive for real-time applications: matching a query against every database image is unaffordable, yet global retrieval alone gives only coarse, meter-level place hypotheses rather than a 6-DoF pose.

## Key ideas

- **Coarse-to-fine paradigm**: first perform global retrieval to obtain location hypotheses, and only later match local features within those candidate places — accuracy of local matching at the cost of retrieval, not exhaustive search.
- **Coarse step — global retrieval**: a NetVLAD global descriptor retrieves the top-$k$ candidate database images for the query.
- **Fine step — local matching + PnP**: SuperPoint local features are matched against the candidates, and the resulting 2D-3D correspondences (via an SfM model) feed PnP + RANSAC for the final 6-DoF pose.
- **HF-Net — one network, both feature types**: a single monolithic CNN simultaneously predicts local features and global descriptors; it is trained by multi-task distillation from NetVLAD and SuperPoint teachers, so the whole front-end costs one forward pass.
- **Runtime by design**: the hierarchical structure itself yields significant runtime savings — most of the database is never touched by expensive local matching — making the system suitable for real-time operation on robots and mobile devices.
- **Learned descriptors carry the robustness**: the localization robustness across large appearance variations comes from the learned global and local features, not from any appearance-specific engineering.

## Results & impact

- Set a new state of the art on two challenging large-scale localization benchmarks with severe appearance change — Aachen Day-Night and RobotCar Seasons — while running in real time.
- The companion `hloc` toolbox became the standard pipeline for the Long-Term Visual Localization benchmarks, with SuperPoint + SuperGlue via hloc the dominant baseline for indoor and outdoor localization.
- The coarse-to-fine recipe became the universal template for relocalization: retrieve with a global descriptor, verify and refine with local matches.

## Why it matters for SLAM

The coarse-to-fine paradigm HF-Net established is now the universal design for relocalization and loop-closure verification in SLAM: essentially every modern system retrieves places with a global descriptor and confirms them with local feature matching. Its companion toolbox hloc became the standard visual localization pipeline used in competitions and research, and the same recipe powers large-scale AR localization services.

## Related

- [hloc](hloc.md) — the open-source toolbox implementing this hierarchical pipeline
- [NetVLAD](netvlad.md) — the global retrieval descriptor
- [SuperPoint](superpoint.md) — the local features used for fine matching
- [SuperGlue](superglue.md) — the learned matcher that later upgraded the fine stage
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the coarse retrieval problem in general

[Back to Level 5](../README.md#level-5-applying-deep-learning)
