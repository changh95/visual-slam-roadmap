# DynamicFusion

> Newcombe 2015 · [Paper](https://ieeexplore.ieee.org/document/7298631)

**One-line summary** — Extended KinectFusion to non-rigid, deformable scenes by estimating a dense volumetric 6D warp field that maps a canonical TSDF model to each live frame in real time.

## Key ideas

- **Canonical TSDF model**: a single reference volume accumulates all observations after undoing the scene's deformation, so a clean, increasingly detailed model emerges even while the subject moves.
- **6D motion (warp) field**: deformation is represented by sparse nodes, each carrying a full 6-DoF rigid transform $(\mathbf{R}_k, \mathbf{t}_k)$ and an influence radius; any canonical point is warped to the live frame by dual quaternion blending of nearby node transforms.
- **Joint data + regularization optimization**: each frame, the warp field is estimated by minimizing a point-to-plane data term aligning the warped model to the live depth, plus an as-rigid-as-possible regularizer that keeps neighboring nodes moving consistently.
- **Deformable scene fusion**: after solving the warp, the live depth is warped back into canonical space and fused with the standard TSDF running average — deformation and reconstruction reinforce each other.
- **Real-time non-rigid capture**: demonstrated live reconstruction of moving hands, faces, and upper bodies from a single depth camera.

## Why it matters for SLAM

DynamicFusion (CVPR 2015 Best Paper) broke the static-scene assumption that underpinned all prior dense fusion systems, showing that per-point rigid motion fields can be estimated fast enough for real-time SLAM-style pipelines. Its canonical-model + embedded-deformation-graph paradigm became the template for non-rigid fusion (VolumeDeform, KillingFusion, SurfelWarp) and informs how modern dynamic-scene SLAM systems separate camera motion from object motion.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [MID-Fusion](../level-03-monocular-slam/mid-fusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
