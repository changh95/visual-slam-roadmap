# VGGT-SLAM

> Maggio 2025 · [Paper](https://arxiv.org/abs/2505.12549)

**One-line summary** — Dense monocular RGB SLAM that uses VGGT as its front-end, incrementally aligning feed-forward submap reconstructions with a factor graph optimized on the SL(4) manifold — because uncalibrated submaps can differ by a full 15-DoF projective transform, not just a similarity transform.

## Problem

VGGT reconstructs a batch of frames in one forward pass, but GPU memory caps a single inference at roughly 60 frames on an RTX 4090 (24 GB), so long videos must be split into submaps that are then aligned into one map. Related works align submaps with similarity transforms (rotation + translation + scale), but VGGT-SLAM shows this is inadequate for uncalibrated cameras: by the Projective Reconstruction Theorem, with no assumptions on camera motion, scene structure, or intrinsics, the scene is recoverable only up to a 15-degrees-of-freedom projective transformation of the true geometry. A 7-DoF Sim(3) alignment therefore cannot always make two submaps agree — especially when disparity between frames is small and VGGT's learned metric priors become unreliable, leaving residual shear, stretch, and perspective distortion between submaps.

## Method & architecture

- **Submap generation**: a frame becomes a keyframe when its Lucas-Kanade disparity to the previous keyframe exceeds $\tau_{\text{disparity}}$. Once $w$ keyframes accumulate, the submap's image set is formed as $\mathcal{I}_{\mathrm{latest}} \leftarrow \{\mathbf{M}_{\mathrm{prior}}\} \cup \mathcal{I}_{\mathrm{latest}} \cup \mathcal{I}_{\mathrm{loop}}$ — the last non-loop-closure frame of the previous submap plus up to $w_{\text{loop}}$ retrieved loop frames — and passed to VGGT in one forward pass. Dense points $\mathbf{X}^{\mathcal{S}}$ come from inverse-projecting VGGT's depth maps with its camera estimates (more accurate than the point head), pruned where confidence falls below $\tau_{\text{conf}}$ of the average.
- **Submap alignment on SL(4)**: for corresponding points in two overlapping submaps, alignment is a $4\times 4$ homography
  $$\mathbf{X}^{\mathcal{S}_i}_a = \mathbf{H}^i_j\,\mathbf{X}^{\mathcal{S}_j}_b, \qquad \mathbf{H}^i_j \in \mathrm{SL}(4),$$
  with 15 DoF instead of Sim(3)'s 7. Because consecutive submaps share an identical frame, dense correspondences are known *without any matching*: $\mathbf{H}$ is recovered from the homogeneous linear system $\mathbf{A}_k \mathbf{h} = 0$ (where $\mathbf{h} \in \mathbb{R}^{16}$ holds the flattened homography), solved with a 5-point solver inside RANSAC and rescaled by the fourth root of its determinant so that $\det \mathbf{H} = 1$. Camera matrices are corrected via $\mathbf{P}_i = (\mathbf{H}^i_j)^{-1}\mathbf{P}_j$.
- **Loop closures**: each keyframe gets a SALAD descriptor; retrieval against older submaps (L2 similarity above $\tau_{\text{desc}}$) appends up to $w_{\text{loop}}$ frames to the current submap, so loop-closure homographies again come from exact shared-frame correspondences rather than estimated associations.
- **Backend — factor graph on the SL(4) manifold**: absolute homographies $\mathbf{H}_i$ mapping each submap into the global frame are estimated by MAP optimization
  $$\hat{\mathcal{H}} = \operatorname{argmin}_{\mathbf{H} \in \mathrm{SL}(4)} \sum_{(i,j) \in \mathcal{L}} \left\| \mathrm{Log}\left( \mathbf{H}^{-1}_i \mathbf{H}_j \left(\mathbf{H}^i_j\right)^{-1} \right) \right\|^2_{\Omega^{\mathbf{H}}_{ij}},$$
  where $\mathcal{L}$ indexes odometry and loop-closure constraints and $\mathrm{Log}$ maps to the Lie algebra $\mathfrak{sl}(4)$, parameterized by $\boldsymbol{\xi} \in \mathbb{R}^{15}$ with $\boldsymbol{\xi}^{\wedge} = \sum_{k=1}^{15} \boldsymbol{\xi}_k \mathbf{G}_k$ over the 15 generators $\mathbf{G}_k$. Levenberg-Marquardt updates poses on-manifold as $\mathbf{H} \leftarrow \mathbf{H}\,\mathrm{Exp}(\hat{\boldsymbol{\delta}})$, with Jacobians $\mathbf{J}_i = -\mathrm{Ad}_{\mathbf{H}_i^{-1}\mathbf{H}_j}$ and $\mathbf{J}_j = \mathbf{I}_{15\times 15}$.
- The system requires no camera intrinsics, no consistent calibration across frames, and no additional training. A Sim(3) variant (VGGT pose + scale alignment) is also built for comparison.

## Results

Evaluated on 7-Scenes and TUM RGB-D (ATE RMSE via evo), averaged over 5 runs on an RTX 4090; parameters $w_{\text{loop}}=1$, $\tau_{\text{disparity}}=25$ px, $\tau_{\text{conf}}=25\%$, 300 RANSAC iterations.

- **TUM RGB-D (uncalibrated)**: the SL(4) version with $w=32$ is best overall with average ATE **0.053 m**, vs MASt3R-SLAM* 0.060 m, DROID-SLAM* (auto-calibrated) 0.158 m, and the Sim(3) variant 0.074 m.
- **7-Scenes (uncalibrated)**: average ATE 0.067 m for both SL(4) and Sim(3) variants at $w=32$ — approximately the same as the top baseline MASt3R-SLAM* (0.066 m).
- **Dense reconstruction (7-Scenes)**: best accuracy (0.052 m) and Chamfer distance (0.055 m) across compared methods (MASt3R-SLAM* reaches 0.068 m accuracy / 0.056 m Chamfer; Spann3R@20 0.069 / 0.058).
- **Qualitative**: a 55 m office-corridor loop is fused from 22 submaps into a globally consistent map; figure examples show scenes where Sim(3) cannot align submaps but SL(4) rectifies the projective ambiguity.
- **Known failure mode**: the planar TUM `floor` scene (0.141 m) — the 15-DoF homography is degenerate for planar points, and 15 DoF also admit drift in scene perspective, not just scale/rotation/translation. Both issues motivated VGGT-SLAM 2.0.

## Why it matters for SLAM

VGGT-SLAM is the first system to wrap a multi-view feed-forward foundation model into a proper SLAM loop — submaps, loop closure, and a principled treatment of the reconstruction ambiguity that such models leave unresolved. Its central observation, that uncalibrated feed-forward submaps must be aligned on SL(4) rather than Sim(3), is conceptually important for anyone building SLAM on top of learned geometry, and its SL(4) factor-graph solver has since been merged into GTSAM. It sits in a direct line from DROID-SLAM and MASt3R-SLAM toward increasingly learned SLAM stacks.

## Related

- [VGGT](vggt.md) — the feed-forward front-end model
- [VGGT-SLAM 2.0](vggt-slam-2-0.md) — the follow-up system that removes the 15-DoF drift and planar degeneracy
- [MASt3R-SLAM](mast3r-slam.md) — SLAM built on pairwise pointmap predictions
- [DROID-SLAM](droid-slam.md) — earlier end-to-end learned SLAM with an optimization backend
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the retrieval problem SALAD solves for loop closure
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md) — background for the projective-ambiguity argument
