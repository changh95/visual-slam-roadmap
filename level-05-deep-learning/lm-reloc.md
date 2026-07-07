# LM-Reloc

> von Stumberg 2020 · [Paper](https://arxiv.org/abs/2010.06323)

**One-line summary** — Deep direct relocalization: learns CNN features tailored for Levenberg-Marquardt-based direct image alignment, estimating relative pose between query and reference images without feature matching or RANSAC.

## Problem

Visual relocalization is almost universally tackled with a feature-based formulation — detect keypoints, match descriptors, reject outliers with RANSAC, solve for pose. That pipeline throws away everything except corners. Direct image alignment can exploit *any* image region with gradients, but raw photometric alignment breaks under lighting, weather, and seasonal change, and its narrow basin of convergence makes it fragile under the large baselines typical of relocalization. LM-Reloc asks how to keep the direct formulation while making it robust across conditions.

## Method & architecture

LM-Reloc estimates the 6DoF pose $\boldsymbol{\xi} \in SE(3)$ between images $I$ and $I'$, given sparse depths from a direct SLAM system (Stereo DSO). Three components work together: **LM-Net** (Siamese encoder-decoder producing multi-scale feature maps $F_l, F'_l$, $l = 1,\dots,4$), **CorrPoseNet** (coarse pose initialization), and a classical **Levenberg-Marquardt optimizer**.

**Direct alignment on learned features.** Instead of raw intensities, the optimizer minimizes a feature-metric energy in a coarse-to-fine pyramid ($F_1$ at $(w/8, h/8)$ up to $F_4$ at full resolution):

$$E(\boldsymbol{\xi})=\sum_{\mathbf{p}\in P}\big\lVert F_{l}^{\prime}(\mathbf{p}^{\prime})-F_{l}(\mathbf{p})\big\rVert_{\gamma}, \qquad \mathbf{p}^{\prime}=\Pi\left(\mathbf{R}\,\Pi^{-1}(\mathbf{p},d_{\mathbf{p}})+\mathbf{t}\right),$$

with Huber norm $\lVert\cdot\rVert_\gamma$ and per-point depth $d_{\mathbf{p}}$. Each LM iteration builds the Gauss-Newton system $\mathbf{H}=\mathbf{J}^{T}\mathbf{W}\mathbf{J}$, $\mathbf{b}=-\mathbf{J}^{T}\mathbf{W}\mathbf{r}$, damps it via $\mathbf{H}'=\mathbf{H}+\lambda\mathbf{I}$ (Levenberg) or $\mathbf{H}'=\mathbf{H}+\lambda\,\mathrm{diag}(\mathbf{H})$ (Marquardt), and updates $\boldsymbol{\delta}=\mathbf{H}'^{-1}\mathbf{b}$, $\boldsymbol{\xi}^{i}=\boldsymbol{\delta}\boxplus\boldsymbol{\xi}^{i-1}$; $\lambda$ is halved after successful and quadrupled after failed steps.

**Loss designed around the optimizer.** The central idea: train the features so LM behaves well on them, distinguishing the four states a projected point can be in during optimization, each with its own sampled correspondence and loss term:

1. Correct location: $E_{\text{pos}}=\lVert F^{\prime}(\mathbf{p}_{\text{gt}}^{\prime})-F(\mathbf{p})\rVert^{2}$ should vanish.
2. Outlier (negative sampled anywhere): $E_{\text{neg}}=\max\left(M-\lVert F^{\prime}(\mathbf{p}_{\text{neg}}^{\prime})-F(\mathbf{p})\rVert^{2},0\right)$ with margin $M=1$ — wrong matches must produce large residuals.
3. Far from optimum (negative ~5 px away, large $\lambda$, gradient-descent regime): a damped per-point flow step $\mathbf{p}_{\text{after}}^{\prime}=\mathbf{p}_{\nabla}^{\prime}+(\mathbf{H}_{\mathbf{p}}+\lambda_{f}\mathbf{I})^{-1}\mathbf{b}_{\mathbf{p}}$ must move toward the truth: $E_{\text{GD}}=\max\left(\lVert\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}-\lVert\mathbf{p}_{\nabla}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime}\rVert^{2}+\delta,0\right)$ (widens the convergence basin; $\lambda_f{=}2.0$, $\delta{=}0.1$).
4. Near the optimum (negative within 1 px, small $\lambda$, Gauss-Newton regime): the probabilistic Gauss-Newton loss from GN-Net, $E_{\text{GN}}=\frac{1}{2}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})^{T}\mathbf{H}_{\mathbf{p}}(\mathbf{p}_{\text{after}}^{\prime}-\mathbf{p}_{\text{gt}}^{\prime})+\log(2\pi)-\frac{1}{2}\log(|\mathbf{H}_{\mathbf{p}}|)$ (sharpens the minimum for subpixel accuracy).

**CorrPoseNet for initialization.** A regression network with a correlation layer, $\mathbf{c}(i,j,(i^{\prime},j^{\prime}))=\mathbf{f}_{\text{corr}}(i,j)^{T}\mathbf{f}_{\text{corr}}^{\prime}(i^{\prime},j^{\prime})$, regresses Euler angles and translation to bootstrap LM under large baselines/rotations; it is robust but inaccurate, so the final estimate always comes from the geometric optimization.

## Results

Evaluated on the relocalization tracking benchmark (CARLA + Oxford RobotCar), reporting AUC of cumulative pose-error curves up to 0.5 m / 0.5°:

- **CARLA (test)**: LM-Reloc reaches $t_{\text{AUC}}/R_{\text{AUC}}$ of **80.65 / 77.83** vs SuperGlue 78.99 / 59.31, R2D2 73.47 / 54.42, SuperPoint 72.76 / 53.38, D2-Net 47.62 / 16.47; without CorrPoseNet 63.88 / 61.9, and GN-Net 43.72 / 44.08 — the LM loss alone already outperforms GN-Net substantially.
- **Oxford RobotCar** (6 cross-condition pairs among sunny/overcast/rainy/snowy): LM-Reloc almost consistently wins on rotation AUC (e.g. Sunny-Overcast 55.48 vs SuperGlue's 52.83) while staying competitive on translation; the LiDAR-ICP ground truth itself has ~16 cm RMS error, masking sub-0.15 m translation gains.
- **Head-to-head vs GN-Net** (no CorrPoseNet, same alignment pipeline): better on all six sequences, e.g. Sunny-Rainy 70.46 / 42.86 vs 64.58 / 37.27.
- **Ablation**: $E_{\text{GD}}$ mainly improves robustness, $E_{\text{GN}}$ accuracy; only together do they yield both.

## Why it matters for SLAM

LM-Reloc comes from the TUM direct SLAM lineage (DSO and its descendants) and addresses a core weakness of direct methods: relocalization and map reuse under appearance change. It exemplifies a productive design pattern — keep the classical geometric optimizer, but learn the representation it operates on, shaping the training loss around the optimizer's actual convergence behavior. Use this family of ideas when you need direct-method accuracy but must relocalize across sessions or conditions.

## Related

- [DSO](../level-03-monocular-slam/dso.md) — the direct odometry lineage this builds on
- [D3VO](../level-03-monocular-slam/d3vo.md) — same group's deep direct odometry; inspired CorrPoseNet
- [PoseNet](posenet.md) — pure pose regression, used here only for initialization
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — why regression alone is not enough
- [HF-Net](hf-net.md) — the feature-matching-based alternative for relocalization
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — retrieving the reference images to relocalize against
