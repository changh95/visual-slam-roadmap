# Fusion++

> McCormac & Clark 2018 · [Paper](https://arxiv.org/abs/1808.08378)

**One-line summary** — An object-level volumetric SLAM system that uses Mask-RCNN instance segmentation to create per-object TSDF reconstructions of arbitrary objects — no prior models required — with objects as landmark nodes in a 6-DoF pose graph.

## Problem

SLAM++ demonstrated object-level mapping but required a pre-built database of known 3D models, limiting it to controlled environments where every mappable object had been scanned in advance. Dense whole-scene maps (surfels, global TSDFs), meanwhile, are memory-hungry and treat objects and clutter identically. What was missing was a system that could *discover* arbitrary objects on the fly, reconstruct each one compactly, and use those persistent objects as the map itself — for tracking, relocalization, and loop closure.

## Method & architecture

**Pipeline.** From RGB-D input, a coarse instance-agnostic background TSDF ($256^3$, 2 cm voxels, reset as the camera moves) supports local frame-to-model tracking and occlusion handling. In a parallel thread, Mask R-CNN (ResNet-101, fine-tuned on NYUv2; ~250 ms/pass) produces instance masks, which are filtered (top 100 detections, $\max p(l_i \mid I_k) > 0.5$, mask area $> 50^2$ px, away from image borders) and associated to existing map objects by raycast-mask overlap ($a_{\mathrm{detect}} > 0.2$). Unmatched detections spawn new object TSDFs; matched ones are fused into existing objects. The persistent map is *only* the set of object TSDFs in a pose graph.

**Per-object TSDFs.** Masked pixels are backprojected with ${}_{W}\mathbf{p} = \tilde{\mathbf{T}}_{WC}^{k} \mathbf{K}^{-1} D_k(\mathbf{u})\, \mathbf{u}$; the 10th/90th percentile points define the volume centre and cubic size $s_o$ (padding factor $m = 1.5$, max 3 m). Initial resolution is $r_o = 64$ per axis (growable to 128), so voxel size $v_o = s_o / r_o$ adapts to object size — small objects get fine detail, large ones stay cheap. Depth within truncation $\mu = 4 v_o$ is fused by weighted averaging over the *whole* volume; which voxels belong to the object is learned separately by fusing mask detections as binomial trials with a Beta prior — foreground/not-foreground counts $F^o(\mathbf{v}), N^o(\mathbf{v})$ give

$$E[p^o(\mathbf{v})] = \frac{F^o(\mathbf{v})}{F^o(\mathbf{v}) + N^o(\mathbf{v})}$$

and raycasting renders the surface only where $E[p^o(\mathbf{v})] > 0.5$. Each object also keeps averaged class probabilities $p(l_o \mid I_{1..k}) = \frac{1}{k}\sum_i p(l_o \mid I_i)$ (averaging beats multiplicative Bayes, which becomes overconfident) and an *existence* probability with Beta counts $(e_o, d_o)$; objects with $E[p(o)] < 0.1$ are deleted.

**Tracking.** The background TSDF plus all object volumes are raycast into a layered reference frame; the live depth is aligned by projective point-to-plane ICP,

$$r_{\mathrm{icp}}(\tilde{\mathbf{T}}_{WC_l}, \mathbf{u}_l) = N_r(\mathbf{u}_r) \cdot \big( V_r(\mathbf{u}_r) - \tilde{\mathbf{T}}_{WC_l} V_l(\mathbf{u}_l) \big)$$

minimized by Gauss-Newton on a 3-level pyramid (5 iterations/level), with per-instance error partitions. Tracking is declared lost when ICP RMSE > 0.05 m (or too few valid pixels), triggering relocalization: BRISK features with depth, 3D-3D RANSAC per object then jointly over the scene (≥50 inliers within 5 cm).

**Object-level pose graph.** Nodes are camera poses $\mathbf{T}_{WC}$ and object poses $\mathbf{T}_{WO}$; edges are "virtual" relative pose measurements from the partitioned ICP terms, e.g. $\mathbf{e}_{\mathrm{oc}} = \log\big( (\tilde{\mathbf{T}}^{\prime o}_{OC_k})^{-1} \mathbf{T}^{o}_{OW} \mathbf{T}_{WC_k} \big)$, with information matrix $\mathbf{H}_{\mathrm{pg}} = \mathbf{J}^{\top}_{\mathrm{pg}} ( \mathbf{J}^{o\top}_{\mathrm{icp}} \mathbf{J}^{o}_{\mathrm{icp}} ) \mathbf{J}_{\mathrm{pg}}$ where $\mathbf{J}_{\mathrm{pg}}$ is the adjoint of $\mathbf{T}_{WC_k}$ converting between ICP and pose-graph perturbation conventions. The robust (Huber) graph is solved in g2o with Levenberg-Marquardt; loop closures adjust relative object poses but never warp inside a TSDF, so reconstructions stay crisp.

## Results

On a 3,685-frame office loop designed to stress poorly constrained ICP, the system relocalizes and corrects the pose graph after accumulated drift, reusing 105 reconstructed object instances across repeated loops. On the TUM RGB-D benchmark, Fusion++ improves ATE RMSE over its coarse-TSDF-odometry baseline on 5 of 6 sequences: fr1_desk 0.049 vs 0.066 m, fr1_room 0.235 vs 0.305, fr2_desk 0.114 vs 0.342, fr2_xyz 0.020 vs 0.022, fr3_long_office 0.108 vs 0.281 (fr1_desk2 slightly worse, 0.153 vs 0.146); the paper notes it does not reach ElasticFusion/ORB-SLAM2 accuracy, prioritizing the usable object map. Object reconstruction quality is compared qualitatively against ground-truth YCB models on the YCB video dataset. Memory is ~4 MB/object (377 MB for 105 objects vs a $900^3$ single volume for the same budget), and the unoptimized Python/C++/CUDA system runs at 4–8 Hz excluding relocalization (tracking 35 ms, raycast 25 ms + 0.5 ms/visible object, Mask R-CNN 260 ms in-thread, relocalization 780 ms).

## Why it matters for SLAM

Fusion++ removed SLAM++'s biggest limitation — the pre-built CAD database — by showing that off-the-shelf instance segmentation CNNs can serve as the discovery mechanism for object-level SLAM in arbitrary indoor scenes, and that a pose graph of rigid per-object TSDFs gives loop-closure consistency without intra-model deformation. It sits at the junction of the dense-fusion lineage (KinectFusion-style TSDFs) and the semantic lineage (SemanticFusion), and it directly influenced MoreFusion, NodeSLAM, and DSP-SLAM, which progressively replace raw per-object TSDFs with learned pose and shape priors.

## Related

- [SLAM++](slampp.md)
- [SemanticFusion](semanticfusion.md)
- [MoreFusion](morefusion.md)
- [DSP-SLAM](dsp-slam.md)
- [NodeSLAM](../level-05-deep-learning/nodeslam.md)
- [PointFusion / DenseFusion](pointfusion-densefusion.md)
