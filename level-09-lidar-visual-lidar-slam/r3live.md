# R3LIVE

> Lin 2022 · [Paper](https://arxiv.org/abs/2109.07982)

**One-line summary** — R3LIVE fuses LiDAR, inertial, and visual sensing so that LiDAR-inertial odometry builds the geometry of the global map while a direct visual-inertial subsystem paints its texture, producing dense RGB-colored point clouds in real time.

## Problem

LiDAR-based SLAM fails when there are not enough geometric features — especially with small-FoV solid-state LiDARs — and its maps are colorless, limiting their use for surveying, simulators, and other 3D applications. R3LIVE aims for robust, accurate state estimation *and* a dense RGB-colored map by giving each sensor the job it is best at, coupled through one shared map and one filter.

## Method & architecture

Two subsystems share a 29-dimensional state $\mathbf{x} \in \mathbb{R}^{29}$ containing IMU pose $({^G}\mathbf{R}_I, {^G}\mathbf{p}_I)$, velocity, gyro/accel biases, gravity ${^G}\mathbf{g}$, camera-IMU extrinsics $({^I}\mathbf{R}_C, {^I}\mathbf{p}_C)$, camera-IMU time offset ${^I}t_C$, and camera intrinsics $\boldsymbol{\phi} = [f_x, f_y, c_x, c_y]^T$ — all estimated online in an error-state iterated Kalman filter (ESIKF).

- **Map**: fixed-size voxels (e.g. $0.1$ m cubes, marked *activated* if points were appended recently) containing points $\mathbf{P} = [{^G}\mathbf{p}^T, \mathbf{c}^T]^T$ — 3D position plus RGB color, each with covariances $\boldsymbol{\Sigma}_{\mathbf{p}}, \boldsymbol{\Sigma}_{\mathbf{c}}$.
- **LIO subsystem** (based on FAST-LIO): IMU backward propagation de-skews each scan, the ESIKF minimizes point-to-plane residuals, and converged scans are appended to the global map — building the geometry that also supplies depth to the VIO.
- **VIO subsystem**, a two-step direct pipeline with no feature extraction:
  1. *Frame-to-frame update*: LK optical flow tracks projections of map points; the PnP reprojection residual $\mathbf{r} = \boldsymbol{\rho}_{s_k} - \boldsymbol{\pi}({^C}\mathbf{p}_s, \check{\mathbf{x}}_k)$ (with an online temporal-offset correction term inside $\boldsymbol{\pi}$) drives an ESIKF update.
  2. *Frame-to-map update*: the photometric residual $\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) = \mathbf{c}_s - \boldsymbol{\gamma}_s$ compares each tracked point's stored map color $\mathbf{c}_s$ with its color $\boldsymbol{\gamma}_s$ interpolated from the current image — the map color is invariant to camera rotation/translation, unlike patch pyramids.
- Both updates solve the same MAP problem, combining the IMU-propagated prior with the stacked residuals:

$$\min_{\delta\check{\mathbf{x}}_k} \Big( \big\|\check{\mathbf{x}}_k \boxminus \hat{\mathbf{x}}_k + \boldsymbol{\mathcal{H}}\delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\delta\hat{\mathbf{x}}_k}} + \sum_{s=1}^{m} \big\|\mathbf{o}(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \mathbf{c}_s) + \mathbf{H}^o_s \delta\check{\mathbf{x}}_k\big\|^2_{\boldsymbol{\Sigma}_{\boldsymbol{\beta}_s}} \Big)$$

  iterated to convergence with Kalman gain $\mathbf{K} = (\mathbf{H}^T\mathbf{R}^{-1}\mathbf{H} + \mathbf{P}^{-1})^{-1}\mathbf{H}^T\mathbf{R}^{-1}$ (equivalent to Gauss-Newton).
- **Texture rendering**: after each converged pose, points in activated voxels that fall in the image get their colors fused by a Bayesian update — the stored color's covariance grows with a random-walk term $\boldsymbol{\sigma}_s^2 \cdot \Delta t_{\mathbf{c}_s}$ (modeling illumination change) before blending with the new observation.
- **Tracked-point maintenance**: points with large reprojection or photometric error are dropped; new map points are added where no tracked point exists within a 50-pixel radius.

## Results

Handheld device: Livox AVIA LiDAR (FoV 70.4°×77.2°), FLIR Blackfly global-shutter camera, DJI Manifold-2c (Intel i7-8550U, 8 GB RAM).

- **LiDAR-degenerate + texture-less test**: passing a narrow "T"-shape passage while facing white walls (single-plane LiDAR constraint, near-zero texture), R3LIVE survives and drifts only 4.57 cm in translation and 1.62° in rotation end-to-end (ArUco ground truth).
- **Large-scale campus mapping** (HKUST, four trajectories of 1317/1524/1372/1191 m): translation drift 0.093/0.154/0.164/0.102 m and rotation drift 2.140/0.285/2.342/3.925°, with trajectories closing the loop without any loop-closure module.
- **RTK-GPS benchmark** (seaport, two sequences): R3LIVE-HiRes achieves the best relative errors, e.g. 0.21°/0.17% (RRE/RTE) at 300 m sub-sequences on sequence (a) versus 0.43°/2.40% for LVI-SAM and 0.59°/2.31% for VINS-Mono; it also edges out R2LIVE and FAST-LIO2.
- **Runtime**: VIO costs 7.01 ms per frame on PC at 320×256 / 0.10 m map resolution — comfortably real time even on the onboard computer.

## Why it matters for SLAM

R3LIVE established the "geometry from LiDAR, texture from camera" pattern for LVI systems and showed that direct photometric alignment against a colored LiDAR map is a practical, real-time alternative to feature-based visual fusion. It bridges state estimation and colorized 3D reconstruction — digital twins, inspection, AR — and its full open-source release (code, mesh-texturing utilities, even the device's mechanical design) made it the reference design that R3LIVE++ and FAST-LIVO build upon.

## Related

- [FAST-LIO2](fast-lio2.md) — the LiDAR-inertial core this line of work builds on
- [R3LIVE++](r3livepp.md) — successor with radiance maps and photometric calibration
- [FAST-LIVO](fast-livo.md) — sibling system where vision also feeds pose estimation via patches
- [LiDAR-Visual-Inertial (LVI)](lidar-visual-inertial-lvi.md) — the fusion category
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — the photometric fusion principle
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md) — the error-state machinery behind its ESIKF
