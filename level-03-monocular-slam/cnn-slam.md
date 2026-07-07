# CNN-SLAM

> Tateno 2017 · [Paper](https://arxiv.org/abs/1704.03489)

**One-line summary** — Fused CNN-predicted dense depth maps with LSD-SLAM-style semi-dense photometric depth refinement, recovering absolute scale, dense reconstruction, and fused semantic labels from a single camera.

## Problem

Direct monocular SLAM (LSD-SLAM) produces semi-dense depth maps, but it fails in low-texture regions, breaks under pure rotation (no stereo baseline), and cannot recover absolute scale. CNN single-image depth prediction gives dense, metric depth everywhere but with locally blurred depth borders and no multi-view consistency. CNN-SLAM ("CNN-SLAM: Real-time dense monocular SLAM with learned depth prediction", Tateno, Tombari, Laina, Navab) asks how these complementary sources can be fused so that "depth prediction is privileged in image locations where monocular SLAM approaches tend to fail, e.g. along low-textured regions, and vice-versa."

## Method & architecture

Keyframe-based direct SLAM built on LSD-SLAM. Each keyframe $k_i$ holds a pose $\mathbf{T}_{k_i}$, a *dense* depth map $\mathcal{D}_{k_i}$, and an uncertainty map $\mathcal{U}_{k_i}$. Two CNNs (ResNet-50 fully convolutional architecture of Laina et al., ImageNet-initialised; one regressing depth with a berHu loss, one predicting semantic labels with soft-max/cross-entropy) run on the GPU **once per keyframe only**, while tracking and refinement run per-frame on the CPU (two threads), keeping the system real-time.

**Tracking** — every frame $t$ is aligned to the nearest keyframe by Gauss-Newton on the photometric residual, restricted to high-gradient pixels $\tilde{\mathbf{u}}$:

$$E(\mathbf{T}^{k_i}_t)=\sum_{\tilde{\mathbf{u}}\in\Omega}\rho\left(\frac{r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t)}{\sigma(r(\tilde{\mathbf{u}},\mathbf{T}^{k_i}_t))}\right),\qquad r(\tilde{\mathbf{u}},\mathbf{T})=\mathcal{I}_{k_i}(\tilde{\mathbf{u}})-\mathcal{I}_t\big(\pi(\mathbf{K}\,\mathbf{T}\,\mathcal{V}_{k_i}(\tilde{\mathbf{u}}))\big)$$

where $\rho$ is the Huber norm, $\sigma$ a residual-uncertainty function, $\pi$ perspective projection, and $\mathcal{V}_{k_i}(\mathbf{u})=\mathbf{K}^{-1}\dot{\mathbf{u}}\,\mathcal{D}_{k_i}(\mathbf{u})$ the keyframe vertex map.

**Keyframe initialisation** — the regressed depth $\tilde{\mathcal{D}}_{k_i}$ is adjusted for the mismatch between the current camera's focal length $f_{cur}$ and the training sensor's $f_{tr}$, which fixes most of the absolute-scale error:

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{f_{cur}}{f_{tr}}\,\tilde{\mathcal{D}}_{k_i}(\mathbf{u})$$

Unlike LSD-SLAM's large constant initial uncertainty, $\mathcal{U}_{k_i}$ is initialised as the squared difference between the keyframe's CNN depth and the warped depth of the nearest keyframe — a cross-frame confidence for each predicted depth value.

**Frame-wise depth refinement** — every frame produces a depth/uncertainty estimate $(\mathcal{D}_t,\mathcal{U}_t)$ via small-baseline 5-pixel epipolar stereo matching (Engel et al. 2013), fused into the keyframe by uncertainty weighting:

$$\mathcal{D}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{D}_{k_i}(\mathbf{u})+\mathcal{U}_{k_i}(\mathbf{u})\,\mathcal{D}_t(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})},\qquad \mathcal{U}_{k_i}(\mathbf{u})=\frac{\mathcal{U}_t(\mathbf{u})\,\mathcal{U}_{k_i}(\mathbf{u})}{\mathcal{U}_{k_i}(\mathbf{u})+\mathcal{U}_t(\mathbf{u})}$$

High-gradient pixels (low stereo uncertainty) converge to refined multi-view depth — exactly where CNN borders are blurred — while low-texture pixels retain the CNN prior. Keyframe poses are globally refined by pose graph optimisation (g2o); a Global Segmentation Model incrementally fuses per-keyframe semantic maps into the 3D reconstruction.

## Results

Evaluated on ICL-NUIM (synthetic) and TUM RGB-D, with the CNN trained only on NYU Depth v2 (different sensor and environments) to test generalisation; run on a Xeon 2.4 GHz + Quadro K5200, network at 304×228, SLAM at 320×240. Over 9 sequences, average absolute trajectory error is **0.246 m** vs 0.562 m for LSD-SLAM *with ground-truth scale bootstrapping*, 0.772 m for LSD-SLAM, 0.643 m for ORB-SLAM, and 0.512 m for Laina's CNN depth fed into point-based fusion. Average percentage of correctly estimated depth (within 10% of ground truth) is **22.5%** vs 18.5% (raw CNN + fusion), 7.6% (REMODE), 3.0% (LSD-SLAM bootstrapped), 0.2% (LSD-SLAM). On the mostly-rotational TUM fr1/rpy sequence CNN-SLAM still reconstructs the scene where LSD-SLAM is heavily noisy and ORB-SLAM fails to initialise. The paper also shows the first joint 3D + semantic reconstruction from a monocular camera (4 NYU super-classes).

## Why it matters for SLAM

CNN-SLAM was one of the first systems to combine deep depth prediction with a classical SLAM pipeline, pioneering the "classical + learned" paradigm that DVSO, D3VO, and many later systems followed. Its core recipe — treat learned depth as a per-pixel measurement with an uncertainty and fuse it with multi-view depth by inverse-variance weighting — demonstrated that learned depth can recover metric scale and survive pure rotation, and that geometry and semantics can be reconstructed jointly in one monocular system.

## Related

- [LSD-SLAM](lsd-slam.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [DeepFusion](deepfusion.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)
