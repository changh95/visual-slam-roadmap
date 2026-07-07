# MonoGS

> Matsuki 2024 · [Paper](https://arxiv.org/abs/2312.06741)

**One-line summary** — "Gaussian Splatting SLAM" (CVPR 2024 highlight): the first application of 3D Gaussian Splatting in monocular SLAM, using Gaussians as the only 3D representation and tracking the camera by direct optimisation against the rasterised map, live at 3 fps.

## Problem

3D Gaussian Splatting produces photorealistic maps with fast differentiable rasterisation, but the original 3DGS algorithm "requires accurate poses from an offline Structure from Motion (SfM) system" — it is a batch method with poses given. Using it *inside* SLAM means the opposite: estimate poses from the Gaussians while incrementally building them from a live camera, in "the most fundamental but the hardest setup for Visual SLAM" — a single monocular RGB stream, where rasterisation imposes no constraint along the viewing ray and newly inserted Gaussians are geometrically ambiguous until multiple views constrain them.

## Method & architecture

The map is a set of anisotropic Gaussians $\mathcal{G}$, each with colour $c^i$, opacity $\alpha^i$, world-frame mean $\boldsymbol{\mu}_W^i$ and covariance $\boldsymbol{\Sigma}_W^i$ (spherical harmonics omitted). A pixel colour is synthesised by splatting and alpha-blending $\mathcal{N}$ depth-sorted Gaussians:

$$\mathcal{C}_p=\sum_{i\in\mathcal{N}}c_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j), \qquad \mathcal{D}_p=\sum_{i\in\mathcal{N}}z_i\alpha_i\prod_{j=1}^{i-1}(1-\alpha_j),$$

where $z_i$ is the distance to Gaussian $i$ along the ray (depth is rasterised the same way). Projection into the image is $\boldsymbol{\mu}_I=\pi(\boldsymbol{T}_{CW}\cdot\boldsymbol{\mu}_W)$, $\boldsymbol{\Sigma}_I=\mathbf{J}\mathbf{W}\boldsymbol{\Sigma}_W\mathbf{W}^\top\mathbf{J}^\top$, with $\boldsymbol{T}_{CW}\in SE(3)$ the camera pose, $\mathbf{J}$ the Jacobian of the linearised projection and $\mathbf{W}$ the rotation part of $\boldsymbol{T}_{CW}$.

- **Analytic camera Jacobians on the Lie group** (the paper's key derivation): tracking needs ~50–100 gradient-descent iterations per frame, so instead of autodiff the derivatives of $\boldsymbol{\mu}_I$ and $\boldsymbol{\Sigma}_I$ w.r.t. $\boldsymbol{T}_{CW}$ are derived in closed form using the manifold derivative $\frac{\mathcal{D}f(\boldsymbol{T})}{\mathcal{D}\boldsymbol{T}}\triangleq\lim_{\tau\to 0}\frac{\mathrm{Log}(f(\mathrm{Exp}(\tau)\circ\boldsymbol{T})\circ f(\boldsymbol{T})^{-1})}{\tau}$, giving minimal Jacobians such as

$$\frac{\mathcal{D}\boldsymbol{\mu}_C}{\mathcal{D}\boldsymbol{T}_{CW}}=\begin{bmatrix}\boldsymbol{I} & -\boldsymbol{\mu}_C^{\times}\end{bmatrix},$$

  where $\boldsymbol{\mu}_C^{\times}$ is the skew-symmetric matrix of the Gaussian centre in camera coordinates. These plug straight into the CUDA rasteriser.
- **Tracking**: only the current pose is optimised, minimising the photometric residual $E_{pho}=\lVert I(\mathcal{G},\boldsymbol{T}_{CW})-\bar{I}\rVert_1$ (with affine brightness parameters for exposure); with depth available, a geometric residual $E_{geo}=\lVert D(\mathcal{G},\boldsymbol{T}_{CW})-\bar{D}\rVert_1$ is added as $\lambda_{pho}E_{pho}+(1-\lambda_{pho})E_{geo}$, $\lambda_{pho}=0.9$.
- **Keyframing via Gaussian covisibility**: a window $\mathcal{W}_k$ (8–10 keyframes) is managed using the intersection-over-union of the Gaussians visible in two frames; a frame becomes a keyframe if covisibility drops or translation exceeds a fraction of median depth. Since Gaussians are sorted along rays, occlusion is handled by design.
- **Insertion and pruning**: new Gaussians are initialised from observed depth (RGB-D) or sampled around the rendered/median depth with variance (monocular); Gaussians inserted in the last 3 keyframes that are not observed by at least 3 other frames are pruned as geometrically unstable.
- **Mapping with isotropic regularisation**: rasterisation leaves Gaussians unconstrained along the viewing ray, so mapping adds $E_{iso}=\sum_{i=1}^{|\mathcal{G}|}\lVert\mathbf{s}_i-\tilde{\mathbf{s}_i}\cdot\mathbf{1}\rVert_1$ penalising elongated scales, and jointly optimises window keyframe poses and Gaussians: $\min\sum_{k\in\mathcal{W}}E^k_{pho}+\lambda_{iso}E_{iso}$ with $\lambda_{iso}=10$, using two random past keyframes per iteration against forgetting.

## Results

On a desktop with an RTX 4090 (multi-process implementation, live at 3 fps monocular):

- **TUM RGB-D, monocular ATE RMSE (cm)**: 3.78 / 4.60 / 3.50 on fr1/desk, fr2/xyz, fr3/office (avg 3.96), beating DROID-VO (7.73), DepthCov-VO (25.2) and DSO (11.0) without any deep priors, and approaching loop-closing systems (ORB-SLAM2: 1.60).
- **TUM RGB-D mode**: avg 1.47 cm — best among rendering-based methods (ESLAM 2.00, Point-SLAM 3.04) and better than BAD-SLAM (1.50) which has loop closure.
- **Replica RGB-D ATE**: 0.58 cm avg (0.32 cm single-process, best in 6/8 sequences vs Point-SLAM's 0.53).
- **Replica rendering**: PSNR 38.94 dB, SSIM 0.968, LPIPS 0.070 at 769 rendering FPS — vs Point-SLAM 35.17 dB at 1.33 FPS (which needs depth-guided ray sampling).
- **Memory**: 2.6 MB (mono) / 3.97 MB (RGB-D) map on TUM vs 40 MB for NICE-SLAM.
- **Convergence basin**: pose optimisation from displaced starts converges in 79–82% of trials vs 14% (hash-grid SDF) and 33% (MLP SDF) — Gaussians form a smooth gradient field in 3D, unlike hashing/positional encoding.
- Ablations: removing $E_{iso}$ degrades monocular ATE from 3.96 to 4.83; removing keyframe selection, to 8.73. Qualitatively it reconstructs thin wires and transparent objects that depth sensors miss.

## Why it matters for SLAM

MonoGS is the canonical *monocular* entry point to Gaussian-splatting SLAM: it showed that a rendering-quality map and camera tracking can share one differentiable representation at interactive rates. Its analytic-Jacobian, direct-alignment formulation connects splatting SLAM back to the direct methods (DTAM, LSD-SLAM, DSO) — the same photometric principle applied to a far richer map — and its covisibility keyframing echoes DSO's window management. It comes from the same Imperial College lab as MonoSLAM and iMAP, each of which redefined the map representation of its era.

## Hands-on

- [Run Gaussian Splatting SLAM](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/gaussian_splatting_slam)

## Related

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [Photo-SLAM](photo-slam.md)
- [DTAM](dtam.md)
- [DSO](dso.md)
- [Lie groups](../level-02-getting-familiar/lie-groups.md)
