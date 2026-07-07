# Depth from Videos in the Wild

> Gordon 2019 · [Paper](https://arxiv.org/abs/1904.04998)

**One-line summary** — This work (ICCV 2019) pushed self-supervised depth learning to truly unconstrained video by learning the camera intrinsics (including lens distortion) along with depth, ego-motion, and object motion — enabling training on arbitrary videos with unknown cameras.

## Problem

Self-supervised depth methods in the SfM-Learner tradition learn from raw video by warping one frame into another and penalizing photometric error — but they assume the camera intrinsics are known, restricting training to calibrated datasets like KITTI, and they degrade when scenes contain independently moving objects or occlusions. If the goal is learning geometry from the world's video (arbitrary cameras, arbitrary content), calibration and the static-scene assumption both have to go.

## Method & architecture

Two convolutional networks are trained jointly with only cross-frame consistency as supervision: a **depth network** (UNet on a ResNet-18 base, softplus activation $z=\log(1+\mathrm{e}^{\ell})$ mapping logits to depth) predicting depth from a single image, and a **motion network** (FlowNet-inspired UNet) that from two frames predicts camera rotation $r_0$, global translation $t_0$, a residual per-pixel translation field, and the camera intrinsics — each intrinsic emitted by its own 1x1 convolution from the bottleneck. The backbone warp between adjacent frames is

$$z^{\prime}p^{\prime}=KRK^{-1}zp+Kt,$$

where $K$ is the intrinsic matrix, $p,p^{\prime}$ homogeneous pixel coordinates, $z,z^{\prime}$ depths, and $R,t$ the motion.

**Why intrinsics are learnable.** The loss depends on $K$ only via $Kt$ and $KRK^{-1}$; translations give no signal (a wrong $\tilde{K}$ with $\tilde{t}=\tilde{K}^{-1}Kt$ leaves the loss unchanged), but rotations do — no $\tilde{K},\tilde{R}$ can reproduce $KRK^{-1}$. The paper derives the tolerance on focal lengths from the inter-frame rotation:

$$\delta f_{x}<\frac{2f_{x}^{2}}{w^{2}r_{y}};\quad\delta f_{y}<\frac{2f_{y}^{2}}{h^{2}r_{x}},$$

with $r_x,r_y$ rotation angles (radians) and $w,h$ the image size — more rotation pins the focal length more tightly.

**Object motion.** $R$ is held constant across the image; $t$ may deviate from constant only inside a rough "possibly mobile" mask $m$ (a union of detection bounding boxes suffices — no instance segmentation or tracking):

$$t(x,y)=t_{0}+m(x,y)\,\delta t(x,y).$$

**Occlusion-aware losses.** Each source pixel is unprojected with its predicted depth, moved by the motion field, and reprojected; a pixel enters the (L1 photometric + depth + motion cycle-consistency) losses only where its transformed depth satisfies $z^{\prime}_{i^{\prime},j^{\prime}}\leq z^{t}_{i^{\prime},j^{\prime}}$ — i.e. it lands *in front of* the target depth map — applied symmetrically in both directions. SSIM is weighted down where depth discrepancy is large. **Randomized layer normalization** — layer norm with multiplicative Gaussian noise on the means and variances — replaces batch norm, which had shown anomalous behavior (accuracy degrading with batch size).

## Results

- **KITTI** (Eigen split, 80 m cutoff): Abs Rel 0.128 with *learned* intrinsics vs 0.129 with given ones — both beating Struct2Depth (0.141), Godard (0.133), GeoNet (0.155).
- **Cityscapes**: Abs Rel 0.127 (learned intrinsics) vs Struct2Depth 0.145.
- **Pooling Cityscapes + KITTI** (intrinsics learned) improves both: Abs Rel 0.121 on CS and 0.124 on KITTI. Ablations on the pooled set: without object motion 0.172/0.130, without occlusion-aware loss 0.127/0.126, without randomized layer norm 0.124/0.127; bounding boxes instead of segmentation masks are just as good (0.120/0.125).
- **Intrinsics accuracy (EuRoC)**: learned $f_x = 253.7\pm 1.1$ vs ground truth 250.2, $f_y = 265.4\pm 1.3$ vs 261.3, quadratic radial distortion $-0.267\pm 0.003$ vs $-0.283$ — all within a few pixels. EuRoC out-of-sample depth (train machine-room, test Vicon Room 2 01): Abs Rel 0.332, with no prior art on this dataset.
- **Odometry (KITTI 09/10)**: translational drift $t_{rel}$ of 2.7% / 6.8% with learned-and-corrected intrinsics vs Struct2Depth 10.2% / 28.9%; ATE 0.010 / 0.007.
- Qualitative depth learned from YouTube8M quadcopter videos — multiple unknown cameras with different fields of view and distortion.

## Why it matters for SLAM

This paper removed the last practical barrier to learning geometry from unlimited video: calibration. The idea of treating camera parameters as just another learnable output reappears in learned camera models (Neural Ray Surfaces) and resonates with today's calibration-free feed-forward reconstruction (DUSt3R-style models predicting geometry without given intrinsics). For SLAM practitioners, it is also a reference point for handling dynamic objects and occlusion inside photometric self-supervision — persistent failure modes of direct methods.

## Related

- [SfM-Learner](sfm-learner.md)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md)
- [Neural Ray Surfaces](neural-ray-surfaces.md)
- [MonoDepth](monodepth.md)
- [DUSt3R](dust3r.md)
