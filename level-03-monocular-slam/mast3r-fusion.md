# MASt3R-Fusion

> Zhou 2025 · [Paper](https://arxiv.org/abs/2509.20757)

**One-line summary** — Tightly fuses the MASt3R feed-forward visual model with IMU and GNSS measurements in a hierarchical factor graph, giving foundation-model dense SLAM metric scale and global geo-referencing.

## Problem

Classical visual SLAM "often struggle[s] with low-texture environments, scale ambiguity, and degraded performance under challenging visual conditions"; feed-forward pointmap regression (MASt3R) fixes much of that by recovering high-fidelity geometry directly from images. But these new pipelines discard "the widely validated advantages of probabilistic multi-sensor information fusion": no metric scale from an IMU, no absolute geo-referencing from GNSS, no principled uncertainty bookkeeping. MASt3R-Fusion asks how to couple a feed-forward visual model *tightly* with inertial and GNSS sensing rather than post-hoc.

## Method & architecture

Two stages: **real-time SLAM** (sliding-window VIO with a feed-forward frontend) and **global optimization** (loop closure + GNSS over the full trajectory).

**Feed-forward visual measurement.** Following MASt3R-SLAM, each image is encoded to tokens $\mathbf{F}_i=\mathcal{F}_{\mathrm{enc}}(\mathbf{I}_i)$, and pairs are decoded jointly into pointmaps and descriptor maps

$$\mathbf{X}^{ij}_{i},\,\mathbf{X}^{ij}_{j},\,\mathbf{D}^{ij}_{i},\,\mathbf{D}^{ij}_{j}=\mathcal{F}_{\mathrm{dec}}\left(\mathbf{F}_{i},\mathbf{F}_{j}\right)$$

where $\mathbf{X}^{ij}_i,\mathbf{X}^{ij}_j$ are 2D-to-3D pointmaps in the reference frame of $i$. Dense matching is done by ray-proximity optimisation over the pointmaps, then refined with descriptor dot-products and a 4x bilinearly upsampled descriptor map for sub-pixel accuracy; correspondences with large depth residuals are masked out, which also rejects dynamic objects.

**Sim(3) pointmap-alignment constraints.** Each keyframe carries a pointmap $\mathbf{X}_i$ and a camera-to-world similarity $\mathbf{S}_i\in\mathrm{Sim}(3)$ (scale $s$, rotation $\mathbf{R}$, translation $\mathbf{t}$). For a matched pair, the residual combines reprojection with known depth and a depth term for pure-rotation cases:

$$\mathbf{r}_{ij}\left(\mathbf{S}^{i}_{j}\right)=\begin{bmatrix}\mathbf{u}^{i}_{j}-\pi\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)\\ \left(\mathbf{X}_{i}\left[\mathbf{u}^{i}_{j}\right]\right)_{z}-\left(\mathbf{S}^{i}_{j}\circ\mathbf{X}_{j}\right)_{z}\end{bmatrix}$$

with $\mathbf{S}^i_j=\mathbf{S}_i^{-1}\circ\mathbf{S}_j$ the relative Sim(3) transform. Unlike bundle adjustment, no per-point depths are optimised — the network's 3D structure is trusted up to scale, so visual constraints become compact pairwise factors. Each dense constraint is compressed on the GPU into Hessian form $\mathbf{H}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{J}^{r}_{ij}$, $\mathbf{v}_{ij}=(\mathbf{J}^{r}_{ij})^{\top}\mathbf{r}_{ij}$ — just a $7\times 7$ block per pair handed to the CPU solver.

**Isomorphic group transformation.** To fuse with metric-scale sensors, Sim(3) is factored as $\mathrm{SE}(3)\times\mathbb{R}$, and the Lie-algebra perturbations are related linearly by

$$\begin{bmatrix}\boldsymbol{\omega}\\ \boldsymbol{\nu}\\ \sigma\end{bmatrix}=\underbrace{\begin{bmatrix}1&&\\ &s\mathbf{I}&\\ &&s\end{bmatrix}}_{\boldsymbol{\Lambda}}\begin{bmatrix}\boldsymbol{\theta}\\ \boldsymbol{\tau}\\ \delta s\end{bmatrix}$$

