# DeMoN

> Ummenhofer 2017 · [Paper](https://arxiv.org/abs/1612.02401)

**One-line summary** — DeMoN (CVPR 2017) formulated two-view structure-from-motion as a learning problem: a chain of stacked encoder-decoder networks jointly estimates depth and camera motion from an unconstrained image pair, learning correspondence via forced optical-flow prediction.

## Problem

Classical two-view SfM chains keypoint detection, descriptor matching, essential-matrix estimation, and dense stereo — motion is estimated first from sparse, outlier-prone correspondences, so a bad motion estimate poisons the depth, texture-poor regions fail, and all existing pipelines break under small camera translation. Single-image depth networks avoid matching but generalize poorly outside their training distribution because they rely purely on appearance priors. DeMoN trains a network end-to-end to compute depth and motion from successive, *unconstrained* image pairs — and shows that the naive approach fails: a plain encoder-decoder fed two frames takes the single-image shortcut and simply ignores the second image.

## Method & architecture

- **Three components in a chain: bootstrap net → iterative net → refinement net.** The bootstrap and iterative components are each a *pair* of encoder-decoders: the first predicts optical flow and a flow-confidence map from the image pair (encoders use pairs of 1D filters to afford large receptive fields); the second takes flow, confidence, the images, and the flow-warped second image, and predicts depth, surface normals, and — through three fully connected layers — the camera motion $\mathbf{r},\mathbf{t}$ and a depth scale factor $s$.
- **Forcing matching.** Predicting flow requires using both images; feeding that flow to the depth/motion network makes it exploit motion parallax. This is the key architectural trick: naive two-frame depth is no better than single-image (L1-inv 0.079 vs 0.080), while DeMoN reaches 0.012.
- **Parameterization.** Rotation $\mathbf{r}=\theta\mathbf{v}$ (angle-axis), translation normalized to $\|\mathbf{t}\|=1$ to fix the scale gauge; the network predicts inverse depth $\xi=1/z$ (handles points at infinity) and a scalar $s$ so final depth is $s\xi$.
- **Iterative net.** Converts the previous depth+motion into a flow proposal and the flow into a depth proposal, then re-estimates — learned iterative refinement with shared weights. Training appends predictions from previous training iterations to the minibatch instead of unrolling (no backprop through iterations), saving memory; improvements saturate after 3–4 iterations. The refinement net upsamples the 64×48 estimate to full 256×192 resolution. A forward pass with 3 iterations takes 110 ms on a GTX Titan X.
- **Losses.** L1 on scaled inverse depth, $\mathcal{L}_{\text{depth}}=\sum_{i,j}|s\,\xi(i,j)-\hat{\xi}(i,j)|$; L2 on normals and flow; a confidence loss with ground truth $\hat{c}_{x}=e^{-|\mathbf{w}_{x}-\hat{\mathbf{w}}_{x}|}$; L2 motion losses; and the paper's signature **scale-invariant gradient loss** built from the discrete gradient at pixel $(i,j)$,

$$\mathbf{g}_{h}[f]=\left(\tfrac{f(i+h,j)-f(i,j)}{|f(i+h,j)|+|f(i,j)|},\ \tfrac{f(i,j+h)-f(i,j)}{|f(i,j+h)|+|f(i,j)|}\right)^{\top},$$

$$\mathcal{L}_{\text{grad}\,\xi}=\sum_{h\in\{1,2,4,8,16\}}\sum_{i,j}\left\|\ \mathbf{g}_{h}[\xi]-\mathbf{g}_{h}[\hat{\xi}]\ \right\|_{2},$$

  which penalizes relative depth errors between neighbours over 5 spacings — sharpening depth discontinuities and smoothing homogeneous regions.
- **Training data.** SUN3D, RGB-D SLAM, MVS reconstructions, the synthetic Scenes11, and the authors' Blendswap set; Caffe with Adam, trained in three phases (sequential encoder-decoders, then joint iterative training, then refinement).

## Results

- **Vs classical two-frame SfM** (baselines built from SIFT or FlowFields correspondences + 8-point/RANSAC + reprojection refinement + plane-sweep stereo): DeMoN wins on depth and motion "by a factor of 1.5 to 2 on most datasets" — e.g. Sun3D: L1-rel 0.172 vs 0.297 (Base-FF), rotation error 1.80° vs 3.68°, translation direction error 18.8° vs 33.3°; Scenes11: rotation 0.81°, translation 8.9°. Only on texture-rich MVS is the flow-based baseline on par in motion.
- On all datasets except MVS, DeMoN's depth even beats **Base-Oracle** — classical stereo given the *ground-truth* motion (e.g. Sun3D sc-inv 0.114 vs 0.241).
- **Vs single-image depth** (Eigen&Fergus VGG, Liu et al.): better on all datasets except NYUv2 (their training domain). On a self-recorded generalization set of unusual scenes (sculptures, close-ups, 90°-rotated images): L1-inv 0.041 vs 0.062 (Eigen) and 0.055 (Liu) — the motion parallax generalizes where appearance priors fail.
- Handles the degenerate small/zero-baseline case gracefully, and concatenating pairwise motions yields locally consistent trajectories on RGB-D SLAM sequences (translational drift, no loop closure) — "results convince us that DeMoN can be integrated into such [SLAM] systems".

## Why it matters for SLAM

DeMoN is the ancestor of the "feed the network two images, get geometry out" family. It demonstrated that learned two-view geometry needs matching, not just recognition — a lesson that still shapes front-end design — and its learned iterative refinement prefigures BA-Net, DeepV2D, and RAFT-style systems, while its unconstrained two-view setting is exactly what DUSt3R revisits at foundation-model scale.

## Related

- [BA-Net](ba-net.md)
- [DeepV2D](deepv2d.md)
- [SfM-Learner](sfm-learner.md)
- [FlowNet](flownet.md)
- [DUSt3R](dust3r.md)
