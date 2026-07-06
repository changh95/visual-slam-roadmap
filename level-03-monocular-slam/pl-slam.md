# PL-SLAM

> Pumarola 2017 · [Paper](https://www.albertpumarola.com/research/pl-slam/index.html)

**One-line summary** — Extends ORB-SLAM with line segment features alongside points, enabling robust monocular SLAM in structured, low-texture man-made environments.

## Key ideas

- **Points and lines are complementary**: point-based SLAM struggles in corridors, office walls, and repetitive textures, exactly where line segments are abundant and provide strong geometric constraints.
- **Line detection and matching**: the LSD line segment detector extracts lines, described with the LBD binary descriptor for efficient Hamming-distance matching.
- **Plücker line parameterisation**: 3D lines are represented in Plücker coordinates $\mathbf{L} = (\mathbf{d}, \mathbf{m})$ with an orthonormal representation for minimal 4-DoF optimisation — a parameterisation that became standard in line-based SLAM.
- **Joint point-line bundle adjustment**: BA minimises point reprojection error together with a line error measured as the distance from the projected 3D line to the detected 2D segment's endpoints.
- **Line triangulation**: 3D lines are triangulated from two views by intersecting the back-projected planes.

## Why it matters for SLAM

PL-SLAM showed that adding line features meaningfully reduces tracking failures in low-texture, structured indoor scenes while keeping accuracy competitive with point-only ORB-SLAM. Its Plücker/orthonormal line machinery is the technical foundation reused by later point-line systems, including line-assisted VIO systems such as AirVO.

## Related

- [ORB-SLAM](orb-slam.md)
- [Pop-up SLAM](pop-up-slam.md)
- [CubeSLAM](cubeslam.md)
- [AirVO](../level-06-vio-vins/airvo.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
