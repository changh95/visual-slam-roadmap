# MID-Fusion

> Xu 2019 · [Paper](https://arxiv.org/abs/1812.07976)

**One-line summary** — An octree-based, object-level, multi-instance dynamic RGB-D SLAM system that builds a separate volumetric (TSDF) model for each object while staying robust to scene motion.

## Key ideas

- **Multi-instance object-level mapping**: the scene is represented as a background volume plus one octree-based TSDF volume per detected object instance, giving watertight per-object surface models rather than a monolithic map.
- **Octree-based volumetric representation**: adaptive octrees keep the memory cost of maintaining many object volumes manageable, compared to dense voxel grids.
- **Dynamic robustness**: camera tracking excludes measurements on moving objects, while each moving object's 6-DoF pose is tracked separately, so dynamics improve the map instead of corrupting ego-motion.
- **Instance segmentation for association**: learned instance masks (Mask R-CNN style) identify objects and associate measurements to the correct object model across frames.
- **Joint use of geometry, photometry, and semantics**: object tracking and reconstruction combine depth, colour, and mask cues for robustness when any single cue is weak.

## Why it matters for SLAM

Together with MaskFusion, MID-Fusion defined object-level dynamic SLAM: maps composed of individually tracked, reconstructed object instances. Its volumetric per-object models (versus MaskFusion's surfels) made it a template for later manipulation-oriented systems, where a robot needs both the pose and the complete surface of each object it might grasp. The line continues through VDO-SLAM and DynaSLAM II toward today's dynamic scene understanding.

## Related

- [MaskFusion](maskfusion.md)
- [VDO-SLAM](vdo-slam.md)
- [DynaSLAM II](dynaslam-ii.md)
- [Fusion++](../level-04-rgbd-slam/fusionpp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
