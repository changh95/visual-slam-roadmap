# DSAC\*

> Brachmann 2021 · [Paper](https://arxiv.org/abs/2002.12324)

**One-line summary** — The consolidated TPAMI version of the DSAC line: one unified scene-coordinate-regression framework for visual relocalization from RGB or RGB-D images, with substantially improved training stability and efficiency.

## Problem

By 2020 the DSAC line had accumulated separate recipes for different settings — RGB vs RGB-D input, training with vs without a 3D scene model — each with its own initialization stages and stability caveats. DSAC\* consolidates these variants into a single, reliable framework, so that scene coordinate regression can be applied uniformly across input modalities and supervision regimes.

## Method & architecture

**Scene coordinate regression + robust pose solving.** A fully convolutional network $f$ maps a grayscale image $I$ to dense scene coordinates $\mathcal{Y}=f(I;\mathbf{w})$ — the 3D point in scene space observed by each pixel, related to camera-space points by $\mathbf{y}_i = \mathbf{h}\mathbf{e}_i$. The output is subsampled 8x, each prediction has an 81 px receptive field, and the map *is* the 28 MB of network weights. Pose optimization is classical RANSAC: sample $M{=}64$ hypotheses with a minimal solver $\mathbf{h}_j = g(\mathcal{C}_j)$ — a P3P/PnP solver on 2D-3D correspondences for RGB (residual $r^{\text{RGB}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{p}_i - K\mathbf{h}^{-1}\mathbf{y}_i||$), or the Kabsch solver on 3D-3D correspondences for RGB-D ($r^{\text{RGB-D}}(\mathbf{y}_i,\mathbf{h}) = ||\mathbf{e}_i - \mathbf{h}^{-1}\mathbf{y}_i||$) — then choose the hypothesis with maximal inlier count $s(\mathbf{h},\mathcal{Y})=\sum_{\mathbf{y}_i\in\mathcal{Y}}\mathbf{1}[\,r(\mathbf{y}_i,\mathbf{h})<\tau\,]$ ($\tau{=}10$ px RGB / 10 cm RGB-D) and refine it iteratively on its inliers (Levenberg-Marquardt PnP or Kabsch).

**One initialization objective for three settings.** DSAC\* trains in any of: RGB-D; RGB + 3D model (rendered ground-truth coordinates $\mathbf{y}^*_i$); or RGB only. The unified per-pixel loss switches *dynamically per pixel* from 3D distance to reprojection error once a prediction becomes valid:

$$\ell^{\text{RGB+M}}(\mathbf{y}_{i},\mathbf{y}^{*}_{i},\mathbf{h}^{*})=\begin{cases}\hat{r}^{\text{RGB}}(\mathbf{y}_{i},\mathbf{h}^{*})&\text{if }\mathbf{y}_{i}\in\mathcal{V}\\ ||\mathbf{y}^{*}_{i}-\mathbf{y}_{i}||&\text{otherwise},\end{cases}$$

where $\hat{r}^{\text{RGB}}$ soft-clamps the reprojection error (square root beyond 100 px). Without a 3D model, $\mathbf{y}^*_i$ is replaced by heuristic targets $\bar{\mathbf{y}}_i = \mathbf{h}^*\bar{\mathbf{e}}_i$ hallucinated at constant 10 m depth. This replaces DSAC++'s two wasteful separate initialization stages, halving pre-training from 4 to 2 days.

**End-to-end training through differentiable RANSAC.** The whole pipeline is then trained on the pose loss $\ell^{\text{Pose}}(\hat{\mathbf{h}},\mathbf{h}^{*})=||\hat{\mathbf{t}}-\mathbf{t}^{*}||+\gamma\measuredangle(\hat{\bm{\theta}},\bm{\theta}^{*})$ with $\gamma{=}100$. Every component is made differentiable: Kabsch via SVD gradients; PnP via analytical gradients of the last Gauss-Newton iteration, $\frac{\partial}{\partial\mathcal{Y}}\mathbf{h}(\mathcal{Y})\approx-J_{\mathbf{r}}^{+}\frac{\partial}{\partial\mathcal{Y}}\mathbf{r}_{\mathcal{I}}(\mathcal{Y},\mathbf{h}^{t=\infty})$; inlier counting via a sigmoid relaxation $s(\mathbf{h},\mathcal{Y})=\sum_{i}\sigma[\beta\tau-\beta r(\mathbf{y}_{i},\mathbf{h})]$ with $\beta = 5/\tau$; and hypothesis selection via DSAC — sampling $j\sim p(j|\mathcal{Y})$ from a softmax over scores and minimizing the expected pose loss

$$\mathcal{L}^{\text{Pose}}(\mathcal{Y},\mathbf{h}^{*})=\mathbb{E}_{j\sim p(j|\mathcal{Y})}\left[\hat{\ell}^{\text{Pose}}(\mathbf{R}(\cdot),\mathbf{h}^{*})\right],$$

whose gradient combines a score-function term $\hat{\ell}^{\text{Pose}}(\cdot)\,\partial_{\mathcal{Y}}\log p(j|\mathcal{Y})$ with the pathwise derivative. Geometric data augmentation (±30° rotations, 66-150% rescaling) is added during training.

## Results

- **7Scenes** (% frames within 5 cm/5°): 85.2% in the RGB + 3D model setting — state of the art, matching SCoCR at a fraction of the model size (28 MB vs 165 MB); RGB-only training improves +27.6% over DSAC++; RGB-D accuracy slightly exceeds OtF Forests' 93.4% (without their ICP post-processing). Data augmentation contributes +9.1/+7.7/+4.1% depending on setup (+51.5% on Stairs, RGB-only).
- **12Scenes**: state of the art in all settings, ~99% — "solved", even RGB-only for DSAC\*.
- **Cambridge Landmarks** (median translation cm / rotation °, with 3D model): St Mary's Church 13/0.4, Great Court 49/0.3, Old Hospital 21/0.4, King's College 15/0.3, Shop Facade 5/0.3 — on par with DSAC++ but trained in 2.5 days instead of 6. *Without* a 3D model DSAC\* beats DSAC++ on all scenes (e.g. Great Court 34/0.2 — better than any method trained *with* the model, whose SfM reconstruction is outlier-heavy).
- **Efficiency**: 50 ms forward pass (vs 150 ms DSAC++), 75 ms total inference (vs 200 ms); a 4 MB "Tiny" variant still reaches 73.6% (7Scenes) and 98.1% (12Scenes); 28 MB DSAC\* gives the highest average accuracy in a scene-compression comparison on Cambridge.

## Why it matters for SLAM

Relocalization — recovering the 6-DoF camera pose inside a previously mapped scene — is what SLAM systems need after tracking loss or when restarting in a known environment. DSAC\* is the mature form of the scene-coordinate-regression answer: the map is stored implicitly in network weights while a geometric PnP/Kabsch + RANSAC solver stays in the loop, giving centimeter-level indoor accuracy from a single image. Its stable, consolidated training recipe became the reference baseline that the ACE family later accelerated by orders of magnitude.

## Related

- [DSAC](dsac.md) — original differentiable RANSAC for camera localization
- [DSAC++](dsacpp.md) — self-supervised training from camera poses only
- [ACE](ace.md) — matches DSAC\* accuracy with minutes of training
- [ACE Zero](ace-zero.md) — extends SCR to learn poses and map jointly from scratch
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — why SCR beats direct pose regression
