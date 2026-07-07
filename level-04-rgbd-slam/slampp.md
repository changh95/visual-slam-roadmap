# SLAM++

> Salas-Moreno 2013 · [Paper](https://ieeexplore.ieee.org/document/6619022)

**One-line summary** — The first object-oriented SLAM system, representing the environment as a graph of 6-DoF object poses rather than raw geometry, enabling compact and semantically meaningful maps.

## Problem

Before SLAM++, all SLAM systems represented the environment as raw geometry — point clouds, surfels, or voxel grids. These representations are memory-intensive and semantically opaque: they cannot distinguish a chair from a table, nor recognize that the same object has been revisited, so loop closure had to rely on appearance-based image retrieval or geometric overlap tests. Yet indoor environments are populated by a relatively small set of object categories that repeat constantly. If a pre-built model database covers the common objects in a scene, object recognition from depth data can replace both dense geometry *and* generic place recognition.

## Key ideas

- **Map = graph of objects**: the map is a set of recognized object instances (chairs, tables, monitors), each a node with a 6-DoF world pose $\mathbf{T}_{wo_k} \in \mathrm{SE}(3)$. This is compact — dozens of object poses instead of millions of voxels — and provides semantic identity for free.
- **Prior 3D model database with depth-based recognition**: known object CAD models are pre-registered and encoded by local 3D depth features sampled from their surfaces. A Hough-voting scheme using randomized decision trees matches features in each incoming depth frame to the database; the top hypothesis is verified and refined with point-to-plane ICP:
  $$\mathbf{T}_o^* = \arg\min_{\mathbf{T}_o} \sum_{i} \left(\mathbf{n}_i^\top (\mathbf{T}_o\,\mathbf{m}_i - \mathbf{d}_i)\right)^2$$
  where $\mathbf{m}_i$ are model points and $\mathbf{d}_i$ observed depth points.
- **Camera tracking against objects**: the camera pose is estimated by minimizing the discrepancy between predicted and ICP-measured camera-to-object transforms over all currently visible objects:
  $$\mathbf{T}_{wc}^* = \arg\min_{\mathbf{T}_{wc}} \sum_k \left\| \mathbf{T}_{wo_k}^{-1}\mathbf{T}_{wc} - \hat{\mathbf{T}}_{co_k} \right\|^2_{\mathbf{\Omega}_k}$$
- **Object-level loop closure**: re-detecting an already-mapped object instance from a new viewpoint directly yields a precise 6-DoF geometric constraint — much stronger than appearance-based place recognition — propagated through the joint camera-object pose graph (optimized with g2o).
- **Objects enable more than mapping**: because each node is a known model, the map immediately supports augmented reality overlays and physically meaningful edits (e.g. rearranging recognized furniture) — an early glimpse of maps as actionable scene descriptions.
- **Limitation**: requires a pre-built model database, so it cannot map previously unseen object categories; removing this assumption is exactly what motivated Fusion++ and its successors.

## Results & impact

SLAM++ (CVPR 2013) demonstrated real-time (>25 Hz) mapping of office and lab scenes containing 10-20 distinct object instances, with map storage roughly 100x smaller than an equivalent KinectFusion TSDF, successful loop closures across 360-degree revisits, and object pose accuracy of about 2 cm / 3 degrees after ICP refinement. It opened the research direction of object-level SLAM: its lineage runs directly through Fusion++ (objects discovered on the fly with Mask-RCNN), MoreFusion (multi-object 6D pose reasoning), NodeSLAM and DSP-SLAM (learned shape priors), and its core insight — that semantic entities make stronger, more compact map elements than raw geometry — resurfaces in modern 3D scene-graph systems.

## Why it matters for SLAM

SLAM++ opened the research direction of object-level SLAM, showing that maps built from semantic entities can be orders of magnitude more compact than raw geometry while enabling loop closure and scene understanding at the object level. Its lineage runs directly through Fusion++ (objects discovered on the fly with Mask-RCNN), MoreFusion (multi-object 6D pose reasoning), NodeSLAM, and DSP-SLAM (learned shape priors), and its ideas resurface in modern semantic scene-graph systems.

## Related

- [Fusion++](fusionpp.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [KinectFusion](kinectfusion.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
