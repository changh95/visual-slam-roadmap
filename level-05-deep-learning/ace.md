# ACE

> Brachmann 2023 · [Paper](https://arxiv.org/abs/2305.14059)

**One-line summary** — Accelerated Coordinate Encoding reduced scene coordinate regression training from hours to about 5 minutes per scene by splitting the network into a scene-agnostic pretrained encoder and a tiny scene-specific MLP head.

## Problem

Learning-based visual relocalizers exhibit leading pose accuracy, but require hours or days of training — and since training must happen again on each new scene, long training times made learning-based relocalization impractical for most applications despite its promise of high accuracy. The mapping phase, not the query phase, was the deployment bottleneck: nobody wants to wait overnight before an AR device can localize in a new room.

## Key ideas

- **Scene coordinate regression (SCR) recap**: a network maps image patches to 3D scene coordinates, giving dense 2D-3D correspondences; camera pose then comes from RANSAC + PnP. Accurate, but DSAC-style training took hours per scene because the whole network encoded the scene.
- **The obvious split, exploited properly**: a relocalization network can be divided into a scene-agnostic feature backbone and a scene-specific prediction head. The convolutional backbone is pretrained across many scenes and frozen at deployment; only the head must be learned per scene — the head *is* the map.
- **The less obvious trick — an MLP head**: using an MLP prediction head (rather than a convolutional one) means each feature vector can be treated as an independent training sample. Features from thousands of viewpoints can be shuffled into every batch, so each training iteration optimizes across the whole scene simultaneously — this decorrelation of gradients is what produces stable and extremely fast convergence.
- **Curriculum over a reprojection loss**: effective-but-slow end-to-end training through a robust pose solver is replaced by a curriculum over a simple reprojection loss, tightening the inlier threshold as training progresses — most of the benefit of task-level training at a fraction of the cost.
- **No privileged knowledge**: speedy training requires no depth maps and no 3D model — only RGB images with known poses, making mapping possible from a bare posed image sequence.

## Results & impact

ACE (CVPR 2023) achieves the same accuracy as much slower SCR predecessors in less than 5 minutes of per-scene training — up to 300x faster in mapping than state-of-the-art scene coordinate regression while keeping accuracy on par, matching DSAC*-level results on standard relocalization benchmarks (7-Scenes, Cambridge Landmarks). The resulting map is a small MLP: compact, implicit, and privacy-friendly (no images or point clouds stored). ACE made SCR practically deployable and spawned an active lineage — ACE Zero (poses no longer required), ACE-G (generalization without per-scene fine-tuning), ACE-SLAM (real-time SLAM with the network as the map).

## Why it matters for SLAM

ACE turned scene coordinate regression from a research curiosity into a deployable relocalization tool: a compact, implicit, privacy-friendly scene representation you can train on-site in minutes. It is the foundation of an active lineage — ACE Zero removes the need for known poses (reconstructing them from scratch), ACE-G targets generalization to new scenes without fine-tuning, and ACE-SLAM pushes the representation into a real-time SLAM loop where the network weights are the map.

## Related

- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE Zero](ace-zero.md)
- [ACE-G](ace-g.md)
- [ACE-SLAM](ace-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
