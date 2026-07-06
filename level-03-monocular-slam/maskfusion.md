# MaskFusion

> Rünz 2018 · [Paper](https://arxiv.org/abs/1804.09194)

**One-line summary** — A real-time RGB-D SLAM system that recognises, segments, tracks, and reconstructs multiple *moving* objects as individual semantic models instead of treating the world as one rigid scene.

## Key ideas

- **Object-level dynamic SLAM**: rather than a single static map, the scene is decomposed into a background model plus a set of object models, each represented with surfels and tracked with its own 6-DoF pose over time.
- **Semantic + geometric segmentation**: Mask R-CNN provides instance masks with semantic labels, but it is too slow and imprecise at boundaries for every frame; a fast geometric segmentation (based on depth discontinuities and surface normals) refines and propagates masks between the sparser semantic detections.
- **Independent tracking of moving objects**: objects (e.g., a cup being handed over) keep being tracked and fused while they move, instead of being discarded as outliers as static-world SLAM systems must do.
- **Dynamic-aware camera tracking**: the camera pose is estimated against the static background, so moving objects do not corrupt ego-motion estimation.

## Why it matters for SLAM

MaskFusion is a landmark in the shift from "SLAM in a static world" to dynamic, object-aware SLAM: it showed that per-object dense models with semantic labels can be maintained in real time. This line of work — continued by MID-Fusion, VDO-SLAM, and DynaSLAM II — underpins robot manipulation and AR scenarios where the interesting parts of the scene are precisely the things that move.

## Related

- [MID-Fusion](mid-fusion.md)
- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
