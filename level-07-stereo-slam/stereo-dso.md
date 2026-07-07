# Stereo DSO

> Wang 2017 · [Paper](https://arxiv.org/abs/1708.07878)

**One-line summary** — Stereo DSO extends DSO's direct sparse photometric bundle adjustment to stereo cameras, coupling static stereo (left-right) constraints with temporal multi-view constraints in one windowed optimization — yielding highly accurate, metric-scale direct odometry at KITTI scale.

## Problem

Monocular direct methods like DSO accumulate scale drift and need a slow, motion-dependent bootstrapping phase, since depth only emerges from temporal parallax. A fixed-baseline stereo rig fixes both — but static stereo alone can only triangulate accurately within a limited depth range, and stereo edges parallel to epipolar lines are degenerate. Stereo DSO asks how to integrate static stereo into the direct sparse bundle adjustment of temporal multi-view stereo so the two complement each other: stereo provides absolute scale and depth initialization; temporal observations constrain far points and degenerate directions.

## Method & architecture

**Pipeline.** New stereo frames are tracked against the newest keyframe by coarse-to-fine direct image alignment (Gauss-Newton on an image pyramid, constant-motion initialization); the pose refines the depths of recently selected candidate points. If the scene or illumination changed enough (mean squared optical flow, relative brightness factor), a keyframe is created and added to an active window, where poses, affine brightness parameters, point inverse depths, and camera intrinsics of all keyframes are jointly optimized; old keyframes and points are marginalized by Schur complement. System initialization uses a semi-dense depth map from static stereo matching (NCC over 3×5 patches along the horizontal epipolar line) instead of random depths.

**Photometric energy.** For points $\mathcal{P}_i$ of frame $I_i$ observed in $I_j$, with affine brightness parameters $a,b$ per image:

$$E_{ij}=\sum_{\mathbf{p}\in\mathcal{P}_{i}}\sum_{\tilde{\mathbf{p}}\in\mathcal{N}_{\mathbf{p}}}\omega_{\tilde{\mathbf{p}}}\left\|I_{j}[\tilde{\mathbf{p}}^{\prime}]-b_{j}-\frac{e^{a_{j}}}{e^{a_{i}}}\left(I_{i}[\tilde{\mathbf{p}}]-b_{i}\right)\right\|_{\gamma}$$

where $\|\cdot\|_\gamma$ is the Huber norm, $\mathcal{N}_{\mathbf{p}}$ the 8-point residual pattern, $\omega_{\mathbf{p}}=c^{2}/(c^{2}+\|\nabla I_{i}(\mathbf{p})\|_{2}^{2})$ down-weights high-gradient pixels, and $\mathbf{p}'=\Pi_{\mathbf{K}}\left(\mathbf{T}_{ji}\,\Pi_{\mathbf{K}}^{-1}(\mathbf{p},d_{\mathbf{p}})\right)$ reprojects via inverse depth $d_{\mathbf{p}}$.

**Stereo coupling — the core contribution.** Each active point produces temporal residuals $r^{t}$ toward other keyframes and a static stereo residual $r^{s}$ toward the same-instant right image ($\mathbf{T}_{ji}$ fixed by the baseline, so its geometric parameters are only $(d,\mathbf{c})$). Both enter one energy weighted by a coupling factor $\lambda$:

$$E=\sum_{i\in\mathcal{F}}\sum_{\mathbf{p}\in\mathcal{P}_{i}}\Big(\sum_{j\in obs^{t}(\mathbf{p})}E^{\mathbf{p}}_{ij}+\lambda E^{\mathbf{p}}_{is}\Big)$$

minimized by Gauss-Newton, $\delta\boldsymbol{\xi}=-(\mathbf{J}^{T}\mathbf{W}\mathbf{J})^{-1}\mathbf{J}^{T}\mathbf{W}\mathbf{r}$, over all keyframe poses $\mathbf{T}$, inverse depths $d$, intrinsics $\mathbf{c}$, and left/right affine parameters $a^{L},b^{L},a^{R},b^{R}$, with $\mathrm{SE}(3)$ increments applied as $\mathbf{x}\boxplus\mathbf{T}:=\exp(\hat{\mathbf{x}})\mathbf{T}$.

**Point management and marginalization.** Candidate pixels are picked from gradient-adaptive blocks (block size proportional to image size, which helps wide KITTI images); their depths are initialized by static stereo NCC matching — significantly increasing tracking accuracy over the monocular 0-to-infinity initialization — and refined by subsequent non-keyframes before activation. Marginalization keeps the window bounded: with $\alpha$ the kept and $\beta$ the marginalized variables,

$$\left(\mathbf{H}_{\alpha\alpha}-\mathbf{H}_{\alpha\beta}\mathbf{H}^{-1}_{\beta\beta}\mathbf{H}^{T}_{\alpha\beta}\right)\mathbf{x}_{\alpha}=\mathbf{b}_{\alpha}-\mathbf{H}_{\alpha\beta}\mathbf{H}^{-1}_{\beta\beta}\mathbf{b}_{\beta}$$

is retained as a prior for subsequent optimizations.

## Results

- **Coupling factor** (KITTI Seq. 06): $\lambda=1,2$ significantly reduces both translational and rotational errors; $\lambda>3$ over-trusts static stereo and degrades from incorrect stereo matches.
- **KITTI training set (00-10)**, translational RMSE $t_{rel}$ (%) / rotational RMSE $r_{rel}$ (deg/100 m), averaged over 100-800 m intervals: Stereo DSO **0.84 / 0.20** mean, vs ORB-SLAM2 (VO mode, loop closure and global BA off) 0.81 / 0.26 and Stereo LSD-VO 1.14 / 0.40. Rotational error beats ORB-SLAM2 on every sequence; translation is mixed (e.g. Seq. 10: 0.49 vs 0.58).
- **KITTI testing set (11-21)**: Stereo DSO as pure VO outperforms the full SLAM versions of Stereo LSD-SLAM and ORB-SLAM2 (with loop closure, and for ORB-SLAM2 global BA) across all distance intervals and driving speeds.
- **Cityscapes Frankfurt**: qualitative tracking and 3D reconstruction on long rolling-shutter driving segments (5000-6000 frames each), demonstrating robustness to a known weakness of direct methods; monocular baselines show clear scale drift on KITTI 00/06 where Stereo DSO does not.

## Why it matters for SLAM

Stereo DSO showed that direct methods are not confined to small indoor scenes: with a stereo rig they achieve state-of-the-art large-scale outdoor odometry — beating loop-closing SLAM systems as pure VO. Its recipe of static-plus-temporal stereo in one photometric bundle adjustment and stereo-initialized point depths became a standard design pattern: the "virtual stereo" of DVSO (CNN-predicted right images) and the inertial extension VI-DSO both build directly on it. Study it after DSO to see how a direct pipeline absorbs a second camera.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [VI-DSO](../level-06-vio-vins/vi-dso.md)
- [DVSO](../level-03-monocular-slam/dvso.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
