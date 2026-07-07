# MaskFusion

> Rünz 2018 · [Paper](https://arxiv.org/abs/1804.09194)

**One-line summary** — A real-time RGB-D SLAM system that recognises, segments, tracks, and reconstructs multiple *moving* objects as individual semantic models instead of treating the world as one rigid scene.

## Problem

Traditional SLAM systems "output a purely geometric map of a static scene" (abstract): anything that moves is treated as noise to be filtered out, and the map says nothing about what objects it contains. Earlier recognition-based SLAM (e.g., SLAM++) could track objects but only ones with pre-scanned 3D models, and semantics-enabled dense SLAM (SemanticFusion) labelled voxels rather than maintaining object instances. MaskFusion targets the combination: object-aware, semantic, *and* dynamic — recognising, segmenting, and reconstructing multiple independently moving objects without known models, in real time.

## Key ideas

- **Object-level dynamic SLAM**: rather than a single static map, the scene is decomposed into a background model plus a set of object models, each represented with surfels (the ElasticFusion representation) and tracked with its own 6-DoF pose over time — objects keep being tracked and fused "even when they move independently from the camera" (abstract).
- **Instance-level, not voxel-level, semantics**: image-based instance segmentation (Mask R-CNN) creates semantic object masks that seed an *object-level* world representation; the abstract explicitly contrasts this with "recent semantics enabled SLAM systems that perform voxel-level semantic segmentation" — here the map's unit is the object, with one label per model.
- **Semantic + geometric segmentation**: Mask R-CNN is too slow (and too imprecise at boundaries) to run per frame, so a fast geometric segmentation based on depth discontinuities and surface-normal cues refines mask edges and propagates masks between the sparser semantic detections.
- **No known object models required**: unlike previous recognition-based SLAM, MaskFusion "does not require known models of the objects it can recognize" (abstract) — each object's geometry is reconstructed on the fly from the masked measurements, so it handles novel instances of any detectable class.
- **Dynamic-aware camera tracking**: ego-motion is estimated against the static background model, so moving objects do not corrupt camera tracking — and conversely each object's motion is estimated relative to the camera.

## Results & impact

- Runs in real time as an RGB-D camera scans a cluttered scene, maintaining multiple independent motions simultaneously (abstract).
- The paper demonstrates augmented-reality applications exploiting the map's unique properties — "instance-aware, semantic and dynamic" (abstract) — e.g., effects attached to specific moving objects.
- Together with MID-Fusion it established the object-level dynamic SLAM template that VDO-SLAM and DynaSLAM II later formalised with motion estimation in the optimisation backend.

## Why it matters for SLAM

MaskFusion is a landmark in the shift from "SLAM in a static world" to dynamic, object-aware SLAM: it showed that per-object dense models with semantic labels can be maintained in real time. This line of work underpins robot manipulation and AR scenarios where the interesting parts of the scene are precisely the things that move — a map that deletes moving objects is useless to a robot that must grasp one.

## Related

- [MID-Fusion](mid-fusion.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md)
- [SLAM++](../level-04-rgbd-slam/slampp.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
