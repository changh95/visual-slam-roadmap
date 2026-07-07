# MonoRec

> Wimbauer 2021 · [Paper](https://arxiv.org/abs/2011.11814)

**One-line summary** — Semi-supervised dense 3D reconstruction from a single moving camera that handles dynamic environments by detecting moving objects from photometric inconsistencies in multi-view-stereo cost volumes.

## Problem

Multi-view stereo gives geometrically grounded dense depth from a single moving camera, but it rests on a static-scene assumption: moving cars and pedestrians violate the multi-view constraints and corrupt the cost volume exactly where autonomous systems care most. Single-image depth prediction handles moving objects but relies on learned perspective appearance tied to specific camera intrinsics, so it generalizes poorly. A second obstacle is supervision — dense ground truth means LiDAR. MonoRec targets both: dense reconstruction in dynamic scenes, trained without LiDAR depth values.

## Method & architecture

Given consecutive frames $\{I_1,\dots,I_N\}$ with poses from a sparse VO system (DVSO), MonoRec predicts a dense inverse depth map $D_t$ for keyframe $I_t$. Two modules operate on plane-sweep cost volumes.

**SSIM cost volume.** Instead of the usual patch-wise SAD, the per-pixel photometric error at depth hypothesis $d$ uses SSIM with $3\times3$ patches, $pe(\mathbf{x},d)=\frac{1-\text{SSIM}(I_{t^{\prime}}^{t}(\mathbf{x},d),I_{t}(\mathbf{x}))}{2}$, aggregated over frames into

$$C(\mathbf{x},d)=1-2\cdot\frac{1}{\sum_{t^{\prime}}\omega_{t^{\prime}}}\cdot\sum_{t^{\prime}}pe_{t^{\prime}}^{t}(\mathbf{x},d)\cdot\omega_{t^{\prime}}(\mathbf{x})$$

where the weight $\omega_{t'}(\mathbf{x})$ emphasizes the frame's photometric-error minimum over other depth steps, so confident frames count more; $C\in[-1,1]$.

**MaskModule.** Predicts $M_t(\mathbf{x})\in[0,1]$, the probability that a pixel belongs to a moving object, from the set of *single-frame* cost volumes $C_{t'}$: dynamic pixels yield inconsistent optimal depth steps across different $C_{t'}$. Pre-trained ResNet-18 features of $I_t$ add semantic priors (geometry alone confuses low-texture/non-Lambertian surfaces and constant-velocity objects). A shared-weight U-Net encoder processes each $C_{t'}$, features are max-pooled and decoded — so the module works with any number of frames.

**DepthModule.** Receives the multi-frame cost volume $C$ after pixel-wise multiplication with the predicted mask at every depth step — leaving no maxima (strong priors) in moving-object regions — concatenated with $I_t$; a U-Net decodes multi-scale inverse depth, forcing it to infer moving-object depth from image features and the surroundings.

**Multi-stage semi-supervised training.** Bootstrapping trains DepthModule with $\mathcal{L}_{depth}=\sum_{s=0}^{3}\mathcal{L}_{self,s}+\alpha\mathcal{L}_{sparse,s}+\beta\mathcal{L}_{smooth,s}$, combining a per-pixel-minimum photometric loss over temporal and static-stereo reprojections,

$$\mathcal{L}_{self,s}=\min_{t^{\star}\in t^{\prime}\cup\{t^{S}\}}\Big(\lambda\tfrac{1-\text{SSIM}(I_{t^{\star}}^{t},I_{t})}{2}+(1-\lambda)\,\lVert I_{t^{\star}}^{t}-I_{t}\rVert_{1}\Big),\quad \lambda=0.85$$

with sparse depth supervision $\mathcal{L}_{sparse,s}=\lVert D_{t}-D_{VO}\rVert_{1}$ from the VO point cloud — no LiDAR, no manual labels. MaskModule bootstraps on auxiliary masks (Mask-RCNN movable instances flagged as moving via temporal/static-stereo inconsistency). Refinement stages then couple the modules: the mask is trained as an interpolation factor between static-stereo and temporal-stereo losses ($\mathcal{L}_{m\_ref}$), and depth refinement backpropagates only static-stereo losses on moving pixels plus a stereo-depth prior ($\mathcal{L}_{d\_ref}$).

## Results

- **KITTI** (odometry ∩ Eigen split: 13,714 train / 8,634 test, improved GT, 80 m cap): Abs Rel 0.050, Sq Rel 0.295, RMSE 2.266, RMSE-log 0.082, $\delta_1$ 0.973 — best overall against Colmap (0.099 Abs Rel), Monodepth2 (0.082), PackNet semi-sup. w/ LiDAR (0.077), DORN (0.077), DeepMVS (0.088 pretr.) and DeepTAM w/ refinement (0.053, RMSE 2.480), despite training without LiDAR ground truth.
- **Ablations**: SSIM cost volume alone cuts RMSE 2.624 → 2.444 over SAD-style baseline; MaskModule + both refinement stages reach the full 2.266.
- **Generalization**: the KITTI model transfers to Oxford RobotCar and the handheld TUM-Mono sequences, where monocular methods struggle and other MVS methods show artifacts on moving objects.
- **Runtime**: ~10 fps at batch size 1 using 2 GB memory (512×256 input).

## Why it matters for SLAM

Dense monocular reconstruction in the real world must cope with cars and pedestrians; MonoRec showed that the cost volume itself contains the evidence needed to find them, unifying dynamic-object detection with depth estimation instead of bolting on a semantic detector at inference. Coming from the TUM direct-SLAM group, it deliberately consumes poses from any sparse VO system (poses in, dense maps out) and influenced later real-time dense mapping work such as TANDEM.

## Related

- [TANDEM](tandem.md) — real-time dense tracking and mapping from the same group
- [DVSO](../level-03-monocular-slam/dvso.md) — the VO system supplying poses and sparse depth supervision
- [D3VO](../level-03-monocular-slam/d3vo.md) — deep VO providing the pose/depth lineage
- [DeepV2D](deepv2d.md) — alternating depth and pose estimation
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the training philosophy background
- [DSO](../level-03-monocular-slam/dso.md) — the direct odometry lineage supplying poses to systems like MonoRec
