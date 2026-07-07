# SVO

> Forster 2014 · [Paper](https://ieeexplore.ieee.org/document/6906584)

**One-line summary** — A semi-direct visual odometry method that detects FAST corners only on keyframes but tracks motion by direct photometric alignment of small patches, reaching hundreds of frames per second.

## Problem

Feature-based pipelines (PTAM and its MAV-adapted variants) spend most of their per-frame budget on feature extraction and robust matching, while dense direct methods (DTAM) need a GPU. Micro aerial vehicles need precise pose estimates at very high rate and low latency on small onboard computers, and neither camp fit that budget. SVO ("SVO: Fast Semi-Direct Monocular Visual Odometry", ICRA 2014) eliminates "costly feature extraction and robust matching techniques for motion estimation" by operating directly on pixel intensities, and pairs this with a probabilistic mapping method that explicitly models outliers.

## Method & architecture

Two parallel threads as in PTAM: **motion estimation** and **mapping**. Feature extraction happens only when a keyframe is selected; per-frame motion estimation is descriptor-free and proceeds in three steps.

**1. Sparse model-based image alignment** — frame-to-frame pose from direct alignment of 4×4-pixel patches around features with known depth $d_{\mathbf{u}}$:

$$\mathbf{T}_{k,k-1}=\arg\min_{\mathbf{T}}\frac{1}{2}\sum_{i\in\bar{\mathcal{R}}}\lVert\delta I(\mathbf{T},\mathbf{u}_i)\rVert^2,\qquad \delta I(\mathbf{T},\mathbf{u})=I_k\big(\pi(\mathbf{T}\cdot\pi^{-1}(\mathbf{u},d_{\mathbf{u}}))\big)-I_{k-1}(\mathbf{u})$$

solved by Gauss-Newton with the inverse compositional formulation (constant, precomputed Jacobians), coarse-to-fine over a 5-level pyramid. This step implicitly satisfies the epipolar constraint and yields outlier-free correspondences.

**2. Feature alignment (relaxation)** — each patch's 2D position is refined individually against the *keyframe* with the closest observation angle, using 8×8 patches with affine warp $\mathbf{A}_i$ and inverse compositional Lucas-Kanade:

$$\mathbf{u}_i'=\arg\min_{\mathbf{u}_i'}\frac{1}{2}\lVert I_k(\mathbf{u}_i')-\mathbf{A}_i\cdot I_r(\mathbf{u}_i)\rVert^2$$

This deliberately violates epipolar constraints to gain subpixel correspondence and re-anchors measurements to the map, breaking the frame-to-frame drift chain.

**3. Pose & structure refinement** — the reprojection residual created in step 2 (≈0.3 px on average) is minimised by motion-only BA, $\mathbf{T}_{k,w}=\arg\min_{\mathbf{T}}\frac{1}{2}\sum_i\lVert\mathbf{u}_i-\pi(\mathbf{T}_{k,w}\,{}_w\mathbf{p}_i)\rVert^2$, then structure-only BA; optional local BA is skipped in the fast setting.

**Mapping** — a recursive Bayesian depth filter per new feature (FAST corner with highest Shi-Tomasi score per 30×30 cell), initialised at the average scene depth with high uncertainty. Each new frame contributes a triangulated depth $\tilde{d}_i^k$ from the best epipolar-line match, modelled as a Gaussian + Uniform inlier/outlier mixture:

$$p(\tilde{d}_i^k\mid d_i,\rho_i)=\rho_i\,\mathcal{N}\big(\tilde{d}_i^k\mid d_i,\tau_i^2\big)+(1-\rho_i)\,U\big(\tilde{d}_i^k\mid d_i^{min},d_i^{max}\big)$$

with inlier probability $\rho_i$ and geometric variance $\tau_i^2$ (one-pixel disparity assumption), parameterised in inverse depth. A 3D point enters the map only after the filter converges, keeping outliers out by construction. Keyframes are selected when distance to all keyframes exceeds 12% of average scene depth.

## Results

On an 84 m MAV trajectory with motion-capture ground truth, SVO's relative pose error is **0.0059 m/s** (fast setting) and 0.0051 m/s (accurate setting) versus 0.0164 m/s for the MAV-tuned PTAM of Weiss et al., with smoother trajectories and far fewer 3D outliers. Runtime: **3.04 ms** per frame on a laptop (Intel i7, >300 fps; 6 ms with local BA) and **18.17 ms** on the onboard Odroid-U2 ARM computer (55 fps), against 91 and 27 fps for PTAM — using at most 2 CPU cores and only 120 tracked features in the fast setting. The depth filter lets SVO track reliably in repetitive high-frequency texture (asphalt, grass) where PTAM produces many outlier points. Released as open source.

## Why it matters for SLAM

SVO demonstrated that dropping per-frame feature extraction and descriptor matching enables extremely low-latency, subpixel-precise odometry, making it the estimator of choice for micro aerial vehicles and embedded platforms for years. It defined the "semi-direct" category between feature-based (PTAM, ORB-SLAM) and direct (LSD-SLAM, DSO) methods, and its Gaussian+Uniform depth filter (from Vogiatzis & Hernández, also used in REMODE) was reused by many later systems. SVO2 extended the recipe to multi-camera rigs, fisheye/catadioptric lenses, edgelets, and motion priors.

## Related

- [PTAM](ptam.md)
- [SVO2](svo2.md)
- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [Visual Odometry](visual-odometry.md)
