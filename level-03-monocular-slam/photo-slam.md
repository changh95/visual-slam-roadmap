# Photo-SLAM

> Huang 2024 · [Paper](https://arxiv.org/abs/2311.16728)

**One-line summary** — A "hyper primitives" map couples explicit ORB-feature geometry (for factor-graph localisation) with learned photometric attributes rendered by 3DGS, giving real-time photorealistic SLAM for monocular, stereo and RGB-D cameras — even on a Jetson AGX Orin.

## Problem

Neural-rendering SLAM had shown promising joint localisation and photorealistic reconstruction, but "existing methods, fully relying on implicit representations, are so resource-hungry that they cannot run on portable devices, which deviates from the original intention of SLAM." NICE-SLAM/ESLAM-style systems optimise poses through ray-sampling losses, which is slow, needs depth (or depth predictors) for convergence, and requires a pre-defined bounding volume. Photo-SLAM's answer is a division of labour: explicit geometric features for localisation, learned photometric features for appearance, with no dependence on dense depth.

## Method & architecture

Four parallel threads — localization, geometry mapping, photorealistic mapping, loop closure — jointly maintain a **hyper primitives map**: point clouds $\mathbf{P}\in\mathbb{R}^{3}$ each carrying an ORB feature $\mathbf{O}\in\mathbb{R}^{256}$, rotation $\mathbf{r}\in SO(3)$, scaling $\mathbf{s}\in\mathbb{R}^{3}$, density $\sigma$, and spherical-harmonic coefficients $\mathbf{SH}\in\mathbb{R}^{16}$. ORB features serve 2D-2D/2D-3D correspondence; the photometric attributes serve splatting-based rendering.

- **Localization (motion-only BA)**: solved as a factor graph with Levenberg-Marquardt over reprojection errors of matched keypoints $\mathbf{p}_i$ against map points $\mathbf{P}_i$:

$$\{\mathbf{R},\mathbf{t}\}=\mathop{\arg\min}\limits_{\mathbf{R},\mathbf{t}}\sum_{i\in\mathcal{X}}\rho\left(\lVert\mathbf{p}_{i}-\pi(\mathbf{R}\mathbf{P}_{i}+\mathbf{t})\rVert^{2}_{\Sigma_{g}}\right),$$

  with $\pi$ the projection, $\rho$ the Huber cost, $\Sigma_g$ the keypoint's scale covariance. Geometry mapping runs local BA over covisible keyframes and points — tracking never depends on rendering convergence.
- **Photorealistic mapping**: hyper primitives are rasterised by a tile-based renderer (3DGS alpha-blending of SH-derived colours) and optimised over $\mathbf{P},\mathbf{r},\mathbf{s},\sigma,\mathbf{SH}$ by the photometric loss

$$\mathcal{L}=(1-\lambda)\left|I_{\text{r}}-I_{\text{gt}}\right|_{1}+\lambda\left(1-\text{SSIM}(I_{\text{r}},I_{\text{gt}})\right), \qquad \lambda=0.2 .$$

- **Geometry-based densification**: fewer than ~30% of 2D feature points have triangulated 3D points; the inactive ones mark texture-complex regions, so temporary hyper primitives are spawned there — depth from the sensor (RGB-D), from nearest active features (monocular), or from stereo matching (stereo) — in addition to standard gradient-based split/clone.
- **Gaussian-Pyramid-based (GP) learning**: training targets progress from the coarsest pyramid level to the full image, $t_{0}:\arg\min\mathcal{L}(I^{n}_{\text{r}},\text{GP}^{n}(I_{\text{gt}}))\;\dots\;t_{n}:\arg\min\mathcal{L}(I^{0}_{\text{r}},\text{GP}^{0}(I_{\text{gt}}))$ — multi-level features are learned progressively (3 levels by default), which the ablation shows matters most for monocular input.
- **Loop closure** corrects keyframes and hyper primitives by similarity transform, removing ghosting from drift. The whole system is C++/CUDA (built on ORB-SLAM3, 3DGS and LibTorch).

## Results

Desktop = RTX 4090; also run unchanged on a laptop (RTX 3080 Ti) and Jetson AGX Orin:

- **Replica, monocular**: ATE RMSE 1.091 cm with PSNR 33.302 / SSIM 0.926 / LPIPS 0.078 and 911 FPS rendering in under 2 minutes — vs Go-SLAM at 71.05 cm / 21.17 dB / 0.821 FPS rendering. On Jetson: 1.235 cm, 29.28 dB, 95 FPS rendering in 4 GB GPU memory.
- **Replica, RGB-D**: 0.604 cm, PSNR 34.958 at 1084 FPS rendering (< 2 min), vs Point-SLAM's 34.632 dB at 0.510 FPS rendering and > 2 hours — the abstract's "PSNR is 30% higher and rendering speed is hundreds of times faster" versus prior online systems.
- **TUM, monocular**: 1.539 / 0.984 / 1.257 cm on fr1-desk / fr2-xyz / fr3-office, on par with ORB-SLAM3 while adding photorealistic mapping where Go-SLAM manages 33–106 cm.
- **Stereo**: quantitative results on EuRoC MAV; the paper calls it "the first system to support online photorealistic mapping with stereo cameras", plus qualitative outdoor hand-held ZED 2 scenes.
- Ablations confirm geometry-based densification supplies sufficient primitives while GP learning ensures they are optimised thoroughly, improving PSNR at real-time speed.

## Why it matters for SLAM

Photo-SLAM demonstrated that photorealistic 3DGS SLAM can run in real time on embedded robotic platforms, not just desktop GPUs. Its decoupled template — classical feature-based tracking for robustness, Gaussian splatting purely for appearance — became one of the standard architectures for practical Gaussian SLAM (and the design GS-ICP SLAM benchmarks against as the "decoupled" alternative). It is also the reminder that a mature classical frontend (ORB-SLAM3) plus a modern map back-end can beat end-to-end designs on efficiency without sacrificing accuracy.

## Related

- [SplaTAM](splatam.md)
- [ORB-SLAM3](orb-slam3.md)
- [RTG-SLAM](rtg-slam.md)
- [MonoGS](monogs.md)
- [GS-ICP SLAM](gs-icp-slam.md)
