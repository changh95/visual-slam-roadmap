# HF-Net

> Sarlin 2019 · [Paper](https://arxiv.org/abs/1812.03506)

**One-line summary** — Coarse-to-fine hierarchical localization: global retrieval narrows the search to candidate places, local feature matching then yields a precise 6-DoF pose — with HF-Net computing both feature types in a single CNN forward pass.

## Problem

Robust and accurate visual localization is fundamental for autonomous driving, mobile robotics, and AR, but remains hard at large scale and under strong appearance change (day-night, seasons). Direct 2D-3D matching methods (Active Search, CSL) are accurate but become ambiguous and slow as models grow and appearance changes; image-retrieval methods are robust but only give a pose up to the database discretization. Hand-crafted features (SIFT) limit robustness, learned dense features are intractable on mobile — and computing a retrieval network plus a local-feature network separately is redundant, since both start from the same low-level image cues.

## Method & architecture

**Hierarchical localization pipeline** (following Sarlin 2018, upgraded with learned features):
1. *Prior retrieval*: match the query's global descriptor against database images; the k-nearest neighbors are candidate locations.
2. *Covisibility clustering*: group prior frames into *places* — connected components of the covisibility graph linking database images to the SfM model's 3D points.
3. *Local matching*: per place, match query 2D keypoints to the place's 3D points and estimate a 6-DoF pose with PnP + RANSAC, stopping at the first valid pose. A modified ratio test only rejects a match if the two nearest neighbors belong to *different* 3D points, keeping matches in highly covisible areas.

The strongest variant, **NV+SP**, uses NetVLAD for retrieval and SuperPoint for local features; SfM models are re-triangulated with SuperPoint keypoints via COLMAP under ground-truth reference poses.

**HF-Net.** To make this run on mobile, a single MobileNetV2 encoder (depth multiplier 0.75) feeds three heads: keypoint scores and dense local descriptors (SuperPoint's parameter-free decoding, branching at layer 7 where spatial resolution is still high) and a NetVLAD global-descriptor head at layer 18 — local features are lower-level than image-wide ones, so the split points differ.

**Multi-task distillation.** Ground-truth local correspondences and globally diverse imagery don't coexist in any dataset, so HF-Net is instead trained to copy three teachers — NetVLAD ($t_1$, global), SuperPoint ($t_2$ descriptors, $t_3$ keypoints) — with self-balancing loss weights $w_{1,2,3}$ (Kendall et al.):

$$L=e^{-w_{1}}\|\mathbf{d}^{g}_{s}-\mathbf{d}^{g}_{t_{1}}\|_{2}^{2}+e^{-w_{2}}\|\mathbf{d}^{l}_{s}-\mathbf{d}^{l}_{t_{2}}\|_{2}^{2}+2e^{-w_{3}}\,\mathrm{CrossEntropy}(\mathbf{p}_{s},\mathbf{p}_{t_{3}})+\sum_{i}w_{i}$$

where $\mathbf{d}^{g},\mathbf{d}^{l}$ are global/local descriptors and $\mathbf{p}$ keypoint scores. Training uses 185k Google Landmarks day-time images plus 37k night/dawn Berkeley Deep Drive images (night data proved critical for night retrieval), with photometric augmentation but teacher targets predicted on clean images.

## Results

- **Benchmarks** (recall within distance/orientation thresholds): on **Aachen Day-Night**, NV+SP localizes 40.8 / 56.1 / 74.5% of night queries at (0.5m,2°)/(1m,5°)/(5m,10°) vs 30.6/43.9/58.2 for NV+SIFT and 19.4/30.6/43.9 for Active Search. On **CMU Seasons** urban, NV+SP reaches 91.7/94.6/97.7 vs 75.0/82.1/87.8 for the semantic SMC baseline. On **RobotCar Seasons** night, 6.6/17.1/32.2 vs 0.5/1.1/3.4 for AS. HF-Net tracks its NV+SP upper bound within 2.6% average recall (its distilled global descriptor is the limiting factor on blurry RobotCar night queries).
- **Distillation can beat the teacher**: swapping HF-Net's local features into the NV+SP pipeline (NV+HF-Net) slightly outperforms SuperPoint itself on Aachen (e.g., 81.2 vs 79.7 at 0.25m day).
- **Leaner maps**: the SuperPoint/HF-Net Aachen model has 685k 3D points vs 1,899k for SIFT and 2,576 vs 10,230 keypoints per image, with a higher fraction of keypoints matched (33.8% vs 18.8%) — sparser models that localize better.
- **Runtime** (GTX 1080): full localization in 45 ms on Aachen day vs 148 ms for NV+SP, 375 ms for Active Search and 1356 ms for NV+SIFT — HF-Net inference is 7x faster than running NetVLAD+SuperPoint separately, and the whole system runs at over 20 FPS, ~10x faster than AS.

## Why it matters for SLAM

The coarse-to-fine paradigm HF-Net established is now the universal design for relocalization and loop-closure verification in SLAM: essentially every modern system retrieves places with a global descriptor and confirms them with local feature matching. Its companion toolbox hloc became the standard visual localization pipeline used in competitions and research, and the same recipe powers large-scale AR localization services.

## Related

- [hloc](hloc.md) — the open-source toolbox implementing this hierarchical pipeline
- [NetVLAD](netvlad.md) — the global retrieval descriptor
- [SuperPoint](superpoint.md) — the local features used for fine matching
- [SuperGlue](superglue.md) — the learned matcher that later upgraded the fine stage
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the coarse retrieval problem in general
