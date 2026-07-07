# MASt3R-SLAM

> Murai 2024 · [Paper](https://arxiv.org/abs/2412.12392)

**One-line summary** — The first real-time dense SLAM system designed bottom-up from a two-view 3D reconstruction prior (MASt3R), producing globally consistent poses and dense maps from uncalibrated monocular video at 15 FPS.

## Problem

Classical dense monocular SLAM needs a calibrated camera, and gets its geometry either from a depth sensor or from fragile multi-view stereo; it degrades badly on in-the-wild video. MASt3R offers the opposite trade-off: a powerful two-view reconstruction and matching prior that is robust and calibration-free, but with no notion of keyframes, global consistency, or real-time operation — its dense matching alone takes ~2 seconds per pair. MASt3R-SLAM builds a full SLAM system bottom-up from this prior, keeping its generality while adding everything SLAM requires.

## Method & architecture

**Pipeline**: each frame is paired with the current keyframe and passed through MASt3R, $\mathcal{F}_M(\mathcal{I}^f, \mathcal{I}^k)$, yielding pointmaps $\mathbf{X}$, confidences $\mathbf{C}$, matching features $\mathbf{D}$, and feature confidences $\mathbf{Q}$. Tracking estimates the relative pose and fuses geometry into the keyframe; the backend adds loop-closure edges via retrieval and runs second-order global optimization.

- **Sim(3) state, generic camera**: because network predictions have inconsistent scale, all poses live in $\mathbf{Sim}(3)$: $\mathbf{T} = \begin{bmatrix} s\mathbf{R} & \mathbf{t} \\ 0 & 1 \end{bmatrix}$, updated via $\mathbf{T} \leftarrow \operatorname{Exp}(\boldsymbol{\tau}) \circ \mathbf{T}$. The only camera assumption is a unique camera centre: $\psi(\mathbf{X}^i_i)$ normalizes a pointmap into unit rays, so *each pointmap defines its own camera model* — handling zoom and distortion for free.
- **Iterative projective matching**: instead of a global feature search, each point $\mathbf{x} \in \mathbf{X}^j_i$ is projected into the reference frame by iteratively optimizing its pixel location with Levenberg–Marquardt, $\mathbf{p}^* = \arg\min_{\mathbf{p}} \|\psi([\mathbf{X}^i_i]_{\mathbf{p}}) - \psi(\mathbf{x})\|^2$ (equivalent to minimizing the ray angle since $\|\psi_1 - \psi_2\|^2 = 2(1 - \cos\theta)$), then refined by feature similarity in a local window. Custom CUDA kernels do this in ~2 ms — versus 2 s for MASt3R's own matching, making the whole system nearly 40× faster.
- **Ray-based tracking**: minimizing 3D point error is skewed by inconsistent depth predictions, so tracking instead minimizes a bounded angular ray error over matches (Huber norm $\rho$, confidence weights $w(\mathbf{q}, \sigma_r^2)$ with $\mathbf{q}_{m,n} = \sqrt{\mathbf{Q}^f_{f,m} \mathbf{Q}^k_{f,n}}$):

$$E_r = \sum_{m,n \in \mathbf{m}_{f,k}} \left\| \frac{\psi\big(\tilde{\mathbf{X}}^k_{k,n}\big) - \psi\big(\mathbf{T}_{kf} \mathbf{X}^f_{f,m}\big)}{w(\mathbf{q}_{m,n}, \sigma_r^2)} \right\|_\rho ,$$

  solved by Gauss–Newton IRLS, $(\mathbf{J}^\top \mathbf{W} \mathbf{J}) \boldsymbol{\tau} = -\mathbf{J}^\top \mathbf{W} \mathbf{r}$, with a small distance term to avoid pure-rotation degeneracy.
- **Pointmap fusion**: every tracked frame updates the keyframe's canonical pointmap by a running confidence-weighted average, $\tilde{\mathbf{X}}^k_k \leftarrow \big(\tilde{\mathbf{C}}^k_k \tilde{\mathbf{X}}^k_k + \mathbf{C}^k_f (\mathbf{T}_{kf} \mathbf{X}^k_f)\big) / \big(\tilde{\mathbf{C}}^k_k + \mathbf{C}^k_f\big)$ — filtering over geometry *and* over the camera model itself, since rays define it.
- **Loop closure**: new keyframes query an incremental ASMK retrieval database built from encoded MASt3R features; retrieved candidates are decoded by MASt3R and become graph edges if enough matches survive.
- **Second-order backend**: gauge freedom is handled by fixing the first $\mathbf{Sim}(3)$ pose; the ray error $E_g$ over all edges $\mathcal{E}$ (same form as $E_r$ with $\mathbf{T}_{ij} = \mathbf{T}_{WC_i}^{-1} \mathbf{T}_{WC_j}$) is minimized by Gauss–Newton with sparse Cholesky on the $7N \times 7N$ Hessian, all Jacobians analytical and accumulated in CUDA.
- **Calibrated mode**: if intrinsics are known, pointmaps are constrained along the known rays and residuals switch to pixel reprojection $E_\Pi$ — a simple modification that yields state-of-the-art accuracy.

## Results

Run on an i9-12900K + RTX 4090 at ~15 FPS (frames subsampled by 2 to simulate real time); ATE RMSE in metres with scaled trajectory alignment:

- **TUM RGB-D**: average ATE 0.030 with calibration — better than DROID-SLAM (0.038), GO-SLAM (0.035), and DPV-SLAM++ (0.054). Uncalibrated: 0.060, versus 0.158 for DROID-SLAM given GeoCalib intrinsics — comparable to calibrated DPV-SLAM.
- **7-Scenes**: average 0.047 calibrated (DROID-SLAM 0.049, NICER-SLAM 0.086); even the uncalibrated 0.066 beats NICER-SLAM, which uses depth/normal/flow priors and runs offline.
- **EuRoC**: 0.041 average across all 11 sequences (behind DROID-SLAM, which augments training with greyscale images).
- **ETH3D-SLAM**: best mean ATE and area-under-curve among monocular systems on the train sequences — the longest robustness tail.
- **Dense geometry** (7-Scenes): Chamfer 0.066 calibrated / 0.056 uncalibrated versus DROID-SLAM 0.077 and Spann3R 0.058.
- Ablations: weighted pointmap fusion beats keeping the most recent/first/median-confidence prediction; ray error beats 3D point error; the 2 ms projective matcher matches full MASt3R matching accuracy (ATE 0.039 vs 0.042 calibrated) at 1/1000th the time; loop closure improves both pose and geometry.

## Why it matters for SLAM

MASt3R-SLAM is plug-and-play: point it at video from an arbitrary camera — even one whose zoom or distortion varies — and get dense, globally consistent geometry with no depth sensor, no calibration procedure, no per-scene training. That redefined the baseline for what monocular dense SLAM should be expected to do, and its architecture (learned two-view prior + classical Sim(3) graph optimisation) is the template most foundation-model SLAM systems now follow.

## Related

- [MASt3R](mast3r.md)
- [DUSt3R](dust3r.md)
- [DROID-SLAM](droid-slam.md)
- [VGGT-SLAM](vggt-slam.md)
- [MASt3R-Fusion](mast3r-fusion.md)
- [Covisibility graph](covisibility-graph.md)
