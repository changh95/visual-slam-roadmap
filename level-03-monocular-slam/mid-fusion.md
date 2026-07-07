# MID-Fusion

> Xu 2019 · [Paper](https://arxiv.org/abs/1812.07976)

**One-line summary** — An octree-based, object-level, multi-instance dynamic RGB-D SLAM system that builds a separate volumetric (TSDF) model for each object while staying robust to scene motion.

## Problem

Static-world SLAM treats moving objects as outliers, so in dynamic environments it either loses tracking or corrupts its map — and even when it survives, the map contains no per-object information a robot could act on. MaskFusion had shown surfel-based object-level dynamic SLAM, but surfels are unstructured and do not directly give the watertight surface models needed for manipulation and physical reasoning. MID-Fusion targets a *volumetric* object-level dynamic SLAM: robust camera tracking in dynamic scenes while "continuously estimat[ing] geometric, semantic, and motion properties for arbitrary objects" (abstract).

## Key ideas

- **Multi-instance object-level mapping**: the scene is represented as a background volume plus one octree-based TSDF volume per detected object instance, giving dense per-object surface models rather than a monolithic map — colour, depth, semantic labels, and foreground probabilities are all fused *into each object model*.
- **Octree-based volumetric representation**: adaptive octrees keep the memory cost of maintaining many simultaneous object volumes manageable compared to dense voxel grids, which is what makes "one TSDF per object" affordable.
- **Segmentation refined by geometry and motion**: per-frame instance segmentation (Mask R-CNN style) detects objects, and mask boundaries are refined using geometric and motion information — learned masks are rarely pixel-accurate at depth boundaries where fusion errors would accumulate.
- **Separate camera and object tracking**: the camera pose is robustly tracked against the static scene while each moving object's 6-DoF pose is estimated with an object-oriented tracking method; segmented measurements are associated to existing models based on the estimated camera and object poses.
- **Joint use of geometry, photometry, and semantics**: tracking and fusion combine depth, colour, and mask cues, so the system degrades gracefully when any single cue is weak (textureless objects, depth shadows, missed detections).

## Results & impact

- Per the abstract, it is "the first system to generate an object-level dynamic volumetric map from a single RGB-D camera, which can be used directly for robotic tasks".
- Runs at 2-3 Hz on a CPU, excluding the instance-segmentation network (abstract) — object-level dynamic volumetric SLAM was computationally heavy at the time.
- Demonstrated quantitatively and qualitatively on both synthetic and real-world sequences; its per-object TSDF design became a template for manipulation-oriented systems where the robot needs each object's complete surface, and the line continues through VDO-SLAM and DynaSLAM II.

## Why it matters for SLAM

Together with MaskFusion, MID-Fusion defined object-level dynamic SLAM: maps composed of individually tracked, reconstructed object instances. The volumetric choice matters — a watertight TSDF per object supports grasp planning, collision checking, and physical reasoning in a way surfel clouds do not. It marks the point where dynamic SLAM stopped being only about *surviving* motion and started being about *modelling* it.

## Related

- [MaskFusion](maskfusion.md)
- [VDO-SLAM](vdo-slam.md)
- [DynaSLAM II](dynaslam-ii.md)
- [Fusion++](../level-04-rgbd-slam/fusionpp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
