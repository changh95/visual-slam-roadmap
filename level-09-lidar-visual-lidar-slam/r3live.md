# R3LIVE

> Lin 2022 · [Paper](https://arxiv.org/abs/2109.07982)

**One-line summary** — R3LIVE fuses LiDAR, inertial, and visual sensing so that LiDAR-inertial odometry builds the geometry of the global map while a direct visual-inertial subsystem paints its texture, producing dense RGB-colored point clouds in real time.

## Problem

LiDAR SLAM produces accurate 3D geometry but colorless maps of limited use for inspection, visualization, and downstream 3D applications; camera-based SLAM provides appearance but weaker geometric accuracy and scale. R3LIVE aims to get both at once — robust, accurate state estimation *and* a dense RGB-colored map — by giving each sensor the job it is best at and coupling them tightly through one shared map.

## Key ideas

- **LIO + VIO with a clean division of labor**: the LIO subsystem (based on FAST-LIO) takes the LiDAR and inertial measurements and reconstructs the geometric structure of the global map — the positions of its 3D points — while the VIO subsystem uses the visual-inertial data to render the map's texture, i.e., the color of those points.
- **Direct frame-to-map photometric fusion**: instead of extracting and matching visual features, the VIO fuses the visual data by minimizing the photometric error between the current image and the colors stored on visible map points,

  $$\mathcal{L}_{\text{photo}} = \sum_i \Big( I\big(\pi(\mathbf{T}^{-1}\mathbf{P}_i)\big) - C_i \Big)^2,$$

  where $\mathbf{P}_i$ is a 3D map point and $C_i$ its stored color — tightly coupling the camera to the LiDAR-built map.
- **Continuous color refinement**: each new image updates the colors of the map points it observes, blending new observations into the stored color, so the texture stays consistent as lighting and viewpoints change.
- **A mapping device, not just an odometry**: the output is a dense, precise, RGB-colored 3D map directly useful for surveying and mapping, and the release includes offline utilities for reconstructing and texturing meshes to bridge toward simulators, video games, and other 3D applications.
- **Careful engineering lineage**: developed from the authors' earlier R2LIVE with a redesigned architecture and implementation.

## Results & impact

Experiments show the system achieves more robustness and higher accuracy in state estimation than contemporary counterparts, while reconstructing dense, precise, RGB-colored 3D maps in real time. R3LIVE is fully open source — code, software utilities, and even the mechanical design of the sensor device — which helped make it a popular starting point for colorized LiDAR mapping and a reference design for the "geometry from LiDAR, texture from camera" pattern.

## Why it matters for SLAM

R3LIVE established the "geometry from LiDAR, texture from camera" pattern for LVI systems and demonstrated that direct photometric alignment against a LiDAR map is a practical, real-time alternative to feature-based visual fusion. It is the bridge between state estimation and colorized 3D reconstruction — digital twins, inspection, AR — and the direct ancestor of R3LIVE++ (radiance mapping) and a close sibling of FAST-LIVO within the HKU MARS lineage.

## Related

- [FAST-LIO2](fast-lio2.md) — the LiDAR-inertial core this line of work builds on
- [R3LIVE++](r3livepp.md) — successor with radiance maps and photometric calibration
- [FAST-LIVO](fast-livo.md) — sibling system where vision also feeds pose estimation via patches
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the fusion category
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the photometric fusion principle

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
