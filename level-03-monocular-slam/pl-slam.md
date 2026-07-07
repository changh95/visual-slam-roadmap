# PL-SLAM

> Pumarola 2017 · [Paper](https://www.albertpumarola.com/research/pl-slam/index.html)

**One-line summary** — Extends ORB-SLAM with line segment features alongside points, enabling robust monocular SLAM in structured, low-texture man-made environments.

## Problem

Point-based SLAM struggles in man-made environments with repetitive textures, few corners, or strong structural patterns — long corridors, office walls — exactly the places robots operate. Line segments are abundant in such environments and provide strong geometric constraints, but exploiting them requires solving line representation, matching, triangulation, and optimisation jointly with point features, none of which the point-based pipeline provides for free.

## Key ideas

- **Points and lines are complementary**: points anchor the estimate where texture exists; lines carry it through low-texture, structured regions. PL-SLAM keeps the full ORB-SLAM point pipeline and *adds* a parallel line pipeline rather than replacing anything.
- **Line detection and matching**: the LSD (Line Segment Detector) extracts segments, described with the LBD binary descriptor for efficient Hamming-distance matching — the line-world analogue of ORB.
- **Plücker line parameterisation**: 3D lines are represented in Plücker coordinates $\mathbf{L} = (\mathbf{d}, \mathbf{m})$ (direction and moment), with an orthonormal representation $(\mathbf{U}, \mathbf{W}) \in SO(3) \times SO(2)$ for minimal 4-DoF optimisation — a 3D line has only 4 degrees of freedom, and optimising the raw 6-vector would violate its internal constraints.
- **Joint point-line bundle adjustment**: BA minimises point reprojection error together with a line error measured as the distance from the projected 3D line $\mathbf{l}$ to the detected 2D segment's endpoints, $e_{\text{line}} = d(\mathbf{l}, \mathbf{s}) + d(\mathbf{l}, \mathbf{e})$ — endpoint-to-line distance is used because endpoints themselves are unstable across views.
- **Line triangulation**: a 3D line is triangulated from two views by intersecting (finding the Plücker line closest to) the two back-projected planes through the detected segments.

## Results & impact

In low-texture and corridor sequences, PL-SLAM substantially reduces tracking failures compared to point-only ORB-SLAM while achieving comparable or better trajectory accuracy. It demonstrated that lines pay for themselves precisely in the scenes where points fail, without hurting performance elsewhere.

## Why it matters for SLAM

PL-SLAM showed that adding line features meaningfully reduces tracking failures in low-texture, structured indoor scenes while keeping accuracy competitive with point-only ORB-SLAM. Its Plücker/orthonormal line machinery is the technical foundation reused by later point-line systems, including line-assisted VIO systems such as AirVO.

## Related

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [CubeSLAM](cubeslam.md)
- [AirVO](../level-06-vio-vins/airvo.md)
- [Edge detector](../level-01-beginner/edge-detector.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
