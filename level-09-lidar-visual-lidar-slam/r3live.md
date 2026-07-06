# R3LIVE

> Lin 2022 · [Paper](https://arxiv.org/abs/2109.07982)

**One-line summary** — R3LIVE fuses LiDAR, inertial, and visual sensing so that LiDAR-inertial odometry builds the geometry of the global map while a direct visual-inertial subsystem paints its texture, producing dense RGB-colored point clouds in real time.

## Key ideas

- **LIO + VIO with a clean division of labor**: the LIO subsystem (based on FAST-LIO) reconstructs the geometric structure — the positions of 3D map points — while the VIO subsystem recovers their radiance/color from camera images.
- **Direct frame-to-map photometric fusion**: instead of extracting and matching visual features, the VIO minimizes the photometric error between the current image and the colors stored on visible map points, tightly coupling the camera to the LiDAR-built map.
- Developed from the authors' earlier R2LIVE with careful architecture and engineering; experiments show improved robustness and accuracy in state estimation over contemporary counterparts.
- **A mapping device, not just an odometry**: the output is a dense, precise, RGB-colored 3D map directly useful for surveying and mapping, and the release includes offline utilities for reconstructing and texturing meshes to bridge toward simulators, games, and other 3D applications.
- Fully open source, including code, utilities, and even the mechanical design of the sensor rig.

## Why it matters for SLAM

R3LIVE established the "geometry from LiDAR, texture from camera" pattern for LVI systems and demonstrated that direct photometric alignment against a LiDAR map is a practical, real-time alternative to feature-based visual fusion. It is the bridge between state estimation and colorized 3D reconstruction — digital twins, inspection, AR — and the direct ancestor of R3LIVE++ (radiance mapping) and a close sibling of FAST-LIVO within the HKU MARS lineage.

## Related

- [FAST-LIO2](fast-lio2.md) — the LiDAR-inertial core this line of work builds on
- [R3LIVE++](r3livepp.md) — successor with radiance maps and photometric calibration
- [FAST-LIVO](fast-livo.md) — sibling system where vision also feeds pose estimation via patches
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the fusion category
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the photometric fusion principle

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
