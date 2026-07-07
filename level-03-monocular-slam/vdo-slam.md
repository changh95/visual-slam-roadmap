# VDO-SLAM

> Zhang 2020 · [Paper](https://arxiv.org/abs/2005.11052)

**One-line summary** — A dynamic object-aware SLAM system that jointly estimates the camera trajectory and the SE(3) motions of rigid moving objects in a single factor graph, without requiring prior object models.

## Problem

Robot path planning and obstacle avoidance in dynamic environments rely on knowing how the objects around the robot are moving — yet classical SLAM assumes a static world, and most "dynamic SLAM" systems merely detect moving content and throw it away. VDO-SLAM instead integrates dynamic rigid objects into the estimation problem itself: it identifies, tracks, and estimates the full SE(3) motion of every moving object jointly with the camera, with no prior knowledge of object shape or geometric model.

## Method & architecture

**Pre-processing.** Instance segmentation (Mask R-CNN, COCO weights) separates potentially movable objects; dense optical flow (PWC-Net) supplies correspondences everywhere, maximising tracked points on objects that occupy few pixels, and propagates per-object identifiers (recovering masks when segmentation fails). Input is RGB-D, stereo converted to depth, or "learning-based monocular" using MonoDepth2 depth.

**Motion representation.** With camera pose ${}^{0}\mathbf{X}_k$ and object pose ${}^{0}\mathbf{L}_k \in \mathrm{SE}(3)$, the point ${}^{0}\mathbf{m}^i_k$ on a rigid object obeys

$${}^{0}\mathbf{m}^{i}_{k} = {}^{0}\mathbf{L}_{k-1}\; {}^{L_{k-1}}_{k-1}\mathbf{H}_{k}\; {}^{0}\mathbf{L}^{-1}_{k-1}\; {}^{0}\mathbf{m}^{i}_{k-1} = {}^{0}_{k-1}\mathbf{H}_{k}\; {}^{0}\mathbf{m}^{i}_{k-1},$$

so the object's frame-to-frame motion ${}^{0}_{k-1}\mathbf{H}_k \in \mathrm{SE}(3)$ relates its own points across time **without ever putting the object pose in the state** — the key to model-free operation.

**Front-end estimation.** The camera pose minimises Huber-robustified reprojection error over static points, $\mathbf{e}_i = {}^{I_k}\tilde{\mathbf{p}}^i_k - \pi({}^{0}\mathbf{X}^{-1}_k\,{}^{0}\mathbf{m}^i_{k-1})$; each object motion minimises the analogous cost $\mathbf{e}_i = {}^{I_k}\tilde{\mathbf{p}}^i_k - \pi({}^{0}_{k-1}\mathbf{G}_k\,{}^{0}\mathbf{m}^i_{k-1})$ with ${}^{0}_{k-1}\mathbf{H}_k = {}^{0}\mathbf{X}_k\,{}^{0}_{k-1}\mathbf{G}_k$, both parameterised in $\mathfrak{se}(3)$ and solved by Levenberg–Marquardt. Crucially, the optical flow is *refined jointly* with each motion (a regularisation term anchors it to the initial flow), which greatly lengthens point tracks. Objects are declared dynamic by scene-flow magnitude (threshold 0.12, object dynamic if >30% of its points move).

**Back-end factor graph.** Camera poses, static points, dynamic points, and object motions are refined in one graph with four factor types:

$$\mathbf{e}_{i,k} = {}^{0}\mathbf{X}^{-1}_k\,{}^{0}\mathbf{m}^i_k - \mathbf{z}^i_k \quad \text{(3D point measurement)}, \qquad \mathbf{e}_{i,l,k} = {}^{0}\mathbf{m}^i_k - {}^{0}_{k-1}\mathbf{H}^l_k\,{}^{0}\mathbf{m}^i_{k-1} \quad \text{(ternary point-motion)},$$

plus odometry factors and a smooth-motion prior $\mathbf{e}_{l,k} = ({}^{0}_{k-2}\mathbf{H}^{l}_{k-1})^{-1}\,{}^{0}_{k-1}\mathbf{H}^l_k$ penalising abrupt object-motion change. Solved with LM in a modified g2o. Object linear velocity falls straight out of the motion: $\mathbf{v} \approx {}^{0}_{k-1}\mathbf{t}_{k} - (\mathbf{I}_3 - {}^{0}_{k-1}\mathbf{R}_{k})\,\mathbf{c}_{k-1}$, with $\mathbf{c}_{k-1}$ the object's point centroid.

## Results

- **Oxford Multimotion** (swinging_4_unconstrained, 500 frames): camera error $E_t$ = 0.0112 m / $E_r$ = 0.77° vs MVO's 0.0314 m / 1.19° (≈35% better camera estimate, 15–40% better on swinging boxes); object motion estimates more than twice as accurate as ClusterVO on most boxes, though ClusterVO edges camera translation (0.0066 m).
- **KITTI tracking** (9 dynamic sequences): camera accuracy competitive with DynaSLAM II (slightly lower rotational, higher translational error); object motion translation errors 0.1–0.3 m and rotation 0.2–1.5° (RGB-D) vs CubeSLAM's >3 m / >3° — an order of magnitude improvement in most cases. Objects tracked for >80% of their occurrence; estimated speeds consistently close to ground truth (e.g. a van tracked through 33 frames of segmentation failure with 2.64 km/h average speed error).
- **Ablations:** joint flow refinement yields far more long tracks (e.g. seq 01 background: 237 → 5075 points tracked >5 frames) and ~10% (camera) / ~25% (object) lower errors; global graph refinement cuts object motion error by up to 39% (translation) / 55% (rotation).
- **Runtime:** tracking at 5–8 fps on a laptop CPU (i7 2.6 GHz), with segmentation/flow computed offline.

## Why it matters for SLAM

VDO-SLAM is a landmark of the "estimate, don't discard" school of dynamic SLAM: dynamic objects become first-class estimation targets rather than outliers. Its model-free point-motion factor — relating points on a rigid body across time without an object pose variable — is an elegant formulation now standard in dynamic SLAM, and the open-source release made it the reference baseline for joint camera/object estimation in driving and mobile-robot scenarios.

## Related

- [DynaSLAM](dynaslam.md) — dynamic content detection and removal approach
- [DynaSLAM II](dynaslam-ii.md) — tightly-coupled multi-object tracking and SLAM in the same spirit
- [MID-Fusion](mid-fusion.md) — object-level dense tracking of dynamic objects with RGB-D
- [MaskFusion](maskfusion.md) — real-time recognition and reconstruction of moving objects
- [PWC-Net](../level-05-deep-learning/pwc-net.md) — the dense optical flow front-end it builds on
- [Factor graph](../level-02-getting-familiar/factor-graph.md) — the machinery that hosts both camera and object states
