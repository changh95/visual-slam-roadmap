# MoreFusion

> Wada 2020 · [Paper](https://arxiv.org/abs/2004.04336)

**One-line summary** — Fuses RGB-D video into per-object TSDF volumes and jointly refines the 6D poses of multiple known objects with collision-based constraints, enabling accurate pose estimation for objects in contact and under occlusion.

## Problem

6D object pose estimation from a single RGB-D image is fundamentally limited by occlusion and ambiguity: an object partially hidden behind another cannot be fully localized from one view, and symmetric objects admit multiple valid poses. Single-view methods therefore fail precisely in the most practically important scenario — cluttered scenes where objects are in contact and occlude each other, the norm in robot manipulation. Multi-view information is the natural remedy, but naively accumulating per-frame pose proposals produces physically impossible states where objects interpenetrate; a joint, physics-aware optimization is needed.

## Key ideas

- **DL instance segmentation + volumetric pose prediction**: Mask-RCNN segments object instances, and a CNN operating on each masked RGB-D crop predicts 6D pose proposals; these single-view proposals are noisy but provide good initialization for multi-view refinement.
- **Object-level volumetric fusion**: as the camera moves, depth within each instance mask is fused into a per-object TSDF,
  $$\text{TSDF}_{o_k}(\mathbf{x}) \leftarrow \text{fuse}\!\left(\text{TSDF}_{o_k}(\mathbf{x}),\; f_t\!\left(\mathbf{T}_{co_k}^{-1}\mathbf{x}\right)\right),$$
  accumulating each object's geometry from multiple views — including surfaces that were occluded in earlier frames.
- **Non-parametric occupancy reasoning**: alongside recognized objects, the system accumulates occupancy information for *unrecognized* structures and unobserved-but-likely-occupied space, providing collision geometry even for parts of the scene never directly seen.
- **Joint collision-free pose optimization**: all object poses $\{\mathbf{T}_{wo_k}\}$ are jointly refined by minimizing an alignment cost between each fused volume and its known CAD model subject to non-intersection constraints,
  $$\min_{\{\mathbf{T}_{wo_k}\}} \sum_k E_{\text{align}}(\mathbf{T}_{wo_k}) \quad \text{s.t.} \quad \text{TSDF}_{o_k}(\mathbf{T}_{wo_j}^{-1}\mathbf{T}_{wo_k}\mathbf{x}) > 0 \;\;\forall k \neq j,$$
  with the constraint relaxed into a differentiable penalty and solved by gradient descent — eliminating interpenetrating configurations that single-view methods produce.
- **CAD object fitting with learned initialization**: like SLAM++, final poses come from fitting known object models, but initialization is learned rather than hand-crafted, occupancy is non-parametric, and the reasoning is explicitly multi-object — objects in contact constrain each other.

## Results & impact

MoreFusion (CVPR 2020) was verified on two object datasets — YCB-Video and the authors' more challenging Cluttered YCB-Video — demonstrating accurate, robust pose estimation for multiple known objects in contact and occlusion from real-time, embodied multi-view vision. The headline demonstration is a real-time robotics application: a robot arm precisely and orderly disassembles complicated piles of objects using only on-board RGB-D vision. It extended the Fusion++ per-object TSDF idea from pure reconstruction to precise 6D pose estimation, and its collision-aware joint optimization became a reference treatment of mutual occlusion for object-level SLAM and manipulation systems.

## Why it matters for SLAM

MoreFusion connects semantic SLAM to robot manipulation: cluttered tabletop scenes with touching, occluding objects are exactly where single-view 6D pose estimators fail and where a SLAM-style multi-view, map-centric approach shines. It extends the Fusion++ per-object TSDF idea from reconstruction to precise 6D pose estimation, and its collision-aware joint optimization is a principled treatment of mutual occlusion that later object-level and manipulation-oriented systems build on.

## Related

- [Fusion++](fusionpp.md)
- [SLAM++](slampp.md)
- [PointFusion / DenseFusion](pointfusion-densefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
