# EGG-Fusion

> Pan 2025 · [Paper](https://arxiv.org/abs/2512.01296)

**One-line summary** — SIGGRAPH Asia 2025 real-time RGB-D reconstruction that fuses geometry-aware Gaussian surfels on the fly with an information-filter update explicitly modelling sensor noise, so differentiable optimisation only has to polish an already near-converged map.

## Problem

Differentiable-rendering SLAM (NeRF- and 3DGS-based) delivers photorealistic maps, but "current differentiable rendering methods face dual challenges in real-time computation and sensor noise sensitivity, leading to degraded geometric fidelity in scene reconstruction and limited practicality." The high degrees of freedom of 3DGS ellipsoids introduce geometric ambiguities, mapping by backpropagation costs many gradient iterations per frame, and treating noisy consumer-grade depth as ground truth corrupts the recovered surfaces. EGG-Fusion targets real-time throughput and noise-aware, high-precision surface geometry at once.

## Method & architecture

The scene is a set of 2D Gaussian surfels $\mathcal{S}=\{S_{i}:(\textbf{p}_{i},\textbf{s}_{i},\textbf{r}_{i},o_{i},\textbf{c}_{i})\}$ — disc-shaped primitives with centre, two ellipse-axis scales, rotation, opacity, and SH colour — rendered by depth-sorted alpha compositing ($T_{i}=\prod_{j<i}(1-\alpha_{j})$, $\hat{C}=\sum_{i}T_{i}\alpha_{i}\textbf{c}_{i}$, with depth/normal maps blended analogously). Two modules run per frame: sparse-to-dense camera tracking, then explicit surfel fusion followed by a short differentiable optimisation.

- **Geometry-aware surfel initialisation**: new surfels are spawned only in low-opacity zones and positive-depth-disparity regions (new foreground), with a depth-adaptive scale $\mathbf{s}=[\alpha_{s}\cdot d/f_{x},\,\alpha_{s}\cdot d/f_{y}]$ ($d$ = depth, $\alpha_s=2.0$), so far surfels are larger but project to a consistent image footprint — better rendering for the same surfel count than fixed scales.
- **Surfel fusion with information filter** (the core contribution): each surfel's geometric state $\mathbf{x}^{t}=[\mathbf{p},\mathbf{n}]^{\top}\in\mathbb{R}^{6}$ carries covariance $\boldsymbol{\Sigma}^{t}$; a re-observation $\mathbf{z}^{t}=[V_{t}(\mathbf{u}),N_{t}(\mathbf{u})]^{\top}$ obeys $\mathbf{z}^{t}=\mathbf{H}\mathbf{x}^{t}+\bar{\mathbf{t}}+\boldsymbol{\epsilon}$, $\boldsymbol{\epsilon}\sim\mathcal{N}(0,\boldsymbol{\Sigma}_{\mathbf{z}}^{t})$, where $\mathbf{H}$ holds the camera rotation and the noise variances $\sigma_p,\sigma_n$ grow with the square of depth (sensor model). The recursive Bayesian update is done in information form:

$$\boldsymbol{\Lambda}^{t}=\boldsymbol{\Lambda}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{H},\qquad \boldsymbol{\eta}^{t}=\boldsymbol{\eta}^{t-1}+\mathbf{H}^{\top}\boldsymbol{\Lambda}^{t}_{\mathbf{z}}\mathbf{z}^{t},\qquad \hat{\mathbf{x}}^{t}=(\boldsymbol{\Lambda}^{t})^{-1}\boldsymbol{\eta}^{t},$$

  a closed-form single pass per observation (diagonal covariances keep it cheap). The updated normal defines a unique rotation increment $\Delta\textbf{R}(\textbf{n}_{tg},\theta)$ about $\mathbf{n}_{tg}=\mathbf{n}_{g}\times\mathbf{n}_{t}$ applied to the surfel; $\text{tr}(\boldsymbol{\Lambda})$ doubles as a per-surfel confidence for extracting reliable surfaces.
- **Differentiable surfel optimisation**: a local map of the last $N_{\text{batch}}$ frames is refined with $\mathcal{L}_{total}=\mathcal{L}_{c}+w_{d}\mathcal{L}_{d}+w_{n}\mathcal{L}_{n}+w_{reg}\cdot\mathcal{L}_{reg}$, where $\mathcal{L}_{c},\mathcal{L}_{d}$ are $L_1$ colour/depth losses, $\mathcal{L}_{n}=|1-\gamma|$ penalises normal misalignment, and $\mathcal{L}_{reg}=|\textbf{p}-\textbf{p}_{f}|+w^{n}_{reg}\cdot|1-\textbf{n}\cdot\textbf{n}_{f}|$ anchors surfels to their filter-fused geometry $\textbf{p}_f,\textbf{n}_f$. Because fusion leaves surfels near convergence, only ~9 iterations per mapping step are needed.
- **Sparse-to-dense tracking**: an initial pose from LM over sparse 2D-3D reprojection errors, $\boldsymbol{\xi}_{t}^{(0)}=\arg\min\sum_{\mathcal{M}}\rho(|\mathbf{u}_{i}-\Pi(\exp(\boldsymbol{\xi}_{t})\cdot\textbf{X}_{i}^{w})|^{2})$, is refined by dense joint alignment $E_{\text{dense}}=E_{\text{icp}}+\lambda_{\text{photo}}E_{\text{photo}}$ (point-to-plane ICP against the global model plus photometric error), with a convergence check to reject degenerate refinements.

## Results

Evaluated on Replica, TUM-RGBD, ScanNet++, and three self-captured Azure Kinect outdoor scenes:

- **Surface reconstruction (points sampled from Gaussians)**: accuracy 0.60 cm on Replica / 0.67 cm on ScanNet++ with accuracy ratio 99.99% / 99.98% within 3 cm — vs RTG-SLAM 0.80/1.06 cm and SplaTAM 2.87/1.71 cm; the abstract's "over 20% improvement in accuracy compared to state-of-the-art GS-based methods."
- **Tracking**: Replica ATE avg 0.17 cm (RTG-SLAM 0.18, SplaTAM 0.39); TUM avg 4.47 cm online — best among real-time differentiable systems (RTG-SLAM 5.12, SplaTAM 5.48) — and 1.98 cm for the offline variant with global optimisation.
- **Rendering (ScanNet++)**: novel-view PSNR 25.70 / SSIM 0.907 vs RTG-SLAM 24.77/0.882 and SplaTAM 24.75/0.900; training-view PSNR 29.06.
- **Speed/memory (Replica off0)**: 24.21 FPS with mapping at 0.071 s per frame (7.5 ms x 9 iterations) and 1.8 GB memory — vs RTG-SLAM 15.73 FPS / 2.7 GB and SplaTAM 0.19 FPS / 9.1 GB.
- **Ablations**: without sparse initialisation, dense tracking fails outright on fr1/room and fr3/office; removing the information-filter fusion degrades ScanNet++ point accuracy from 0.67 to 0.73 cm and shows visibly noisier surfaces on distant, noise-prone objects.

## Why it matters for SLAM

Most 3DGS-SLAM systems (SplaTAM, MonoGS) optimise the map by backpropagation through a renderer, iterating until the loss cooperates. EGG-Fusion shows an alternative lineage: treat Gaussians as *state to be filtered*, not parameters to be trained — the estimation-theoretic, confidence-weighted fusion of classical surfel SLAM (ElasticFusion) upgraded to a differentiable, renderable representation. Closed-form fusion plus a few polish iterations makes dense photorealistic maps compatible with genuine real-time incremental operation and gives principled per-primitive uncertainty, both essential for deployable Gaussian-map SLAM.

## Related

- [SplaTAM](splatam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [RTG-SLAM](rtg-slam.md)
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
