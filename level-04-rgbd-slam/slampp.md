# SLAM++

> Salas-Moreno 2013 · [Paper](https://ieeexplore.ieee.org/document/6619022)

**One-line summary** — The first object-oriented SLAM system, representing the environment as a graph of 6-DoF object poses rather than raw geometry, enabling compact and semantically meaningful maps.

## Key ideas

- **Map = graph of objects**: instead of millions of voxels or surfels, the map is a set of recognized object instances (chairs, tables, monitors), each a node with a 6-DoF pose. This is compact and gives semantic identity for free.
- **Prior 3D model database**: known object CAD models are pre-registered; a Hough-voting scheme over local 3D depth features recognizes them in incoming depth frames, with ICP refinement of the object pose.
- **Camera tracking against objects**: the camera pose is estimated by minimizing the error between predicted and observed camera-to-object transforms over all currently visible objects.
- **Object-level loop closure**: re-detecting an already-mapped object instance from a new viewpoint directly yields a precise 6-DoF geometric constraint — much stronger than appearance-based place recognition — which is propagated through a pose graph (g2o).
- **Limitation**: requires a pre-built model database, so it cannot map previously unseen object categories; removing this assumption motivated Fusion++ and its successors.

## Why it matters for SLAM

SLAM++ opened the research direction of object-level SLAM, showing that maps built from semantic entities can be orders of magnitude more compact than raw geometry while enabling loop closure and scene understanding at the object level. Its lineage runs directly through Fusion++ (objects discovered on the fly with Mask-RCNN), MoreFusion (multi-object 6D pose reasoning), NodeSLAM, and DSP-SLAM (learned shape priors), and its ideas resurface in modern semantic scene-graph systems.

## Related

- [Fusion++](fusionpp.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [KinectFusion](kinectfusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
