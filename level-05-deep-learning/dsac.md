# DSAC

> Brachmann 2017 · [Paper](https://arxiv.org/abs/1611.05705)

**One-line summary** — Makes RANSAC differentiable by replacing deterministic hypothesis selection with probabilistic selection, enabling end-to-end training of a scene-coordinate-based camera localization pipeline through the robust pose estimator.

## Problem

RANSAC is the central tool for robust estimation in geometric vision (multi-view geometry, pose estimation, SLAM), following the schema "predict locally, fit globally". But its hypothesis selection — take the model hypothesis with the highest consensus score, $\mathbf{h}_{\mathrm{AM}}=\arg\max_{\mathbf{h}_J} s(\mathbf{h}_J,Y)$ — is non-differentiable, so RANSAC could not sit inside an end-to-end trained deep pipeline. For camera relocalization specifically, deep learning had so far failed to beat traditional approaches: direct pose regression (PoseNet) is inaccurate (median translational errors around 40 cm per scene), while scene coordinate regression kept the geometry but its learned components could only be trained with surrogate losses, not the pose loss that actually matters.

## Method & architecture

The pipeline estimates the 6-DoF pose $\tilde{\mathbf{h}}$ of an RGB image in a known scene, following the scene coordinate regression (SCoRF) framework:

- **Coordinate CNN** ($\mathbf{w}$; VGG-style, 13 layers, 33M params): predicts for each 42x42 patch a scene coordinate $\mathbf{y}_i \in \mathbb{R}^3$ — a 2D-3D correspondence; 40x40 predictions per image.
- **Hypothesis generation**: minimal sets of $n{=}4$ correspondences are sampled uniformly and PnP yields a pool of 256 pose hypotheses $\mathbf{h}_J$.
- **Score CNN** ($\mathbf{v}$; 13 layers, 6M params): each hypothesis is scored from its 40x40 image of reprojection errors $e_i = \lVert\mathbf{p}_i - C\mathbf{h}_J\mathbf{y}_i\rVert$, where $\mathbf{p}_i$ is pixel $i$'s 2D location and $C$ the camera projection matrix.
- **Selection + refinement**: one hypothesis is selected, then refined for 8 iterations on inlier coordinates (reprojection error below $\tau=10$ px, at most 100 inliers).

Two routes to differentiability of the selection step are compared:

- **SoftAM (soft argmax)**: replace selection with a softmax-weighted average, $\mathbf{h}_{\mathrm{SoftAM}}=\sum_J P(J|\mathbf{v},\mathbf{w})\,\mathbf{h}_J$ with $P(J|\mathbf{v},\mathbf{w}) \propto \exp(s(\mathbf{h}_J,Y;\mathbf{v}))$ — but this abandons RANSAC's hard decision and learns a robust average instead.
- **DSAC (probabilistic selection)**: keep a hard choice but sample it, $\mathbf{h}_{\mathrm{DSAC}}=\mathbf{h}_J$ with $J \sim P(J|\mathbf{v},\mathbf{w})$, and minimize the *expected* task loss, inspired by policy-gradient reinforcement learning:

$$\tilde{\mathbf{w}},\tilde{\mathbf{v}}=\arg\min_{\mathbf{w},\mathbf{v}}\sum_{I\in\mathcal{I}}\mathbb{E}_{J\sim P(J|\mathbf{v},\mathbf{w})}\left[\ell(\mathbf{R}(\mathbf{h}_J^{\mathbf{w}},Y^{\mathbf{w}}))\right]$$

  whose gradient is itself an expectation:

$$\frac{\partial}{\partial\mathbf{w}}\mathbb{E}_{J}\left[\ell(\cdot)\right]=\mathbb{E}_{J}\left[\ell(\cdot)\frac{\partial}{\partial\mathbf{w}}\log P(J|\mathbf{v},\mathbf{w})+\frac{\partial}{\partial\mathbf{w}}\ell(\cdot)\right]$$

The training loss is the pose error $\ell_{\text{pose}}(\mathbf{h},\mathbf{h}^{*})=\max(\measuredangle(\boldsymbol{\theta},\boldsymbol{\theta}^{*}),\lVert\mathbf{t}-\mathbf{t}^{*}\rVert)$ (rotation in degrees, translation in cm). Both CNNs are first trained componentwise ($L_1$ coordinate loss; scores regressed against $-\beta\,\ell_{\text{pose}}$ with $\beta{=}10$), then end-to-end; PnP and refinement derivatives are taken via central differences.

## Results

On the 7-Scenes dataset (accuracy = % of test frames within 5 cm / 5 deg):

- **Componentwise**: RANSAC 61.0%, SoftAM 61.6%, DSAC 60.3% on the complete set (17,000 frames) — all already above the sparse-feature baseline (38.6%) and Brachmann et al.'s auto-context forest pipeline (55.2%), mainly thanks to the Score CNN.
- **End-to-end**: DSAC improves to **62.5%** (+2.2%, SEM ±0.4%), with Kitchen +5.0% and Pumpkin +3.3%; SoftAM *drops* to 57.8% (−3.8%), overfitting severely (Office −14.7%) — its averaging forces aggressive down-weighting that collapses the score distribution, while DSAC keeps it broad. End-to-end DSAC beats the prior state of the art by 7.3% on the complete set (4.9% scene average).
- **Median pose error**: 3.9 cm / 1.6 deg vs. 4.5 cm / 2.0 deg for Brachmann et al.; PoseNet (~40 cm median translation) is not competitive.
- After end-to-end training the original argmax selection can be restored at test time with no loss (62.4%). Weakness: the Stairs scene (4.5%) suffers from uni-modal point predictions on repeating structures.

## Why it matters for SLAM

DSAC established scene coordinate regression as the dominant learned paradigm for indoor camera relocalization, dramatically outperforming absolute pose regression because it keeps the geometric solver in the loop and trains for the pose loss the task actually cares about. The differentiable-RANSAC idea spread broadly through geometric deep learning — the paper explicitly proposes it as a robust optimization component for learning SfM or SLAM end-to-end — and DSAC is the direct ancestor of DSAC++, DSAC\*, and the ACE line of fast-training relocalizers used today.

## Related

- [PoseNet](posenet.md) — absolute pose regression baseline that SCR superseded
- [DSAC++](dsacpp.md) — successor: one learnable component, trainable from poses alone
- [DSAC\*](dsac-star.md) — unified RGB/RGB-D framework with stabilized training
- [ACE](ace.md) — scene coordinate regression trained in minutes instead of hours
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — why direct pose regression falls short
