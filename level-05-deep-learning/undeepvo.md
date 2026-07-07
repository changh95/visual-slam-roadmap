# UndeepVO

> Li 2018 · [Paper](https://arxiv.org/abs/1709.06841)

**One-line summary** — A monocular visual odometry system trained with *unsupervised* deep learning that recovers absolute metric scale by training on stereo image pairs while running on monocular input at test time.

## Problem

Supervised learned VO (DeepVO) needs ground-truth 6-DoF poses, which are expensive to collect at scale, while the first self-supervised alternative (SfM-Learner) trained from monocular video alone and therefore inherited the fundamental monocular limitation: depth and trajectory are recovered only up to an unknown scale. UnDeepVO's answer: let training-time stereo geometry, not runtime sensors or post-processing, supply the scale — its two claimed "salient features" are the unsupervised training scheme and absolute scale recovery.

## Method & architecture

- **Pose estimator.** A VGG-based CNN takes two consecutive monocular frames and regresses the 6-DoF transform, with *decoupled* fully-connected branches for translation and Euler-angle rotation so the rotation can be weighted separately (rotation is highly nonlinear and harder to train).
- **Depth estimator.** An encoder-decoder that predicts depth maps *directly* rather than disparity — the authors report the whole system converges more easily this way.
- **Stereo training, monocular testing.** During training both left and right image sequences are fed through the networks; the losses tie the predictions to the known, fixed baseline $B$. At test time only consecutive monocular images are used.
- **Spatial losses (within a stereo pair)** exploit that corresponding pixels are displaced by the disparity

$$D_{p}=Bf/D_{dep},$$

  ($f$ focal length, $D_{dep}$ predicted depth) — this is where metric scale enters. One image is synthesized from the other via a spatial transformer and penalized with a combined SSIM + L1 photometric loss, e.g.

$$L_{pho}^{l}=\lambda_{s}L^{SSIM}(I_{l},I^{\prime}_{l})+(1-\lambda_{s})L^{l_{1}}(I_{l},I^{\prime}_{l}),$$

  plus a disparity-map consistency loss and a **pose consistency loss** $L_{pos}=\lambda_{p}L^{l_{1}}(\mathbf{x}^{\prime}_{l},\mathbf{x}^{\prime}_{r})+\lambda_{o}L^{l_{1}}(\varphi^{\prime}_{l},\varphi^{\prime}_{r})$ forcing left- and right-sequence pose predictions to agree.
- **Temporal losses (between consecutive frames)** recover the motion: pixels are reprojected with the predicted depth and pose,

$$p_{k+1}=KT_{k,k+1}D_{dep}K^{-1}p_{k},$$

  and penalized with the same SSIM+L1 photometric loss, plus an ICP-like **3D geometric registration loss** $L_{geo}^{k}=L^{l_{1}}(P_{k},P^{\prime}_{k})$ aligning the point clouds of the two frames under $T_{k,k+1}$.
- **Training.** Adam ($\beta_1=0.9$, $\beta_2=0.99$), lr 0.001 halved every 1/5 of iterations, 20–30 epochs, 416×128 inputs, with color/rotational/left-right augmentation. Inference: under 400 MB GPU memory at 40 Hz on a GTX 980M.

## Results

- **KITTI odometry** (trained on sequences 00–08, the same data as SfMLearner; no loop closure in any method): mean over sequences 00/02/05/07/08 — UnDeepVO $t_{rel}$ **4.07%**, $r_{rel}$ **2.02°/100m**, vs SfMLearner 36.23% / 4.56 (after 7-DoF alignment), VISO2-M 17.93% / 2.80 and ORB-SLAM-M (VO-only) 27.05% / 10.23, both of which required full 1242×376 images vs UnDeepVO's 416×128. (These sequences overlap the training set — the paper frames this as measuring goodness of network fit; on GT-less sequences 11–21 its trajectories are comparable to *stereo* VISO2-S.)
- **Scale.** Poses and depths come out metrically scaled with no scale post-processing — SfMLearner and ORB-SLAM-M needed 7-DoF alignment to ground truth, VISO2-M needed the fixed-camera-height prior.
- **Depth (KITTI Eigen split):** Abs Rel 0.183, Sq Rel 1.73, RMSE 6.57, RMSE log 0.268 — better than supervised Eigen et al. (0.214) and scale-free SfMLearner (0.208), behind stereo-trained MonoDepth (0.148, which used higher resolution, a ResNet architecture, and the full KITTI raw set).

## Why it matters for SLAM

UndeepVO was one of the first works to show that the monocular scale problem can be attacked with *training data geometry* rather than extra sensors at runtime: use stereo supervision once, deploy monocular forever. This stereo-supervised self-supervision recipe became a standard ingredient in later self-supervised depth and VO methods (MonoDepth-style photometric losses combined with pose networks, later refined and integrated into direct VO by D3VO). It is a useful case study of how classical multi-view geometry constraints can serve as free supervisory signals for learning.

## Related

- [SfM-Learner](sfm-learner.md) — the purely monocular self-supervised depth+pose predecessor (scale-ambiguous).
- [MonoDepth](monodepth.md) — stereo-supervised self-supervised depth estimation.
- [DeepVO](deepvo.md) — supervised end-to-end learned VO counterpart.
- [D3VO](../level-03-monocular-slam/d3vo.md) — later system integrating self-supervised depth, pose, and uncertainty into direct VO.
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the general concept.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the monocular limitation UnDeepVO trains its way around.
