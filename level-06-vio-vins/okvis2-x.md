# OKVIS2-X

> Boche & Leutenegger 2025 · [Paper](https://arxiv.org/abs/2510.04612)

**One-line summary** — OKVIS2-X extends OKVIS2 into a unified multi-sensor SLAM system fusing visual, inertial, measured or learned depth, LiDAR, and GNSS measurements, while building dense volumetric occupancy submaps — tightly coupled to the estimator — that scale to 9 km sequences in real time.

## Problem

Most state-of-the-art VI-SLAM systems build only sparse landmark maps that lack the geometric detail needed for downstream tasks (planning needs explicit *free space*, which point clouds and meshes don't represent), and each system is typically built around one fixed sensor suite. A robot carrying cameras, IMU, depth/LiDAR, and a GNSS receiver has traditionally needed to stitch together separate VIO, LiDAR-inertial, and mapping stacks. OKVIS2-X asks for all of it at once: highest accuracy and robustness, dense globally consistent volumetric occupancy maps, large-scale operation, and real-time performance — in a single configurable factor-graph framework.

## Method & architecture

OKVIS2-X keeps OKVIS2's frontend (BRISK keypoints, DBoW2 place recognition, optional Fast-SCNN sky segmentation), realtime estimator, and asynchronous loop optimization, and adds three modules: a **Depth Network**, a **Multi-Sensor Processor** (GNSS residuals, LiDAR motion undistortion, frame-to-map factors), and a **Submapping Interface**. Everything is combined in one objective:

$$c(\mathbf{x}) = \frac{1}{2}\sum_{i,k,j} \rho_{\mathrm{c}}\left({\mathbf{e}_{\mathrm{r}}^{i,j,k}}^T \mathbf{W}_{\mathrm{r}} \mathbf{e}_{\mathrm{r}}^{i,j,k}\right) + \frac{1}{2}\sum_{k} {\mathbf{e}_{\mathrm{s}}^{k}}^T \mathbf{W}_{\mathrm{s}}^{k} \mathbf{e}_{\mathrm{s}}^{k} + \frac{1}{2}\sum_{r,c} {\mathbf{e}_{\mathrm{p}}^{r,c}}^T \mathbf{W}_{\mathrm{p}}^{r,c} \mathbf{e}_{\mathrm{p}}^{r,c} + \frac{1}{2}\sum \rho_{\mathrm{t}}\left(e_{\mathrm{m}}^2\right) + \frac{1}{2}\sum_{j\in\mathcal{G}} {\mathbf{e}_{\mathrm{g}}^{j}}^T \mathbf{W}_{\mathrm{g}}^{j} \mathbf{e}_{\mathrm{g}}^{j},$$

i.e. reprojection, preintegrated IMU, marginalization-derived pose-graph, map-alignment (frame-to-map and map-to-map), and GNSS factors, with Cauchy ($\rho_{\mathrm{c}}$) and Tukey ($\rho_{\mathrm{t}}$) robustifiers.

- **Volumetric occupancy submaps** (Supereight2, multi-resolution): each submap is anchored to a keyframe, so estimator updates move submaps and keep them locally consistent. Occupancy log-odds $l({}_M\mathbf{p}) = \log\frac{P_{\text{occ}}}{1 - P_{\text{occ}}}$ are fused recursively, $L_k = \frac{L_{k-1} w_{k-1} + l}{w_{k-1} + 1}$ with saturating weight $w_k = \min(w_{k-1}+1,\, w_{\max})$. New submaps are triggered by overlap/keyframe-count criteria (drift within a submap assumed negligible).
- **Map alignment factors** tightly couple mapping and estimation: every measured point should lie on a surface ($L = 0$), and its distance from the nearest surface is extrapolated linearly from the occupancy field,
  $$e_{\mathrm{m}}^{a,b} = \frac{d}{\sigma} = \frac{L({}_{S_a}\mathbf{p})}{\sqrt{\frac{L_{\min}^2}{9} + \sigma_d^2\, \lvert \nabla L({}_{S_a}\mathbf{p}) \rvert^2}}, \qquad d = \frac{L}{\lvert\nabla L\rvert},$$
  applied frame-to-map (live frame vs. last completed submap) and map-to-map (between overlapping submaps, upon submap completion).
- **Learned depth as a sensor**: a stereo network and an MVS network are augmented with uncertainty decoders trained under a Laplacian loss, $\mathcal{L}_u = \sum_i \frac{\lvert u_i - u_{\text{gt}_i}\rvert}{\sigma_{u_i}} + \log \sigma_{u_i}$; the two depth estimates are fused inverse-variance-optimally, $\hat{d}_{\text{fuse}} = \sigma^2_{\text{fuse}}\left(\sigma^{-2}_{\text{st}} \hat{d}_{\text{st}} + \sigma^{-2}_{\text{mvs}} \hat{d}_{\text{mvs}}\right)$ with $\sigma^2_{\text{fuse}} = \left(\sigma^{-2}_{\text{st}} + \sigma^{-2}_{\text{mvs}}\right)^{-1}$, and the pixel-wise $\sigma_d$ weights the map factors — heuristic (linear LiDAR / quadratic RGB-D) noise models don't hold for network depth.
- **GNSS fusion**: the state is augmented with a 4-DoF transform $\mathbf{T}_{GW}$ to an ENU frame; the residual $\mathbf{e}_{\mathrm{g}}^{j} = \mathbf{z}^{j} - \left[\mathbf{C}_{GW}\left({}_W\hat{\mathbf{r}}_{S_j} + \hat{\mathbf{C}}_{WS_j}\, {}_S\mathbf{r}_A\right) + {}_G\mathbf{r}_W\right]$ uses IMU-propagated poses for asynchronous measurements and a known antenna lever arm ${}_S\mathbf{r}_A$. Initialization is gated on the yaw variance of the estimated transform; long dropouts trigger a loop-closure-like global re-alignment.
- **Online camera-IMU extrinsics calibration**: extrinsics enter not only reprojection factors but also the relative posegraph factors — the two-view Gauss-Newton system is augmented before landmark marginalization, extending the relative pose error to $\mathbb{R}^{6+6N}$ for $N$ cameras.

## Results

- **EuRoC**: VIO (causal, no loop closure) average ATE 0.066 m vs. OpenVINS 0.117 and Kimera2 0.112 — a 41% error reduction; VI-SLAM non-causal 0.030 m beats ORB-SLAM3 (0.035) and MAVIS-SLAM (0.034), 0.028 m with final BA. Mesh accuracy on V101–V103: 0.031–0.039 m vs. SimpleMapping 0.071–0.086 m, with higher completeness.
- **Hilti-Oxford (Hilti22)**: VI configuration outperforms all published competitors on the leaderboard; the VI-LiDAR configuration reduces average position error to 4.1 cm (2.8 cm excluding exp07), competitive with LiDAR-inertial Wildcat, and LiDAR carries the system through a vision-killing dark room (exp03).
- **VBR (Rome, up to 9 km)**: superior VI performance vs. ORB-SLAM3/OpenVINS; VI-LiDAR beats FAST-LIVO already causally with 1.771 m average error (0.06% of trajectory length), and survives missing-IMU episodes that break competitors. Simulated RTK-GNSS with a 75 s / 450 m dropout on Campus1: final-BA ATE 0.169 m over ~3 km.
- **Timing/memory** (i7-13700 + RTX 3080): Ours-vi runs up to 47 Hz on EuRoC MH05 (wall time 38.1 ms/frame vs. ORB-SLAM3's 64.7 ms); depth networks ≥13 Hz; GPU memory 3.51 GB; also runs onboard a drone on an NVIDIA Orin NX. Fully open source.

## Why it matters for SLAM

OKVIS2-X represents the current frontier of open-source multi-sensor SLAM: the sliding-window + pose-graph architecture pioneered by OKVIS/OKVIS2 generalizes cleanly from a camera-IMU pair to a full sensor suite, and dense occupancy mapping is promoted from passive by-product to a first-class factor that *improves* the trajectory. For practitioners it is a single configurable system (vi / vid / vil / vig / vidg / vilg) covering use cases that previously required stitching together separate VIO, LiDAR-inertial, and mapping stacks — and its maps explicitly represent free space, directly usable for safe navigation.

## Related

- [OKVIS2](okvis2.md)
- [OKVIS](okvis.md)
- [LiDAR-Visual-Inertial (LVI)](../level-09-lidar-visual-lidar-slam/lidar-visual-inertial-lvi.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
- [Multi-Sensor Fusion SLAM Survey](../level-09-lidar-visual-lidar-slam/multi-sensor-fusion-slam-survey.md)
- [Factor graph](../level-02-getting-familiar/factor-graph.md)
