# MonoDepth

> Godard 2016 · [Paper](https://arxiv.org/abs/1609.03677)

**One-line summary** — Self-supervised monocular depth estimation trained on stereo pairs via left-right photometric consistency: stereo images supervise training, but a single image suffices at test time.

## Problem

Supervised monocular depth estimation treats depth as a regression problem and therefore requires vast quantities of ground-truth depth, which even expensive laser scanners deliver imprecisely in natural scenes with movement and reflections. Stereo rigs, by contrast, are cheap and ubiquitous. MonoDepth's insight is to pose depth estimation as an *image reconstruction* problem during training: predicting the disparity field $d$ that warps one rectified view into the other is equivalent to predicting depth via $\hat{d}=bf/d$ (baseline $b$, focal length $f$), so image reconstruction error becomes the training signal and no depth labels are ever needed.

## Method & architecture

**Network.** A fully convolutional encoder-decoder inspired by DispNet (31M parameters; a ResNet50-encoder variant has 48M), with skip connections and disparity outputs at four scales. Crucially, from the *left image alone* it predicts **both** disparity maps $d^l$ and $d^r$; the right image is used only in the loss. Backward warping uses the fully differentiable bilinear sampler from spatial transformer networks: $\tilde{I}^l = I^r(d^l)$. Disparities are constrained to $[0, 0.3\times\text{width}]$ by a scaled sigmoid; ELUs replace ReLUs (which prematurely froze intermediate-scale disparities), and deconvolutions are replaced by nearest-neighbor upsample + conv.

**Loss.** Total loss $C=\sum_{s=1}^4 C_s$, with each scale combining three mirrored (left/right) terms:

$$C_s=\alpha_{ap}(C_{ap}^{l}+C_{ap}^{r})+\alpha_{ds}(C_{ds}^{l}+C_{ds}^{r})+\alpha_{lr}(C_{lr}^{l}+C_{lr}^{r})$$

- *Appearance matching* — SSIM + L1 photometric reconstruction ($\alpha=0.85$, simplified $3\times3$ block-filter SSIM):
$$C_{ap}^{l}=\frac{1}{N}\sum_{i,j}\alpha\frac{1-\text{SSIM}(I^{l}_{ij},\tilde{I}^{l}_{ij})}{2}+(1-\alpha)\left\|I^{l}_{ij}-\tilde{I}^{l}_{ij}\right\|$$
- *Edge-aware disparity smoothness* — L1 on disparity gradients, down-weighted at image edges so depth discontinuities align with object boundaries:
$$C_{ds}^{l}=\frac{1}{N}\sum_{i,j}\left|\partial_{x}d^{l}_{ij}\right|e^{-\left\|\partial_{x}I_{ij}^{l}\right\|}+\left|\partial_{y}d^{l}_{ij}\right|e^{-\left\|\partial_{y}I^{l}_{ij}\right\|}$$
- *Left-right disparity consistency* — the key novelty; the left-view disparity map must equal the projected right-view one:
$$C_{lr}^{l}=\frac{1}{N}\sum_{i,j}\left|d^{l}_{ij}-d^{r}_{ij+d^{l}_{ij}}\right|$$

Naïve single-direction sampling produces disparities aligned with the wrong image or "texture-copy" artifacts and errors at depth discontinuities; enforcing mutual consistency between $d^l$ and $d^r$ fixes both. Weights: $\alpha_{ap}=\alpha_{lr}=1$, $\alpha_{ds}=0.1/r$ per scale. Trained 50 epochs with Adam (lr $10^{-4}$, batch 8) in ~25 h on a Titan X; flips/color jitter augmentation. A test-time post-processing step (pp) averages disparities of the image and its mirror to suppress stereo disocclusion ramps. At test time only $d^l$ at the finest scale is used; inference runs under 35 ms (28+ FPS) for a 512×256 image.

## Results

- **KITTI split (200 official disparity images)**: left-right consistency beats the no-LR variant and Deep3D image-formation baselines on all measures (Ours K: Abs Rel 0.124, RMSE 6.125, D1-all 30.27 vs Deep3D 0.412/13.69/66.85); Cityscapes pre-training + KITTI improves to 0.104/5.417, and 0.097/5.093 with ResNet + post-processing.
- **Eigen split (697 test images)**: Abs Rel 0.148, RMSE 5.927, $\delta<1.25$ = 0.803 trained on KITTI alone — outperforming the *supervised* methods of Eigen et al. (0.203) and Liu et al. (0.201) with no depth labels; CS+K with ResNet + pp reaches Abs Rel 0.114, RMSE 4.935, $\delta<1.25$ = 0.861. Capped at 50 m it beats Garg et al. (0.140 vs 0.169 Abs Rel).
- **Generalization**: superior qualitative results on Make3D against fully supervised methods despite never training on it; a stereo-input variant does even better (Abs Rel 0.068), confirming monocular is the harder problem.

## Why it matters for SLAM

MonoDepth pioneered self-supervised depth estimation and spawned a massive research direction (Monodepth2, PackNet, and dozens more); its left-right consistency and SSIM + L1 photometric-loss machinery became standard tools. For SLAM, it opened the path to depth priors that can be trained from the same kind of raw driving/robot footage a SLAM system already collects — no depth sensor required — which is the foundation of the self-supervised depth line used in D3VO, MonoRec, and modern monocular dense mapping.

## Related

- [SfM-Learner](sfm-learner.md) — the monocular-video counterpart (depth + ego-motion)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — concept overview
- [MiDaS](midas.md) — the multi-dataset generalization successor
- [MonoRec](monorec.md) — dense reconstruction building on this lineage
- [D3VO](../level-03-monocular-slam/d3vo.md) — deep VO built on this self-supervised training philosophy
