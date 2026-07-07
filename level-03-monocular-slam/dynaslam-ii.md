# DynaSLAM II

> Bescós 2021 · [Paper](https://arxiv.org/abs/2010.07820)

**One-line summary** — Tightly coupled multi-object tracking and SLAM: instead of discarding dynamic objects like DynaSLAM, it jointly optimises camera poses, the static map, and the trajectories of moving rigid objects in one bundle adjustment.

## Problem

Removing dynamic objects (DynaSLAM, DS-SLAM) protects camera tracking, but it throws information away — and "most scenarios including autonomous driving, multi-robot collaboration and augmented/virtual reality, require explicit motion information of the surroundings to help with decision making and scene understanding." DynaSLAM II therefore inverts the first paper's philosophy: rather than filtering dynamic content out, it estimates the moving objects' trajectories jointly with the camera, in a single tightly coupled optimisation for stereo and RGB-D configurations.

## Method & architecture

Built on ORB-SLAM2. Per frame: pixel-wise instance segmentation plus ORB features matched across the stereo pair. Static features are matched to the previous frame/map to initialise the camera; dynamic features (on vehicle/pedestrian/animal instances) are matched to the local map's object points — by reprojection under a constant-velocity model if the object's velocity is known, else by brute-force matching constrained to the most-overlapping instance. Instances inherit an object's track id when most of their keypoints match its points, backed by IoU matching of CNN 2D boxes; occlusions are handled because matching is against map objects, not the previous frame. A new object's SE(3) pose is initialised at the centre of mass of its 3D points with identity rotation.

**Reprojection error with objects.** The classic static residual $\mathbf{e}^{i,l} = \mathbf{u}^l_i - \pi_i(\mathbf{T}^i_{CW}\,\bar{\mathbf{x}}^l_W)$ is restated for dynamic points as

$$\mathbf{e}^{i,j,k}_{\mathrm{repr}} = \mathbf{u}^j_i - \pi_i\big(\mathbf{T}^i_{CW}\,\mathbf{T}^{k,i}_{WO}\,\bar{\mathbf{x}}^{j,k}_O\big),$$

where $\mathbf{T}^{k,i}_{WO}$ is object $k$'s pose when camera $i$ observes it and $\bar{\mathbf{x}}^{j,k}_O$ a 3D point *fixed in the object frame*. Object points thus stay unique: parameters shrink from $N = 6N_c + 3N_cN_oN_{op}$ (independent per-frame point clouds) to $N' = 6N_c + 6N_cN_o + 3N_oN_{op}$.

**BA with objects.** Cameras, static points, object poses, object points, and object velocities $\mathbf{v}^k_i, \mathbf{w}^k_i \in \mathbb{R}^3$ are optimised jointly (Huber-robustified) with two extra factors: a constant-velocity error $\mathbf{e}^{i,k}_{vcte} = \big[\mathbf{v}^k_{i+1}-\mathbf{v}^k_i;\ \mathbf{w}^k_{i+1}-\mathbf{w}^k_i\big]$ and a coupling term tying velocities to poses and points,

$$\mathbf{e}^{i,j,k}_{vcte,XYZ} = \big(\mathbf{T}^{k,i+1}_{WO} - \mathbf{T}^{k,i}_{WO}\,\Delta\mathbf{T}^{i,i+1}_{O_k}\big)\,\bar{\mathbf{x}}^{j,k}_O, \qquad \Delta\mathbf{T}^{i,i+1}_{O_k} = \begin{bmatrix} \mathrm{Exp}(\mathbf{w}^k_i\,\Delta t) & \mathbf{v}^k_i\,\Delta t \\ \mathbf{0} & 1 \end{bmatrix}.$$

Keyframes are spawned when camera *or* object tracking weakens; object-triggered keyframes optimise that object and camera over a 2 s temporal tail. Schur-complement solving costs $O(N_c^3 + N_c^2 N_{mp} + N_c N_o N_{op})$.

**Decoupled 3D bounding boxes.** Unlike CubeSLAM, trajectories do not wait for a box: a box is fit once per track by RANSAC (two perpendicular planes through the object points, class-based prior on unobserved dimensions), then loosely refined in a temporal window by minimising the distance between its image projection and the CNN 2D box — only once ≥3 keyframes observe the object, with soft dimension/pose priors for unobservable views.

## Results

- **KITTI tracking (ego-motion):** mean ATE 1.54 m vs ORB-SLAM2's 2.33 m and DynaSLAM's 1.45 m; in the heavy-traffic seq 0020, 1.36 m vs ORB-SLAM2's 16.80 m. When dynamic-class objects are parked, DynaSLAM II keeps them (velocity ≈ 0) and beats DynaSLAM, which blindly deletes their features. Mean RPE 0.053 m/frame beats VDO-SLAM (0.084) in every sequence, though VDO-SLAM has lower rotational RPE (0.036 vs 0.043°/frame); ClusterVO is broadly comparable.
- **Multi-object tracking:** on the KITTI 3D-object benchmark its MOTP trails single-view CNN + refinement approaches and dense stereo systems in raw precision but degrades far less under truncation and occlusion, at the cost of discovering fewer boxes (feature-based sparsity); tracked cars retain most of their trajectory, with passersby less accurate (non-rigid).
- **Timing:** ~12 fps with up to 2 simultaneous objects (seq 0003) and ~10 fps with up to 20 (seq 0020), excluding the segmentation CNN — the only compared joint SLAM + MOT system running in real time.

## Why it matters for SLAM

DynaSLAM II represents the second generation of dynamic SLAM: once removing dynamic content was solved well enough, the frontier moved to *exploiting* it. Its central empirical claim — that tracking dynamic objects is beneficial for camera tracking itself, not just for scene understanding — plus the object-centric parametrisation and the decoupling of trajectories from bounding boxes, form the template that driving-oriented and embodied-AI SLAM systems build on, alongside the contemporaneous VDO-SLAM.

## Related

- [DynaSLAM](dynaslam.md)
- [VDO-SLAM](vdo-slam.md)
- [CubeSLAM](cubeslam.md)
- [MID-Fusion](mid-fusion.md)
- [ORB-SLAM2](orb-slam2.md)
- [MonST3R](monst3r.md)
