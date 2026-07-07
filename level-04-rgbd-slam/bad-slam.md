# BAD SLAM

> Schöps 2019 · [Paper](https://openaccess.thecvf.com/content_CVPR_2019/html/Schops_BAD_SLAM_Bundle_Adjusted_Direct_RGB-D_SLAM_CVPR_2019_paper.html)

**One-line summary** — A direct bundle-adjustment RGB-D SLAM that jointly optimizes keyframe poses and a dense surfel map in real time on the GPU, released together with the high-precision ETH3D SLAM benchmark.

## Problem

Bundle adjustment — joint optimization of all camera and structure parameters — is the gold standard back-end for SLAM, but for dense RGB-D data the number of variables was considered too large: prior systems approximated it with pose-graph optimization, map deformation (Kintinuous, ElasticFusion), fragment alignment, or sparse-feature BA (BundleFusion, ORB-SLAM2). A second problem was evaluation: direct RGB-D systems are highly sensitive to rolling shutter, unsynchronized RGB/depth streams, and depth-calibration errors, and existing benchmarks recorded with consumer cameras conflate these hardware artifacts with algorithmic accuracy.

## Method & architecture

The front-end tracks each frame against the last keyframe with standard direct photometric+geometric alignment in $SE(3)$ (every 10th frame becomes a keyframe) and detects loops with binary-feature bag-of-words followed by direct alignment and a pose-graph initialization. The back-end — the paper's contribution — runs true direct BA over all keyframes $K$ and surfels $S$. A surfel $s$ is an oriented disc with center $\mathbf{p}_s$, normal $\mathbf{n}_s$, radius $r_s$, and a scalar descriptor $d_s$; there are no sparse features anywhere in the map. The cost projects each surfel into every keyframe $k$ where it has a correspondence:

$$C(K,S)=\sum_{k\in K}\sum_{s\in S_k}\Big[\rho_{\text{Tukey}}\big(\sigma_D^{-1}\,r_{\text{geom}}(s,k)\big)+w_{\text{photo}}\,\rho_{\text{Huber}}\big(\sigma_p^{-1}\,r_{\text{photo}}(s,k)\big)\Big]$$

with $w_{\text{photo}}=10^{-2}$ (depth is trusted more) and robust-loss parameter 10. The geometric term is a point-to-plane residual along the surfel normal,

$$r_{\text{geom}}(s,k)=\big(\mathbf{T}_{kG}\,\mathbf{n}_s\big)^{T}\Big(\pi_{D,k}^{-1}\big(\hat{\pi}_{D,k}(\mathbf{T}_{kG}\,\mathbf{p}_s)\big)-\mathbf{T}_{kG}\,\mathbf{p}_s\Big)$$

where $\mathbf{T}_{kG}$ maps global to keyframe coordinates, $\hat{\pi}_{D,k}$ projects to the nearest depth pixel and $\pi_{D,k}^{-1}$ back-projects its measured depth. It is normalized by a stereo depth-noise model $\sigma_{d_m}=\delta\,d_m^2\,(bf)^{-1}$ ($b$ baseline, $f$ focal length, $\delta=0.1$ px matching error). The photometric term compares a geometrically consistent intensity-gradient magnitude — sampled at the surfel center and two points $\mathbf{s}_1,\mathbf{s}_2$ on the disc boundary — against the stored descriptor:

$$r_{\text{photo}}(s,k)=\left\lVert\begin{pmatrix}I(\pi_{I,k}(\mathbf{s}_1))-I(\pi_{I,k}(\mathbf{p}_s))\\ I(\pi_{I,k}(\mathbf{s}_2))-I(\pi_{I,k}(\mathbf{p}_s))\end{pmatrix}\right\rVert_2-\,d_s$$

Optimization alternates instead of solving one huge system: per iteration, (1) update surfel normals by averaging corresponding measurement normals; (2) jointly optimize each surfel's position and descriptor by Gauss-Newton — positions move only along the normal ($\mathbf{p}_s+t\,\mathbf{n}_s$), so each surfel is an independent 2×2 solve, which also avoids ill-conditioned drift in textureless regions; (3) merge similar surfels; (4) optimize all keyframe poses with $\mathfrak{se}(3)$ local updates $\mathbf{T}_{kG}\exp(\hat{\epsilon})$; (5) optionally optimize intrinsics plus a per-pixel depth-deformation image (solved cheaply via Schur complement). Discrete surfel creation (one per uncovered 4×4 pixel cell), outlier deletion, and radius updates are interleaved. Everything is implemented in CUDA; alternating BA proved slightly better and faster than a PCG solver on the full Gauss-Newton system.

## Results

On TUM RGB-D (ATE RMSE), BAD SLAM reaches 1.7 / 1.1 / 1.7 cm on fr1-desk / fr2-xyz / fr3-office — second average rank (2.7) tied with BundleFusion, behind ORB-SLAM2 (rank 1.0); disabling its intrinsics/depth-deformation optimization degrades this to 3.6 / 1.2 / 2.5 cm, showing how much consumer-camera miscalibration matters. On synthetic re-renderings of TUM scenes, BAD SLAM wins outright (average ATE 0.15 cm clean vs 0.47 for ORB-SLAM2 and 0.34 for BundleFusion), and adding rolling shutter and asynchronous RGB-D degrades every method several-fold — motivating the new benchmark. The ETH3D SLAM benchmark (61 training + 35 test sequences, synchronized global-shutter active-stereo cameras, motion-capture ground truth, online leaderboard with withheld test GT) reverses the TUM ranking: BAD SLAM significantly outperforms ORB-SLAM2, BundleFusion, DVO SLAM, and ElasticFusion on both training and test sets, while the "hard" sequences (textureless scenes, fast motion, dynamics) defeat all evaluated methods. The system runs in real time on an i7-6700K + GTX 1080 (~370 ms of BA budget per keyframe at ~27 Hz input, one keyframe per 10 frames; the Fig. 1 scene holds ~335,000 surfels).

## Why it matters for SLAM

BAD SLAM demonstrated that the accuracy argument for bundle adjustment — long settled for sparse SLAM by Strasdat's "Why filter?" analysis — extends to fully dense RGB-D SLAM: joint pose-and-structure optimization removes the systematic biases of decoupled tracking-then-fusion pipelines. Just as lasting is its evaluation lesson: results on poorly calibrated, rolling-shutter benchmarks can invert the true ranking of methods, and its ETH3D benchmark became a standard evaluation suite for RGB-D SLAM. Reach for the ideas here when tracking-versus-mapping inconsistency, not sensor noise, is your accuracy bottleneck.

## Related

- [ElasticFusion](elasticfusion.md) — surfel mapping with decoupled frame-to-model tracking and map deformation
- [BundleFusion](bundlefusion.md) — global consistency via sparse-feature BA and TSDF re-integration
- [DVO](dvo.md) — robust direct RGB-D alignment, a precursor of dense direct methods
- [TSDF vs Surfel maps](tsdf-vs-surfel-maps.md) — the representation choice behind the system
- [DSO](../level-03-monocular-slam/dso.md) — the sparse direct BA counterpart in monocular SLAM
