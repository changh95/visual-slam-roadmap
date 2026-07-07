# MiDaS

> Ranftl 2020 · [Paper](https://arxiv.org/abs/1907.01341)

**One-line summary** — Robust relative (affine-invariant) monocular depth trained by mixing many heterogeneous datasets with a scale-and-shift invariant loss, achieving strong zero-shot generalization across domains.

## Problem

The success of monocular depth estimation depends on large and diverse training sets, but acquiring dense ground-truth depth at scale across different environments is so hard that the field fragmented into datasets with distinct characteristics and biases — stereo-derived, laser-scanned, structured-light, each with its own scale conventions, depth ranges, and even unknown or inconsistent calibration. Models trained on any single dataset are brittle outside their domain. MiDaS builds the tools to train on all of them *jointly*, even though their annotations are mutually incompatible.

## Method & architecture

The network itself is a conventional encoder-decoder (the multi-scale ResNet-based architecture of Xian et al.); the contribution is the training machinery around it.

**Prediction space.** The model predicts in *disparity* space (inverse depth), up to an unknown scale and shift — the only representation compatible with all annotation types (uncalibrated stereo, laser, SfM).

**Scale-and-shift invariant loss.** For $M$ valid pixels, the loss is computed on aligned versions $\hat{d}, \hat{d}^*$ of the prediction and ground truth:

$$L_{ssi}(\hat{d}, \hat{d}^*) = \frac{1}{2M}\sum_{i=1}^{M} \rho\left(\hat{d}_i - \hat{d}_i^*\right)$$

One alignment is least-squares: $(s,t) = \arg\min_{s,t}\sum_{i=1}^{M}(s d_i + t - d_i^*)^2$, solvable in closed form. The robust alternative normalizes both signals with median/mean-absolute-deviation estimators:

$$t(d) = \mathrm{median}(d), \qquad s(d) = \frac{1}{M}\sum_{i=1}^{M}|d - t(d)|, \qquad \hat{d} = \frac{d - t(d)}{s(d)}$$

The best-performing variant, $L_{ssitrim}$, applies a mean-absolute-error $\rho$ but *trims* the 20% largest residuals per image ($U_m = 0.8M$), so ground-truth outliers never influence training.

**Gradient matching.** A multi-scale gradient-matching term biases depth discontinuities to be sharp and coincide with ground-truth edges ($R_i = \hat{d}_i - \hat{d}_i^*$, $K=4$ scales):

$$L_{reg}(\hat{d},\hat{d}^*) = \frac{1}{M}\sum_{k=1}^{K}\sum_{i=1}^{M}\left(|\nabla_x R_i^k| + |\nabla_y R_i^k|\right)$$

The per-dataset loss is $L_l = \frac{1}{N_l}\sum_n L_{ssi} + \alpha\, L_{reg}$ with $\alpha = 0.5$.

**Pareto-optimal dataset mixing.** Instead of naively averaging losses over datasets, each dataset is treated as a task in a multi-objective optimization (Sener & Koltun), seeking an approximate Pareto optimum so no dataset dominates.

**Data: MIX 5 + 3D movies.** Five training sets — ReDWeb, DIML, MegaDepth, WSVD, and a new 3D Movies corpus (~75K frames from 23 stereoscopic films): optical flow between stereo views serves as a disparity proxy, with left-right consistency checks (>2 px marked invalid), automatic frame filtering, and sky regions forced to minimum disparity.

**Encoder pretraining.** ImageNet performance of the encoder predicts depth performance; the best model uses a ResNeXt-101-WSL encoder (weakly-supervised pretraining), giving up to 15% relative improvement, while a randomly initialized ResNet-50 is ~35% worse than its pretrained counterpart.

## Results

Evaluation is *zero-shot cross-dataset transfer*: test datasets (DIW, ETH3D, Sintel, KITTI, NYU, TUM) are never seen in training. The full model (MIX 5, ResNeXt-101-WSL) achieves DIW WHDR 12.46, ETH3D AbsRel 0.129, Sintel AbsRel 0.327, and $\delta > 1.25$ outlier rates of 23.90 (KITTI), 9.55 (NYU), 14.29 (TUM) — the best average rank (2.0) among all methods; the best competing methods (Li MD, Li MC, Wang WS, Xian RW) are 65–82% worse in mean relative performance. Ablations show every single-dataset model generalizes worse on average than the small curated ReDWeb baseline, while Pareto-optimal mixing of all five sets improves mean performance by 22.4% over that baseline (vs. 19.5% for naive mixing), and the trimmed MAE loss beats the MSE and MAE variants. Training covered roughly six GPU-months.

## Why it matters for SLAM

MiDaS (in its v2/v3 DPT-backbone versions) was *the* off-the-shelf monocular depth model for roughly half a decade, and its scale-shift invariant loss is now standard in depth learning (ZoeDepth, Depth Anything, Marigold). For SLAM, relative depth is directly useful as a dense prior — for filling textureless regions, regularizing dense mapping, or initializing depth in monocular pipelines — with the caveat that scale and shift must be resolved per frame by the SLAM system itself.

## Related

- [MonoDepth](monodepth.md) — earlier self-supervised single-dataset approach
- [DPT](dpt.md) — the ViT backbone that became MiDaS v3
- [ZoeDepth](zoedepth.md) — adds metric scale on top of MiDaS-style pretraining
- [Depth Anything](depth-anything.md) — scales the recipe to 62M images
- [Metric3D](metric3d.md) — the canonical-camera route to metric instead of relative depth
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — why affine-invariant depth needs external scale in monocular SLAM
