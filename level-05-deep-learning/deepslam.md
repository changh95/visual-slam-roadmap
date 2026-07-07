# DeepSLAM

> Li 2020 · [Paper](https://ieeexplore.ieee.org/document/9047170)

**One-line summary** — DeepSLAM assembles a full monocular SLAM pipeline out of neural networks — Tracking-Net for pose, Mapping-Net for depth, Loop-Net for loop detection, plus g2o pose-graph optimization — trained fully unsupervised on stereo imagery and deployed on monocular video.

## Problem

By 2020, learned visual odometry existed in supervised (DeepVO/ESP-VO) and self-supervised (SfM-Learner) forms, but supervised variants needed expensive ground-truth trajectories, monocular self-supervision lost metric scale, and nearly all learned systems were odometry-only: no loop closing, so drift grew without bound. Geometric systems, meanwhile, are fragile in challenging scenes (rain, night, over-exposure) and cannot improve from data. DeepSLAM asks whether the *whole* classical SLAM decomposition — tracking, mapping, loop closure, graph optimization — can be reproduced with networks trained without any annotated ground truth.

## Method & architecture

**Front-end networks (test time, monocular input).** *Tracking-Net* is an RCNN — VGGNet convolutional layers feeding an LSTM over an image sequence (length 5) — that outputs relative 6-DoF poses and per-estimate uncertainties, directly yielding a *local pose graph* of $(n-1)$ relative poses per window. *Mapping-Net* is an encoder–decoder that predicts a dense, metrically scaled depth map (run every 5 frames). *Loop-Net* is an ImageNet-pre-trained Inception-ResNet-V2 (no SLAM-specific training) that embeds images into feature vectors; a pair is declared a loop when the cosine distance $d_{cos}=\cos(v_{1},v_{2})$ falls below a threshold, after which Tracking-Net (sequence length 2) computes the loop transform and **g2o** optimizes the combined local+global pose graph.

**Unsupervised training on stereo sequences.** Spatial (left–right) and temporal (frame-to-frame) geometric consistencies form the losses; stereo supplies metric scale, so no pose or depth labels are needed. With stereo baseline $B$ and focal length $f$, predicted depth $D_i$ gives the correspondence distance $H_{i}=Bf/D_{i}$, from which images are cross-warped. The left–right photometric loss (analogous for right-to-left, and for disparity maps $Q = H \times w$) is

$$L_{l,r}^{p}=\sum \lambda_{s}\, f_{s}(I_{l},I_{l}') + (1-\lambda_{s})\,\lVert I_{l}-I_{l}'\rVert_{1}, \qquad f_{s}(\cdot)=\tfrac{1-\mathrm{SSIM}(\cdot)}{2}$$

plus a pose-consistency loss between poses estimated from the left and right streams, $L^{o}=\lambda_{p}\lVert\hat{x}_{l}-\hat{x}_{r}\rVert_{1}+\lambda_{r}\lVert\hat{\varphi}_{l}-\hat{\varphi}_{r}\rVert_{1}$. Temporally, pixels warp between frames via

$$p_{k+1}' = K\,\hat{T}_{k,k+1}\,\hat{D}_{k}\,K^{-1}p_{k}$$

($K$ intrinsics, $\hat{T}_{k,k+1}$ predicted pose, $\hat{D}_k$ predicted depth), giving masked photometric losses and an ICP-like 3D geometric registration loss $L_{k,k+1}^{g}=\sum\lVert M_{g}^{k}E_{g}^{k}\rVert_{1}$ with $E_{g}^{k}=P_{k}-P_{k}'$ on back-projected point clouds.

**Uncertainty and outlier rejection.** The mean photometric/geometric errors define an uncertainty $\sigma_{k,k+1}=2\times S\big(\mu_{p}^{k}+\mu_{p}^{k+1}+\lambda_{e}(\mu_{g}^{k}+\mu_{g}^{k+1})\big)-1$ (Sigmoid $S$, range 0.5–1), which supervises Tracking-Net's uncertainty output and adaptively sizes bitwise error-map masks via the percentile $q_{th}=q_{0}+(1-q_{0})(1-\sigma_{k,k+1})$ — rejecting moving objects (photometric mask) and unreliable depths like sky and object edges (geometric mask) during training.

## Results

- **KITTI odometry** (train 00-02, 08, 09 (+11-21 unlabeled); test 03-07, 10; 416×128 input): mean $t_{rel}$ 5.58 %, $r_{rel}$ 2.47°/100 m — better than supervised ESP-VO (6.15 %, 6.66°) and SfMLearner (16.40 %, 5.99°) and monocular VISO2-M (17.48 %), though behind ORB-SLAM (3.21 %, 0.37°) and stereo VISO2-S (1.89 %). Adding the unlabeled sequences 11-21 improved the mean from 6.34 % to 5.58 % — the advertised benefit of unsupervised training. Without Loop-Net, looped sequences show visibly larger accumulated error.
- **KITTI depth** (Eigen-split metrics, trained only on the odometry subset): Abs Rel 0.1724 / RMSE 6.362 at 80 m cap — better than supervised Eigen (0.214) and scale-less SfMLearner (0.208), behind Monodepth's ResNet-50 at higher resolution (0.148).
- **Robustness (Oxford RobotCar)**: kept tracking through distortion, over-exposure, rain, and night-rain scenes where LSD-SLAM and even stereo ORB-SLAM lost tracking; also worked on self-collected low-cost ZED-camera data.
- **Runtime**: Tracking-Net runs at 40 Hz in under 400 MB GPU memory on a GTX 980M laptop; Mapping-Net 48 ms/frame, Loop-Net 120 ms/image (each every 5 frames); the threaded full system runs at ~20 Hz.

## Why it matters for SLAM

DeepSLAM shows the "replace every module with a network, keep the architecture" strategy at its fullest extent, including the loop-closure and pose-graph stages that pure learned-VO papers omitted — and demonstrates the payoff of unsupervised training: it kept improving simply by ingesting unlabeled KITTI sequences that supervised rivals could not use. Its stereo-trained/monocular-deployed recipe remains a standard way to obtain scale-aware self-supervision, and its robustness results on RobotCar foreshadowed learned SLAM's main selling point over geometric methods: graceful behavior in conditions where hand-crafted features fail.

## Related

- [DeepVO](deepvo.md)
- [UndeepVO](undeepvo.md)
- [SfM-Learner](sfm-learner.md)
- [MonoDepth](monodepth.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [DROID-SLAM](droid-slam.md)
