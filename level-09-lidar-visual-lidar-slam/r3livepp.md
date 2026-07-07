# R3LIVE++

> Lin 2023 · [Paper](https://arxiv.org/abs/2209.03666)

**One-line summary** — R3LIVE++ upgrades R3LIVE from simple RGB coloring to on-the-fly **radiance map** reconstruction, adding camera photometric calibration and online exposure-time estimation to improve both mapping fidelity and state-estimation accuracy.

## Problem

R3LIVE stores raw RGB values on map points, but a pixel's brightness is not a property of the scene — it is the scene's radiance filtered through the camera's non-linear response function, lens vignetting, and whatever exposure time auto-exposure chose for that frame. Ignoring this pipeline makes stored colors inconsistent across viewpoints and time and injects systematic error into photometric residuals. R3LIVE++ models the imaging pipeline explicitly so the map stores *radiance*, a physical quantity, instead of device-dependent RGB.

## Method & architecture

Same two-subsystem ESIKF architecture as R3LIVE — a FAST-LIO-style LIO builds the geometric structure of the map, a direct VIO recovers the radiance of those points — but the visual side is now physically modeled:

- **Image formation model**: for each color channel $i$, the recorded pixel intensity is

$$\mathbf{I}_i(\boldsymbol{\rho}) = \mathbf{f}_i\big(\tau\, V(\boldsymbol{\rho})\, \boldsymbol{\gamma}_i\big),$$

  where $\boldsymbol{\gamma}_i$ is the scene radiance at the point, $V(\boldsymbol{\rho}) \in [0,1]$ the per-pixel vignetting factor, $\tau$ the exposure time, and $\mathbf{f}_i(\cdot)$ the channel's non-linear camera response function (CRF). CRF and vignetting are calibrated offline; inverting gives the radiance from an observed pixel: $\boldsymbol{\gamma}_i = \mathbf{f}_i^{-1}(\mathbf{I}_i(\boldsymbol{\rho})) \,/\, (\tau V(\boldsymbol{\rho}))$. Under constant lighting and Lambertian reflection, radiance is invariant to camera pose — which is exactly what lets it drive ego-motion estimation.
- **Exposure in the state**: the full state $\mathbf{x} = ({^G}\mathbf{R}_I, {^G}\mathbf{p}_I, {^G}\mathbf{v}, \mathbf{b_g}, \mathbf{b_a}, {^G}\mathbf{g}, {^I}\mathbf{R}_C, {^I}\mathbf{p}_C, \epsilon, {^I}t_C, \boldsymbol{\phi})$ now includes the **inverse exposure time** $\epsilon = 1/\tau$, estimated online alongside extrinsics, time offset, and intrinsics.
- **Two-step VIO on corrected images**: each incoming image is first photometrically corrected (undo CRF and vignetting) into $\boldsymbol{\Gamma}$. A frame-to-frame PnP update on optical-flow-tracked map points gives a rough state; then the frame-to-map update minimizes the **radiance error** per tracked point,

$$\mathbf{r}_c(\check{\mathbf{x}}_k, {^G}\mathbf{p}_s, \boldsymbol{\gamma}_s) = \boldsymbol{\Phi}_s - \boldsymbol{\gamma}_s, \qquad \boldsymbol{\Phi}_s = \check{\epsilon}_k\, \boldsymbol{\Gamma}_k(\check{\boldsymbol{\rho}}_{s_k}),$$

  comparing the map point's stored radiance $\boldsymbol{\gamma}_s$ with the observed radiance $\boldsymbol{\Phi}_s$ at its projection. Because $\boldsymbol{\Phi}_s$ depends on $\epsilon$, the residual Jacobian has non-zero exposure entries — the same update that tracks the pose also estimates exposure.
- **Single pixels, not patches**: residuals are on individual pixels using the point's stored radiance (invariant to camera rotation/translation), avoiding the patch-warping and constant-depth-per-patch approximations of patch-based direct methods.
- **Radiance map update**: after convergence, a Bayesian update fuses new observations into each visible point's radiance, with an illumination-change random-walk noise $\mathbf{n}_{\text{ic}} \sim \mathcal{N}(\mathbf{0}, \boldsymbol{\sigma}^2_{\text{ic}} \Delta t_{\boldsymbol{\gamma}_s})$ inflating stale radiance covariance.

## Results

- **NCLT benchmark** (25 sequences, 138.0 km, 33.6 h total; loop closure disabled in baselines for fairness): R3LIVE++ achieves the best average absolute position error of **8.51 m**, vs 9.59 m (FAST-LIO2), 10.58 m (R2LIVE), 10.75 m (its own LIO alone), 15.03 m (LVI-SAM), 15.39 m (LIO-SAM).
- **R3LIVE-dataset** (13 self-collected HKU/HKUST sequences, 8.4 km, 2.4 h, including three LiDAR/camera-degenerate sequences): the system survives scenarios where the device faces a single texture-less wall.
- **Exposure estimation** vs ground truth from the camera API: mean errors of 0.189–3.460 ms across five sequences, consistently below Tum-cali (0.341–7.082 ms), e.g. 0.302 ms vs 5.225 ms on hkust_campus_seq_02.
- **Radiance map accuracy** (average photometric error of map reprojected into all images): lowest on every sequence — e.g. hku_campus_seq_00: 14.57 (R3LIVE++) vs 22.56 (R3LIVE) vs 34.78 (colorize-by-latest-frame baseline).
- **Runtime** (i7-9700K, CPU only): 34.3 ms per LiDAR scan and 16.6 ms per image on NCLT — total processing under half a second per second of data, i.e. about twice real-time.
- Applications built on the radiance map: HDR imaging (rendering at multiple virtual exposures), virtual environment exploration, and 3D video gaming.

## Why it matters for SLAM

R3LIVE++ is an early, practical step in the convergence of SLAM and photorealistic reconstruction: it treats appearance not as decoration but as a calibrated physical measurement, anticipating the radiance-field mindset (NeRF, Gaussian splatting) inside a real-time LVI estimator. Its photometric calibration and online exposure estimation were picked up by later direct LVI systems such as FAST-LIVO2. Reach for it when the deliverable is a high-fidelity colored map, not just a trajectory.

## Related

- [R3LIVE](r3live.md) — the predecessor system this improves
- [FAST-LIVO2](fast-livo2.md) — direct LVI odometry that also estimates exposure online
- [FAST-LIO2](fast-lio2.md) — the LiDAR-inertial foundation of the HKU MARS stack
- [Direct LiDAR-camera alignment](direct-lidar-camera-alignment.md) — why photometric calibration matters for direct methods
- [DSO](../level-03-monocular-slam/dso.md) — the visual-only system that pioneered full photometric calibration
- [NeRF](../level-05-deep-learning/nerf.md) — the radiance-field idea this system anticipates in real time
