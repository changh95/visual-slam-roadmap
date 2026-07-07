# BundleFusion

> Dai 2016 · [Paper](https://arxiv.org/abs/1604.01093)

**One-line summary** — Globally consistent real-time RGB-D reconstruction via hierarchical local-to-global pose optimization, with on-the-fly TSDF de-integration and re-integration whenever poses are corrected.

## Problem

Scalable real-time 3D scanning suffers from pose drift that accumulates significant errors in the reconstructed model; global correction traditionally required hours of offline processing. The online methods that existed either needed minutes to perform correction (not truly real-time), used brittle frame-to-frame or frame-to-model tracking that failed catastrophically without recovery, or supported only unstructured point representations that limit scan quality. BundleFusion set out to solve all three at once: globally optimized (i.e. bundle-adjusted) poses, robust tracking with relocalization, and a high-quality volumetric model — all in real time.

## Method & architecture

Input is a 30 Hz, 640×480 RGB-D stream $S = \{f_i = (C_i, D_i)\}$; the goal is rigid transforms $T_i(p) = R_i p + t_i$ mapping each frame into world space. Instead of temporal tracking, every new frame is localized against the *complete history* of input — loop closure is implicit and continuous, and relocalization comes for free.

**Sparse correspondence search.** SIFT keypoints are detected (4–5 ms/frame) and matched on GPU against all previous frames (≈0.05 ms per pair, feasible against 20K+ frames). Matches pass three filters: a Kabsch-based keypoint filter (rigid fit with condition analysis; correspondences pruned until max residual < 0.02 m), a surface-area filter (spanned area must exceed 0.032 m²), and a dense two-sided geometric/photometric verification on 80×60 downsampled frames (pair invalidated if reprojection error > 0.075 m). A frame pair needs $N_{\min} = 5$ valid matches.

**Hierarchical local-to-global optimization.** Consecutive frames are grouped into chunks of $N_{\mathrm{chunk}} = 11$ (overlapping by 1). Chunks are bundle-adjusted internally; each chunk contributes one keyframe with an aggregated feature set to a second-level global optimization over all keyframes. Both levels minimize the same energy over stacked pose parameters $X$:

$$E_{\mathrm{align}}(X) = w_{\mathrm{sparse}} E_{\mathrm{sparse}}(X) + w_{\mathrm{dense}} E_{\mathrm{dense}}(X)$$

$$E_{\mathrm{sparse}}(X) = \sum_{i}\sum_{j}\sum_{(k,l) \in C(i,j)} \left\| T_i\, p_{i,k} - T_j\, p_{j,l} \right\|_2^2$$

where $p_{i,k}$ is the $k$-th feature point of frame $i$ and $C(i,j)$ its correspondences with frame $j$. The dense term $E_{\mathrm{dense}} = w_{\mathrm{photo}} E_{\mathrm{photo}} + w_{\mathrm{geo}} E_{\mathrm{geo}}$ combines photometric alignment on luminance gradients $I_i$ and a point-to-plane geometric term, evaluated on frame pairs $E$ with similar viewing angle (within 60°) and overlap:

$$E_{\mathrm{photo}}(X) = \sum_{(i,j) \in E}\sum_{k} \left\| I_i\big(\pi(d_{i,k})\big) - I_j\big(\pi(T_j^{-1} T_i\, d_{i,k})\big) \right\|_2^2$$

$$E_{\mathrm{geo}}(X) = \sum_{(i,j) \in E}\sum_{k} \Big[ n_{i,k}^{\top} \Big( d_{i,k} - T_i^{-1} T_j\, \pi^{-1}\big( D_j\big(\pi(T_j^{-1} T_i\, d_{i,k})\big) \big) \Big) \Big]^2$$

with $\pi$ the perspective projection, $d_{i,k}$ the 3D point of pixel $k$ and $n_{i,k}$ its normal. $w_{\mathrm{dense}}$ is increased linearly so sparse terms fix global structure first, then dense terms refine within their basin of convergence. The non-linear least squares is solved by Gauss-Newton with a data-parallel GPU PCG solver (Jacobi preconditioner, $J_F$ and $J_F^{\top}$ applied in separate kernels). After each solve, if the maximum residual exceeds 0.05 m all correspondences of the offending frame pair are removed — a final outlier safeguard.

**On-the-fly re-integration.** Geometry is fused into a voxel-hashed TSDF (8³ voxel blocks). Integration of depth sample $d_i(v)$ with weight $w_i(v)$, and its exact inverse (de-integration), are:

$$D'(v) = \frac{D(v)\,W(v) + w_i(v)\,d_i(v)}{W(v) + w_i(v)}, \qquad W'(v) = W(v) + w_i(v)$$

with subtraction in place of addition to de-integrate. Each frame stores its *integrated* and *optimized* pose; per new input frame, the $N_{\mathrm{fix}} = 10$ frames with the largest pose discrepancy are de-integrated at the old pose and re-integrated at the new one, so the dense model continuously converges to the optimized trajectory — no map deformation needed.

## Results

Live scanning used a Structure Sensor on an iPad streaming to a desktop; the pipeline runs at well beyond 30 Hz split across two GPUs (GTX Titan X + Titan Black), with 4 mm default voxels. Captured scenes — 4 offices, 2 apartments, 1 copyroom, trajectories up to 95 m and over 20,000 frames — show drift-free alignment and completeness on par with offline approaches. On the synthetic ICL-NUIM benchmark, ATE RMSE is kt0 0.6 cm, kt1 0.4 cm, kt2 0.6 cm, kt3 1.1 cm — outperforming online (e.g. ElasticFusion: 0.9/0.9/1.4/10.6 cm) and offline (Redwood rigid: 25.6/3.0/3.3/6.1 cm) state of the art. On TUM RGB-D: fr1/desk 1.6 cm, fr2/xyz 1.1 cm, fr3/office 2.2 cm, fr3/nst 1.2 cm, on par with or better than prior systems. Ablations (sparse-only vs sparse+local-dense vs full) confirm each stage of the sparse-to-dense design adds accuracy. The system recovers from tracking failure (sensor occlusion, featureless regions) by continuing to localize against global keyframes, and was later used to capture the ScanNet dataset.

## Why it matters for SLAM

BundleFusion solved the problem that had haunted volumetric SLAM since KinectFusion: how to correct the dense map after loop closure without deformation artifacts. The de-integration/re-integration mechanism is the TSDF-world answer to ElasticFusion's map deformation, defining one side of the fundamental design fork in dense SLAM. Whenever a modern dense system needs to reconcile "poses change after optimization" with "the map is already fused", it is reusing this playbook.

## Related

- [KinectFusion](kinectfusion.md) — the fixed-volume TSDF fusion ancestor
- [ElasticFusion](elasticfusion.md) — the competing surfel-deformation approach to global consistency
- [InfiniTAM v3](infinitam-v3.md) — voxel-hashing framework for scalable TSDF storage
- [BAD SLAM](bad-slam.md) — later direct BA over dense geometry
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the design fork BundleFusion sits on