so Sim(3) visual Hessians attach directly to SE(3) poses plus a per-keyframe scale $s_i$.

**Sliding-window factor graph.** The window state is $\mathcal{X}_i=(\mathbf{T}_i,s_i,\mathbf{v}_i,\mathbf{b}_i)$ — SE(3) pose, scale, velocity, IMU biases — in float64 (dense GPU work stays local in float32). Standard IMU preintegration factors $\mathbf{r}_b$ link consecutive keyframes, and old states are marginalised via Schur complement into a prior $(\mathbf{H}_m,\mathbf{v}_m)$. The real-time cost is

$$\sum_{i\in\mathcal{W}}\left\|\mathbf{r}_{\mathrm{b}}(\mathcal{X}_{i},\mathcal{X}_{i+1})\right\|^{2}+\sum_{(i,j)\in\mathcal{E}}\mathbf{E}_{\mathrm{v}}(\mathcal{X}_{i},\mathcal{X}_{j})+\mathbf{E}_{m}(\mathcal{X})$$

**Global SLAM.** Loop candidates come from feed-forward encoder-token retrieval, filtered by an efficient VIO-uncertainty test (distance uncertainty $\sigma_{p,q}$ from along-track/cross-track error propagation) before expensive dense verification. GNSS positions enter as factors $\mathbf{r}_g$ tied to keyframes via temporary IMU preintegration nodes to handle time offsets. A two-step global optimisation first uses Cauchy-robustified relative-pose loop constraints, then swaps inlier loops to full Hessian-form visual factors — keeping all V-I information instead of collapsing to a pose graph.

## Results

- **KITTI-360 (monocular VIO)**: average relative translation error is 43.0% lower than DM-VIO and 17.7% lower than DBA-Fusion (e.g., highway seq 0003: $t_{rel}$ 0.406% vs 1.146%/1.041%); visual-only MASt3R-SLAM essentially fails at this scale (RTEs of 21–55%).
- **KITTI-360 (global SLAM with loop closure)**: normalised ATE of 0.05% of trajectory length vs 0.63% for ORB-SLAM3 and 2.91% for VGGT-Long — e.g., 2.13 m ATE over the 8.4 km seq 0000 vs 26.03 m (ORB-SLAM3) and 103.64 m (VGGT-Long).
- **SubT-MRS (caves, mixed indoor/outdoor)**: VIO ATE 0.23% of length vs 0.41–1.74% for DBA-Fusion/ORB-SLAM3/DM-VIO; with loop closure 0.13% vs 0.37% (ORB-SLAM3), while visual-only VGGT-Long fails on all three sequences.
- **Wuhan urban dataset (V-I-GNSS)**: with real GNSS RTK, horizontal RMSE 0.21 m / 0.09 m on the two sequences vs 2.54/0.62 m for VINS-Fusion's loose global fusion; under simulated 100-second GNSS outages it keeps 0.37/0.46 m RMSE.
- Runs in real time on a laptop RTX 4080 Mobile GPU and handles arbitrarily long sequences in 8 GB of GPU memory. Code: [GREAT-WHU/MASt3R-Fusion](https://github.com/GREAT-WHU/MASt3R-Fusion).

## Why it matters for SLAM

MASt3R-Fusion demonstrates that 3D foundation-model front-ends are compatible with the classical multi-sensor factor-graph machinery that production systems rely on — you do not have to choose between learned dense geometry and rigorous sensor fusion. The Sim(3)-constraints-into-SE(3)-graph device (via the $\boldsymbol{\Lambda}$ isomorphism) is the key pattern to remember: it is how scale-ambiguous learned geometry gets grounded by metric sensors. It points at where deployed SLAM is heading: feed-forward models for perception, factor graphs for estimation, absolute sensors for grounding.

## Related

- [MASt3R-SLAM](mast3r-slam.md)
- [MASt3R](mast3r.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
- [Tightly-coupled vs Loosely-coupled](../level-06-vio-vins/tightly-coupled-vs-loosely-coupled.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
