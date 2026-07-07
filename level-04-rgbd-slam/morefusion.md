# MoreFusion

> Wada 2020 · [Paper](https://arxiv.org/abs/2004.04336)

**One-line summary** — Fuses RGB-D video into per-object occupancy volumes and jointly refines the 6D poses of multiple known objects with differentiable collision checking, enabling accurate pose estimation for objects in contact and under occlusion.

## Problem

6D object pose estimation from a single RGB-D image is fundamentally limited by occlusion and ambiguity: an object partially hidden behind another cannot be fully localized from one view, and symmetric objects admit multiple valid poses. Single-view methods therefore fail precisely in the most practically important scenario — cluttered scenes where objects are in contact and occlude each other, the norm in robot manipulation. Multi-view information is the natural remedy, but naively accumulating per-frame pose proposals produces physically impossible states where objects interpenetrate; a joint, physics-aware optimization is needed.

## Method & architecture

The system runs four stages over a live RGB-D stream (camera pose from robot forward kinematics, or ORB-SLAM2 when hand-held):

1. **Object-level volumetric fusion** — Mask R-CNN produces instance masks each frame; masked depth is fused into a per-object octree occupancy map (OctoMap), one volume per detected object *and* per unrecognized background structure; instances are tracked across frames by IoU between detected and rendered masks. This accumulates each object's geometry from multiple views, plus free/unknown-space information.
2. **Volumetric pose prediction** — each target object gets a $32\times32\times32$ occupancy grid whose voxels are labeled self / other-object / free / unknown ($g^{\mathtt{self}}, g^{\mathtt{other}}, g^{\mathtt{free}}, g^{\mathtt{unknown}}$). A network combines ResNet-18 features from the masked RGB, point-wise encodings of the masked point cloud, voxelization of those features, and 3D CNNs over the concatenated feature+occupancy grid, then predicts point-wise poses with confidences. Training uses the DenseFusion-style pose loss over model points $p_q \in X$,
   $$L_{i}=\frac{1}{|X|}\sum_{q}\lVert(\mathtt{R}p_{q}+\mathbf{t})-(\hat{\mathtt{R}}_{i}p_{q}+\hat{\mathbf{t}}_{i})\rVert, \qquad L=\frac{1}{N}\sum_{i}\big(L_{i}c_{i}-\lambda\log c_{i}\big)$$
   with $\lambda=0.015$; for symmetric objects the correspondence becomes a nearest-neighbor min over $p_{q'}$, and a warm-up epoch with the standard loss avoids the symmetric loss's local minima on non-convex shapes.
3. **Collision-based pose refinement (ICC)** — poses of all objects are refined jointly by gradient descent through a differentiable occupancy voxelization: a CAD-model point $p_q$ transformed by the pose hypothesis maps to voxel coordinates $u_{q}=(p_{q}-l)/s$, and voxel $k$ gets occupancy $o_{k}=1-\delta_{k}/\delta^{t}$ with $\delta_{k}=\min(\delta^{t},\min_{q}\lVert u_{q}-v_{k}\rVert)$. Surrounding-object hypotheses are aggregated with an element-wise max and unioned with fused impenetrable space $g^{\mathtt{impen}}_{m}=g^{\mathtt{other}}_{m}\cup g^{\mathtt{free}}_{m}$; the loss penalizes intersection with impenetrable space while rewarding overlap with the object's own fused surface:
   $$L=\frac{1}{N}\sum_{m}\big(L_{m}^{\mathtt{c+}}-L_{m}^{\mathtt{c-}}\big), \quad L_{m}^{\mathtt{c+}}=\frac{\sum_{k} g^{\mathtt{target}}_{m}\odot g^{\mathtt{target-}}_{m}}{\sum_{k}g^{\mathtt{target}}_{m}}, \quad L_{m}^{\mathtt{c-}}=\frac{\sum_{k} g_{m}^{\mathtt{target}}\odot g_{m}^{\mathtt{self}}}{\sum_{k}g_{m}^{\mathtt{self}}}$$
   computed batched on GPU — objects in contact constrain each other.
4. **CAD alignment** — once the pairwise pose losses among the $N$ most recent per-view hypotheses agree under a threshold, the CAD model is spawned into the map at the agreed pose, replacing the intermediate volumetric representation.

## Results

Evaluated with ADD(-S)/ADD-S AUC (10 cm max threshold) on YCB-Video and the authors' harder physics-simulated Cluttered YCB dataset (1200 scenes × 15 frames). The reimplemented baseline DenseFusion* (warm-up loss + point-cloud centralization) already lifts the official DenseFusion from 83.9/90.9 to 89.1/93.3 on YCB-Video. Trained on the combined set, MoreFusion reaches 91.0/95.7 on YCB-Video vs 88.4/94.9 for DenseFusion*, and 83.4/92.3 vs 81.7/91.7 on Cluttered YCB; the gap widens under heavy occlusion (visibility < 30 %): 63.5/85.1 vs 59.7/83.8. Feeding richer occupancy context at test time (full non-target + background reconstructions) improves further to 85.5/93.8 — exactly the information the incremental mapping system accumulates. For refinement, Iterative Collision Check beats ICP under heavy occlusion and the combination ICC+ICP is consistently best (ICC resolves collisions in the discretized grid, ICP then aligns surfaces precisely). The headline demonstration is a real-time robot arm that disassembles complicated piles of objects — moving obstructing objects aside to reach a target — using only on-board RGB-D vision.

## Why it matters for SLAM

MoreFusion connects semantic SLAM to robot manipulation: cluttered tabletop scenes with touching, occluding objects are exactly where single-view 6D pose estimators fail and where a SLAM-style multi-view, map-centric approach shines. It extends the Fusion++ per-object volume idea from reconstruction to precise 6D pose estimation, and its collision-aware joint optimization is a principled treatment of mutual occlusion that later object-level and manipulation-oriented systems build on.

## Related

- [Fusion++](fusionpp.md)
- [SLAM++](slampp.md)
- [PointFusion / DenseFusion](pointfusion-densefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)
