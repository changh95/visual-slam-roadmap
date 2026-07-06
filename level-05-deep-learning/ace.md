# ACE

> Brachmann 2023 · [Paper](https://arxiv.org/abs/2305.14059)

**One-line summary** — Accelerated Coordinate Encoding reduced scene coordinate regression training from hours to about 5 minutes per scene by splitting the network into a scene-agnostic pretrained encoder and a tiny scene-specific MLP head.

## Key ideas

- **Scene coordinate regression (SCR) recap**: a network maps image patches to 3D scene coordinates, giving dense 2D-3D correspondences; camera pose then comes from RANSAC + PnP. Accurate, but DSAC-style training took hours per scene.
- **Shared, frozen encoder**: a convolutional encoder pretrained across many scenes extracts scene-agnostic geometric features once; it is never retrained at deployment.
- **Tiny scene-specific head**: only a small MLP mapping encoder features to scene coordinates is trained per scene — this is the entire "map" that must be learned for a new environment.
- **Training from RGB + poses only**: the head is optimized with a reprojection loss through a differentiable pose estimation pipeline, requiring no depth, mesh, or SfM point cloud.
- **~5-minute mapping**: per-scene training completes in minutes on a single GPU while matching the accuracy of much slower SCR predecessors on standard relocalization benchmarks — making SCR practical for real deployment, where mapping time matters as much as query accuracy.

## Why it matters for SLAM

ACE turned scene coordinate regression from a research curiosity into a deployable relocalization tool: a compact, implicit, privacy-friendly scene representation you can train on-site in minutes. It is the foundation of an active lineage — ACE Zero removes the need for known poses (reconstructing them from scratch), ACE-G targets generalization to new scenes without fine-tuning, and ACE-SLAM pushes the representation into a real-time SLAM loop where the network weights are the map.

## Related

- [DSAC](dsac.md)
- [DSAC\*](dsac-star.md)
- [ACE Zero](ace-zero.md)
- [ACE-G](ace-g.md)
- [ACE-SLAM](ace-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
