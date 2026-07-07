# iMAP

> Sucar 2021 · [Paper](https://arxiv.org/abs/2103.12352)

**One-line summary** — The first NeRF-style SLAM system: a single MLP, trained live with no prior data, serves as the *only* scene representation for real-time RGB-D tracking and mapping.

## Problem

Dense RGB-D SLAM had always relied on explicit map structures — TSDF voxel grids (KinectFusion), surfels (ElasticFusion) — which need careful memory management, fix their resolution up front, and leave holes wherever the camera never looked. NeRF had just shown that an MLP can represent a scene continuously and compactly, but only via hours of offline training on posed images. iMAP asked whether an MLP could be *the* map of a live SLAM system: "trained in live operation without prior data", on a stream from a handheld RGB-D camera, while simultaneously being used for tracking.

## Method & architecture

**Map network.** A single MLP with 4 hidden layers of width 256 maps a 3D point to colour and volume density, $F_{\theta}(\mathbf{p})=(\mathbf{c},\rho)$ — no viewing direction (specularities are not modelled). Inputs pass through an *optimisable* Gaussian positional embedding $\sin(\mathbf{B}\mathbf{p})$ ($\mathbf{B}$ an $n\times 3$ matrix, $\sigma=25$, embedding size 93), also concatenated into the second layer.

**Differentiable rendering.** For pixel $[u,v]$ with pose $T_{WC}$, $N$ samples $\mathbf{p}_i=d_i\mathbf{r}$ are taken along the back-projected ray (32 coarse + 12 fine bins). Density becomes occupancy $o_{i}=1-\exp(-\rho_{i}\delta_{i})$ with $\delta_i=d_{i+1}-d_i$, ray-termination weights are $w_{i}=o_{i}\prod_{j=1}^{i-1}(1-o_{j})$, and depth, colour, and depth variance render as

$$\hat{D}[u,v]=\sum_{i=1}^{N}w_{i}d_{i},\quad\hat{I}[u,v]=\sum_{i=1}^{N}w_{i}\mathbf{c}_{i},\quad\hat{D}_{var}[u,v]=\sum_{i=1}^{N}w_{i}(\hat{D}[u,v]-d_{i})^{2}$$

**Joint optimisation (mapping).** Network weights $\theta$ and keyframe poses $\{T_i\}$ are optimised together with ADAM on sparse pixel samples $s_i$, minimising $L_{g}+\lambda_{p}L_{p}$ ($\lambda_p=5$), where the photometric loss is an L1 error and the geometric loss is variance-normalised to down-weight uncertain regions like object borders:

$$L_{g}=\frac{1}{M}\sum_{i=1}^{W}\sum_{(u,v)\in s_{i}}\frac{\left|D_{i}[u,v]-\hat{D}_{i}[u,v]\right|}{\sqrt{\hat{D}_{var}[u,v]}}$$

**Parallel tracking.** Following the PTAM split, a separate process optimises only the live camera pose against the *locked* network with the same losses, at ~10 Hz, while joint mapping runs at ~2 Hz; both are plain PyTorch multi-processing on one desktop GPU.

**Keyframe selection against forgetting.** A frame becomes a keyframe when the fraction $P$ of pixels whose normalised depth error is under $t_D=0.1$ (w.r.t. a locked map snapshot) falls below $t_P=0.65$ — i.e., it sees significantly new regions. The keyframe set acts as a replay memory bank so the single MLP does not catastrophically forget earlier parts of the scene.

**Active sampling.** Only 200 pixels per image are rendered per iteration. Each image is split into an $8\times 8$ grid; the average loss per cell is normalised into a distribution $f_{i}[j]=L_{i}[j]/\sum_{m}L_{i}[m]$ and new samples are allocated proportionally, concentrating computation where the map is uncertain. The same loss-proportional scheme allocates samples *across* keyframes, and each mapping iteration optimises a bounded window of $W=5$ frames (3 loss-sampled keyframes + last keyframe + live frame).

## Results

- **Replica (8 room-scale scenes, 2000-frame trajectories)**: average Accuracy 4.43 cm, Completion 5.56 cm, Completion Ratio (<5 cm) 79.06% with only ~13 keyframes on average — vs TSDF fusion (given iMAP's poses) at 3.45 cm / 6.63 cm; iMAP achieves ~4% higher average completion ratio (+11% on office-3), thanks to plausible filling-in of unobserved regions.
- **Memory**: whole rooms are mapped with an MLP of ~1 MB of parameters, vs TSDF grids of 8.38 / 67.10 / 536.87 MB at resolutions 128/256/512.
- **TUM RGB-D (ATE RMSE)**: 4.9 / 2.0 / 5.8 cm on fr1-desk / fr2-xyz / fr3-office — not beating BAD-SLAM (1.7/1.1/1.73) or ORB-SLAM2 (1.6/0.4/1.0) but competitive at 2–6 cm, and unlike them it fills holes in unobserved regions.
- **Timing**: 101 ms for 6 tracking iterations and 448 ms for 10 mapping iterations (concurrent, same GPU) — 10 Hz tracking, 2 Hz map updates; active sampling converges faster and completes more than random sampling.
- Also shown live on handheld Azure Kinect recordings, including black, reflective, and transparent surfaces where depth sensors fail — the photometric loss plus network interpolation recovers them.

## Why it matters for SLAM

iMAP kicked off the entire neural-implicit SLAM line of research. The tracking/mapping split against a differentiable map — pose optimisation against a frozen map, map optimisation against replayed keyframes — established here is still the template used by NeRF- and 3DGS-based SLAM today. It also reframed what a "map" is: not a data structure you insert points into, but a function you fit, with continuity, compactness, and hole-filling for free. Its single-MLP capacity limits (forgetting, over-smoothing in larger scenes) directly motivated NICE-SLAM's hierarchical grids, Co-SLAM's hash grids, and eventually the community's switch to explicit 3D Gaussian maps.

## Related

- [NICE-SLAM](nice-slam.md)
- [Co-SLAM](co-slam.md)
- [NeRF](../level-05-deep-learning/nerf.md)
- [NeRF-SLAM](nerf-slam.md)
- [SplaTAM](splatam.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [PTAM](ptam.md)
