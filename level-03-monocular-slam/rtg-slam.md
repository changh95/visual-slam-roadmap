# RTG-SLAM

> Peng 2024 · [Paper](https://arxiv.org/abs/2404.19706)

**One-line summary** — Real-time Gaussian SLAM (SIGGRAPH 2024) scales 3DGS reconstruction to large scenes with a compact binary-opacity Gaussian representation, surfel-style depth rendering, and an on-the-fly scheme that optimises only unstable Gaussians and renders only their pixels.

## Problem

Early 3DGS SLAM systems optimised every Gaussian and rendered every pixel each frame, so cost grows with map size — the fastest concurrent Gaussian SLAM reported 8.34 fps on synthetic Replica, and none showed complete real large scenes. Vanilla 3DGS also fits surfaces with many overlapping semi-transparent Gaussians, wasteful in memory and compute. RTG-SLAM is "a real-time 3D reconstruction system with an RGBD camera for large-scale environments using Gaussian splatting", built so that per-frame cost tracks *change*, not map size.

## Method & architecture

Each Gaussian carries position $\mathbf{p}_i$, covariance $\boldsymbol{\Sigma}_i$ (scale $\mathbf{s}_i$ + quaternion $\mathbf{q}_i$), opacity $\alpha_i$ and SH coefficients, and is additionally treated as an ellipsoid disc (surfel) with normal $\mathbf{n}_i$, confidence count $\eta_i$ and timestamp $t_i$. Opacity is fixed at creation: **opaque** ($\alpha=0.99$, fits surface and dominant colour) or **nearly transparent** ($\alpha=0.1$, fits residual colour) — no deep alpha-compositing stacks.

- **Colour vs depth rendering**: colour uses standard alpha-blending $\hat{\mathbf{C}}(\mathbf{u})=\sum_{i=1}^{n}\mathbf{c}_{i}f_{i}(\mathbf{u})\prod_{j=1}^{i-1}(1-f_{j}(\mathbf{u}))$ with $f(\mathbf{u})=\alpha_{i}\exp(-\frac{1}{2}(\mathbf{u}-\boldsymbol{\mu})^{\top}\boldsymbol{\Sigma}_{2D,i}^{-1}(\mathbf{u}-\boldsymbol{\mu}))$, plus a light-transmission map $\hat{\mathbf{T}}(\mathbf{u})=\prod_{i}(1-f_{i}(\mathbf{u}))$. Depth is rendered *differently*: the first opaque Gaussian along the ray with $\alpha^{\mathbf{r}}_{j}>\delta_{\alpha}=e^{-0.5}$ is treated as a disc, and the pixel depth comes from the ray-plane intersection

$$\mathbf{p}_{G_{j}^{\mathbf{r}},\mathbf{r}}=(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\,\theta_{\mathbf{u}}+\mathbf{t}_{g},\qquad \theta_{\mathbf{u}}=\frac{(\mathbf{p}_{j}^{\mathbf{r}}-\mathbf{t}_{g})\cdot\mathbf{n}_{j}^{\mathbf{r}}}{(\mathbf{R}_{g}\mathbf{K}^{-1}\dot{\mathbf{u}})\cdot\mathbf{n}_{j}^{\mathbf{r}}},$$

  which is fully differentiable and lets a single opaque Gaussian fit a local surface patch alone. Normal and index maps fall out of the same pass.
- **Targeted Gaussian adding**: per frame, masks pick pixels needing geometry, $M_{s}$ where transmission $\hat{\mathbf{T}}_{k}(\mathbf{u})>\delta_{\mathbf{T}}=0.5$ (newly observed) or $|\hat{\mathbf{D}}_{k}-\mathbf{D}_{k}|>\delta_{d}=0.1$ (depth error), and $M_{c}$ where only colour error exceeds $\delta_{c}=0.1$; 5% of masked pixels are sampled. $M_s$ pixels spawn opaque Gaussians; $M_c$ pixels spawn small transparent ones only if their existing opaque Gaussian is already stable.
- **Stable/unstable optimisation**: Gaussians with confidence $\eta>\delta_{\eta}$ are stable and frozen; "we only optimize the unstable Gaussians and only render the pixels occupied by unstable Gaussians", using $L=w_{c}L_{color}+w_{d}L_{depth}+w_{reg}L_{reg}$ ($L_1$ colour/depth losses; $L_{reg}$ pins transparent Gaussians' geometry; $w_c=w_d=1$, $w_{reg}=1000$). Optimised windows are fused with previous state by weighted averaging $G_{o}=(1-w_{curr})G_{o-1}+w_{curr}G^{\prime}_{o}$ to avoid forgetting; stable Gaussians with repeated errors revert to unstable, and long-term unstable ones are deleted as outliers.
- **Tracking**: classical frame-to-model ICP against the rendered depth/normal maps, minimising the point-to-plane error $E(\boldsymbol{\xi})=\sum\lVert(\mathbf{T}_{g,k}\mathbf{V}_{k}^{l}(\mathbf{u})-\hat{\mathbf{V}}_{k-1}^{g*}(\hat{\mathbf{u}}))\cdot\hat{\mathbf{N}}_{k-1}^{*}(\hat{\mathbf{u}})\rVert$ with multi-level ICP, plus an ORB-SLAM2-style landmark/pose-graph back-end; keyframes (every 30° or 0.3 m) trigger global optimisation of the top-40%-error pixels.

## Results

On an i9-13900KF + RTX 4090, with an Azure Kinect for live scanning:

- **Real large scenes**: corridor, storeroom, hotel room, home, office (43–100 m²) reconstructed live at around 16 fps. On the ~70 m² home scene: 17.9 fps and 8.8 GB memory vs Co-SLAM's 8.65 fps / 17.3 GB ("around twice the speed and half the memory cost" of SOTA NeRF SLAM); SplaTAM manages 0.31 fps and runs out of memory, using 7,155,880 Gaussians before OOM vs RTG-SLAM's 987,524.
- **Replica office0 throughput**: 17.24 FPS overall; tracking 0.02 s/frame, mapping 3.5 ms/iteration, 2751 MB peak — roughly 46x SplaTAM's reconstruction speed.
- **TUM ATE RMSE**: 1.66 / 0.38 / 1.13 cm (fr1_desk / fr2_xyz / fr3_office), avg 1.06 cm — beating ESLAM (2.11), Point-SLAM (2.38), SplaTAM (3.39) and close to ORB-SLAM2 (1.00).
- **ScanNet++ geometry (GT poses)**: accuracy 0.95 cm / completion 1.11 cm, better than SplaTAM (1.32/1.54) and every NeRF method except Point-SLAM (which consumes ground-truth depth for sampling).
- Ablations show compact Gaussians need far fewer primitives for the same depth accuracy than alpha-blended depth, and that opaque-only maps suffer colour errors from new views without the transparent residual layer.

## Why it matters for SLAM

RTG-SLAM showed how to make Gaussian SLAM computation proportional to what changed rather than to map size — the same insight that made classical large-scale SLAM tractable (local BA, covisibility windows), translated to the splatting era via KinectFusion-style ICP tracking and surfel-style confidence bookkeeping. Its stable/unstable state management and disc-based depth rendering became reference designs for scaling Gaussian SLAM to real buildings and real robots.

## Related

- [SplaTAM](splatam.md)
- [Photo-SLAM](photo-slam.md)
- [GS-ICP SLAM](gs-icp-slam.md)
- [MonoGS](monogs.md)
- [EGG-Fusion](egg-fusion.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
