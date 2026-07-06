# PointFusion / DenseFusion

> Xu 2018 · [Paper](https://arxiv.org/abs/1711.10871) / Wang 2019 · [Paper](https://arxiv.org/abs/1901.04780)

**One-line summary** — Two influential RGB-D object pose networks that fuse image features with point-cloud features per point, forming the learned object front-end that object-level SLAM systems build on.

## Key ideas

- **Heterogeneous feature fusion**: both methods process the RGB crop with a CNN and the depth-derived 3D points with a PointNet-style network, then combine the two modalities instead of collapsing depth into an extra image channel.
- **PointFusion (Xu 2018)**: fuses global image features with per-point geometric features to regress 3D bounding boxes / object pose hypotheses, with each input point predicting box corner offsets plus a confidence — an early, sensor-agnostic recipe for image + point cloud fusion.
- **DenseFusion (Wang 2019)**: performs the fusion *densely* — each point gets a per-pixel appearance feature and a geometric feature, plus a global feature — and predicts a 6-DoF pose with per-point confidence, followed by a learned iterative refinement module.
- **Robustness to occlusion and clutter**: per-point predictions with confidence weighting let a partially occluded object still be posed from its visible fragment, a key requirement for tabletop manipulation scenes.
- **Object front-end, not a SLAM system**: these networks estimate poses of known object instances per frame; SLAM systems consume them as measurements for object nodes in a map or factor graph.

## Why it matters for SLAM

Object-level SLAM needs a reliable way to turn raw RGB-D into 6-DoF object observations, and the PointFusion/DenseFusion line established the standard learned architecture for that role: dense image-geometry feature fusion with confidence-aware pose regression. Systems like MoreFusion use exactly this style of volumetric/learned pose prediction as initialization for multi-view, collision-aware refinement, and any modern object-SLAM pipeline is likely to feature a descendant of these networks in its front-end.

## Related

- [Fusion++](fusionpp.md)
- [MoreFusion](morefusion.md)
- [SLAM++](slampp.md)
- [DSP-SLAM](dsp-slam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
