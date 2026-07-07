# ACE Zero

> Brachmann 2024 · [Paper](https://arxiv.org/abs/2404.14351)

**One-line summary** — ACE Zero (ACE0) re-interprets incremental structure-from-motion as the iterated training and application of a scene coordinate regression relocalizer, recovering camera poses for unposed image collections without any pre-built 3D map.

## Problem

Scene coordinate regression (SCR) relocalizers such as DSAC\* and ACE are accurate and compact, but training their scene-specific networks requires ground-truth camera poses — which in practice come from a feature-based SfM tool like COLMAP. That is a circular dependency: you need a map to train the localizer, but a localizer to build the map. ACE0 asks whether the relocalizer itself can bootstrap reconstruction — estimating camera parameters $\mathcal{H}=\{(K_i, T_i)\}$ for a set of images with no pose priors, no sequential ordering, and no pre-built 3D map.

## Method & architecture

**SfM = iterated relocalization.** ACE0 loops between two stages until all images are posed: *neural mapping* (train an ACE-style SCR model on the currently registered images) and *relocalization* (use it to register more images). The scene representation is the ACE head — a 9-layer, 512-channel MLP (4 MB in fp16) on top of a frozen ScanNet-pretrained convolutional backbone; pixel positions, poses, and scene coordinates are tied by the projection $\mathbf{p}_{ij}=\boldsymbol{\pi}(K_{i},T_{i},\mathbf{y}_{ij})$, with $\mathbf{y}_{ij}=f_{\text{SCR}}(\mathbf{p}_{ij},I_{i})$.

**Neural mapping.** At iteration $t$, the registered set $\mathcal{I}^{t}_{\text{Reg}}$ with pose estimates $T^t_i, K^t_i$ serves as pseudo ground truth, and the scene model is trained by minimizing the pixel-wise reprojection error

$$\sum_{I_{i}\in\mathcal{I}^{t}_{\text{Reg}}}\;\sum_{j\in I_{i}}\left\|\mathbf{p}_{ij}-\boldsymbol{\pi}(K_{i}^{t},T_{i}^{t},\mathbf{y}_{ij}^{t})\right\|.$$

Because earlier registrations are only approximate, poses are *refined during mapping*: an MLP $T_{i}^{t}=f^{t}_{\text{Pose}}(\tilde{T}^{t}_{i})$ ingests each initial pose as 12 values and predicts 12 additive offsets (rotations re-orthonormalized by Gram-Schmidt), jointly optimized with $f_{\text{SCR}}$ under AdamW weight decay that biases updates to stay small — the MLP models correlations between cameras, unlike per-pose backprop. Focal length is refined too, via a single parameter: $f^{t}_{i}=f^{\text{init}}\cdot(1+\alpha^{t})$, with $f^{\text{init}}$ set to 70% of the image diagonal. The refinement MLP is discarded after each mapping iteration; this joint refinement is the SCR analogue of bundle adjustment.

**Relocalization.** All images (registered or not) are passed through $f^{t}_{\text{SCR}}$, and PnP + RANSAC returns a pose plus confidence: $\tilde{T}^{t+1}_{i},\,s^{t+1}_{i}=g\left(K^{t}_{i},\{(\mathbf{p}_{ij},\mathbf{y}^{t}_{ij})\}\right)$. Using the inlier count as $s$, the next training set is $\mathcal{I}^{t+1}_{\text{Reg}}=\{I_{i}\,|\,s^{t+1}_{i}>\tau_{s}\}$.

**Initialization from one image.** The reprojection objective is ill-posed for a single view, so the seed network is trained on targets back-projected from a monocular depth estimate (ZoeDepth): $\hat{\mathbf{y}}_{ij}=d_{ij}(K_{\text{seed}}^{\text{init}})^{-1}\mathbf{p}_{ij}$, minimizing $\sum_{j}\|\hat{\mathbf{y}}_{ij}-\mathbf{y}_{ij}\|$ with the seed pose fixed to identity. Five random seeds are tried and the one relocalizing the most of 1000 held-out images wins (~1 min each). Depth is used *only* here. Adaptive patch sampling and early stopping (stop when 70% of batch reprojection errors stay below 10 px for 100 batches) shrink each mapping round well below ACE's 5 minutes.

## Results

Evaluated on 31 scenes across three datasets; since COLMAP poses are themselves estimates, pose quality is measured self-supervised via novel view synthesis — train Nerfacto on each method's poses and report test-view PSNR. All ACE0 timings on a single V100.

- **7-Scenes** (2k-12k images per scene): pose quality comparable to the COLMAP pseudo ground truth in PSNR, reconstructing each scene in ~1 hour; DROID-SLAM partially fails on the disconnected scans; BARF and NoPe-NeRF perform poorly even on 200-image subsets (NoPe-NeRF: 2 days per scene); DUSt3R (max 50 images on an A100 40 GB) trails ACE0 consistently. Starting from KinectFusion poses, "KF+ACE0" raises PSNR significantly in under 10 minutes per scene.
- **Relocalization**: mapping 7-Scenes self-supervised, ACE0 achieves almost identical 5 cm/5° relocalization rates to a supervised ACE trained on COLMAP mapping poses — evidence its poses closely match COLMAP's.
- **Mip-NeRF 360**: reconstructs all scenes successfully with PSNR slightly below COLMAP, where BARF, NoPe-NeRF, and DROID-SLAM fail outright.
- **Tanks and Temples** (17 scenes; 150-500 images and 4k-22k frame versions): reasonable PSNR vs COLMAP on sparse sets (similar to RealityCapture); on the 1k+ frame sets, quality comparable to COLMAP-fast while remaining fast — and given a sparse COLMAP initialization, ACE0 registers and refines all remaining frames in 1-2 hours on average.
- **Limitations**: repetitive structures (unimodal predictions), very large areas, and extreme viewpoint or day-night changes.

## Why it matters for SLAM

ACE Zero completes the SCR lineage (DSAC → DSAC\* → ACE) by removing its last classical dependency: the SfM-generated ground-truth poses needed for training. This makes learning-based relocalization self-contained — the map lives entirely in network weights, so no raw images or explicit 3D points need be stored, which is attractive for crowd-sourced and privacy-preserving mapping, and positions SCR as a learning-based alternative to COLMAP-style reconstruction. It also inspired follow-ups pushing SCR into real-time SLAM (ACE-SLAM) and toward generalization (ACE-G).

## Related

- [ACE](ace.md)
- [DSAC*](dsac-star.md)
- [ACE-SLAM](ace-slam.md)
- [ACE-G](ace-g.md)
- [COLMAP](../level-03-monocular-slam/colmap.md)
- [ZoeDepth](zoedepth.md) — provides the seed depth estimate
