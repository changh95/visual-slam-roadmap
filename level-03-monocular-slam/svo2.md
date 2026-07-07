# SVO2

> Forster 2017 · [Paper](https://rpg.ifi.uzh.ch/svo2.html)

**One-line summary** — Extends semi-direct visual odometry to multi-camera rigs, fisheye/catadioptric lenses, edgelet features, and motion priors, with an empirical convergence analysis of direct alignment and an optional iSAM2 bundle-adjustment backend.

## Problem

The original SVO operated with a single perspective camera, but real robotic platforms — especially micro aerial vehicles — carry multiple cameras with wide-angle or fisheye lenses to maximise field of view. Direct methods were also used largely on faith: there was little analysis of when and why photometric alignment converges, and they lacked the optimality of feature-based joint optimisation. SVO2 ("SVO: Semi-Direct Visual Odometry for Monocular and Multi-Camera Systems", TRO 2017) generalises the semi-direct approach — direct methods "to track and triangulate pixels that are characterized by high image gradients," feature-based methods "for joint optimization of structure and motion" — to arbitrary camera systems.

## Method & architecture

**Sparse image alignment, generalised** — incremental motion of a body frame $B$ (extrinsics $\mathbf{T}_{CB}$ per camera) is estimated by minimising the photometric error of patches around corner *and edgelet* features with known depth, summed over all cameras $\mathcal{C}$ of the rig:

$$\mathbf{T}^{\star}_{kk-1}=\arg\min_{\mathbf{T}_{kk-1}}\sum_{C\in\mathcal{C}}\sum_{\mathbf{u}\in\bar{\mathcal{R}}^{C}_{k-1}}\frac{1}{2}\big\lVert I^{C}_{k}\big(\pi(\mathbf{T}_{CB}\mathbf{T}_{kk-1}\,\rho_{\mathbf{u}})\big)-I^{C}_{k-1}\big(\pi(\mathbf{T}_{CB}\,\rho_{\mathbf{u}})\big)\big\rVert^{2}_{\Sigma_I}$$

so every camera that sees structure contributes to one body-pose estimate; multi-camera support only changes the Jacobians. Optional **motion priors** (constant velocity, or gyroscope rotation $\tilde{\mathbf{R}}_{kk-1}$) add penalty terms $\frac{1}{2}\lVert\mathbf{p}_{kk-1}-\tilde{\mathbf{p}}_{kk-1}\rVert^{2}_{\Sigma_p}+\frac{1}{2}\lVert\log(\tilde{\mathbf{R}}^{\top}_{kk-1}\mathbf{R}_{kk-1})^{\vee}\rVert^{2}_{\Sigma_R}$ to the same cost.

**Relaxation and refinement** — as in SVO, each feature is then re-aligned in 2D against the keyframe where it was first observed (affine-warped patch, inverse compositional Lucas-Kanade). Edgelets suffer the aperture problem, so their correction is restricted to the edge normal $\mathbf{n}$: ${\mathbf{u}'}^{\star}=\mathbf{u}'+\delta u^{\star}\,\mathbf{n}$. Finally, bundle adjustment minimises reprojection errors over keyframes and landmarks — edge-feature residuals projected along the normal, since the along-edge component is unobservable — solved in real time with the incremental smoother iSAM2 (or, cheaper, pose-and-points-only optimisation for embedded use).

**Mapping** — a recursive Bayesian filter per feature over *inverse* depth $\rho$ with inlier probability $\gamma$, measurements modelled as Gaussian + Uniform mixture $p(\tilde{\rho}_i^k\mid\rho_i,\gamma_i)=\gamma_i\,\mathcal{N}(\tilde{\rho}_i^k\mid\rho_i,\tau_i^2)+(1-\gamma_i)\,U(\tilde{\rho}_i^k\mid\rho_i^{min},\rho_i^{max})$ and the posterior approximated as $\mathrm{Beta}(\gamma\mid a_k,b_k)\,\mathcal{N}(\rho\mid\mu_k,\sigma_k^2)$ — outliers barely shift the mean while $\gamma$ reports confidence. Filters are updated from previous *and* subsequent frames (better for forward motion) and skip measurements where the edge is parallel to the epipolar line.

**Wide field of view** — projection/unprojection use the polynomial omnidirectional camera model, so fisheye and catadioptric images are used undistorted; epipolar search samples the great circle (epipolar plane ∩ unit sphere) at roughly one-pixel angular resolution to follow the curved epipolar line.

**Convergence study** — a controlled experiment measures the probability that image-to-model alignment converges as a function of distance to the reference frame: convergence improves with patch size up to 4×4 pixels, dense alignment adds almost nothing over semi-dense (zero-gradient pixels have zero Jacobians), and sparse alignment has a smaller convergence radius than semi-dense — which is why SVO aligns only to the *previous* frame and relies on feature alignment to the map to kill drift.

## Results

On the EuRoC MAV benchmark (11 sequences, averaged over 5 runs, loop closures disabled for competitors), SVO achieves higher accuracy than LSD-SLAM and than real-time ORB-SLAM in most runs, while DSO is consistently very accurate and mostly outperforms SVO in the monocular setting; stereo SVO is generally more accurate than monocular and immune to scale drift, though SVO fails on the Vicon Room sequences with abrupt illumination changes and on-spot rotations. Efficiency is the headline: mean **2.53 ms** per frame (SVO Mono) on a laptop i7 with **55% CPU** at 20 Hz, versus 29.81 ms/187% for ORB-SLAM and 23.23 ms/236% for LSD-SLAM — "up to ten times faster... and requires only a fourth of the CPU usage." On an NVIDIA Jetson TX1, sparse image alignment takes 2.54 ms and feature alignment 1.40 ms. Edgelets add little accuracy in corner-rich EuRoC scenes but improve robustness where corners are absent; motion priors cut alignment iterations.

## Why it matters for SLAM

SVO2 turned the semi-direct paradigm into a system deployable on real robotic platforms — especially MAVs carrying several wide-angle cameras — and was widely used on commercial and research drones. Its convergence analysis gave direct methods an empirical grounding (and justified coarse-to-fine, patch-size, and frame-rate design choices), and its Beta×Gaussian inverse-depth filter became a common reference for probabilistic per-pixel depth estimation. It remains a go-to design when very fast, lightweight odometry is needed on embedded hardware.

## Related

- [SVO](svo.md) — the original semi-direct monocular VO this work extends
- [DSO](dso.md) — fully direct sparse odometry, a contemporary alternative
- [PTAM](ptam.md) — origin of the tracking/mapping split that SVO builds on
- [ROVIO](../level-06-vio-vins/rovio.md) — filter-based VIO also aimed at MAV platforms
- [Incremental smoothing](../level-02-getting-familiar/incremental-smoothing.md) — the iSAM2 machinery behind SVO2's BA backend
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — the fisheye/omnidirectional models SVO2 supports
