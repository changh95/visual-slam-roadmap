# RAFT-3D

> Teed 2021 · [Paper](https://arxiv.org/abs/2012.00726)

**One-line summary** — Extends RAFT from 2D optical flow to 3D scene flow by iteratively refining a dense field of pixelwise $SE(3)$ rigid-body motions, with learned rigid-motion embeddings and a differentiable Dense-SE3 optimization layer enforcing geometric consistency.

## Problem

Scene flow — given a pair of stereo or RGB-D video frames, estimate pixelwise 3D motion — is what a robot needs to separate camera ego-motion from independently moving objects. Real scenes are largely collections of rigidly moving objects, so their 3D motion fields are piecewise *constant* in $SE(3)$, but earlier methods either predict unconstrained per-point translations (e.g. FlowNet3D) or exploit rigidity through object detection/instance segmentation networks — which need instance supervision, cannot handle unknown objects, and insert non-differentiable components into the pipeline. RAFT-3D asks how to build the rigidity prior into a RAFT-style dense architecture without any object instance labels.

## Method & architecture

Input: two RGB-D pairs $(I_1, Z_1)$, $(I_2, Z_2)$ (depth from an off-the-shelf stereo network, GA-Net, for stereo input); output: a dense transformation field $\mathbf{T} \in SE(3)^{H \times W}$. Using an augmented pinhole projection $\pi$ that maps a 3D point to pixel coordinates plus inverse depth $d = 1/Z$, the field induces correspondences

$$\mathbf{x}_i' = \pi(\mathbf{T}_i \cdot \pi^{-1}(\mathbf{x}_i))$$

whose first two components of $\mathbf{x}_i' - \mathbf{x}_i$ are optical flow and whose third is the inverse-depth change.

- **RAFT machinery**: a shared feature encoder (128-dim features at 1/8 resolution) feeds a 4D all-pairs correlation volume $\mathbf{C}_{ijkh} = \langle f_\theta(I_1)_{ij}, f_\theta(I_2)_{kh} \rangle$, pooled into a 4-level pyramid and indexed by bilinear sampling around the current correspondences. The context encoder is upgraded to a pretrained ResNet50 — grouping pixels into rigid objects needs more semantics and receptive field than 2D flow.
- **Update operator**: a ConvGRU consumes the induced flow field $\mathbf{x}' - \mathbf{x}$, the twist field $\log_{SE3}(\mathbf{T})$, a depth residual (backprojected inverse depth vs frame-2's depth map at the correspondence), and correlation features. From its hidden state it predicts rigid-motion embeddings $\mathbf{V}$, revision maps $\mathbf{r}_x, \mathbf{r}_y, \mathbf{r}_z$ (corrections to the induced flow and to frame-2 inverse depth), and confidence maps $\mathbf{w} \in [0,1]$.
- **Dense-SE3 layer**: embeddings softly group pixels into rigid objects via the affinity

$$a_{ij} = 2\,\sigma(-\lVert \mathbf{v}_i - \mathbf{v}_j \rVert^2) \in [0, 1]$$

  and each pixel's transform is updated by one Gauss-Newton step on the weighted reprojection objective

$$E(\delta) = \sum_{i \in \Omega} \sum_{j \in \mathcal{N}_i} a_{ij} \left\lVert \mathbf{r}_j + \pi(\mathbf{T}_j \mathbf{X}_j) - \pi(e^{\delta_i} \mathbf{T}_i \mathbf{X}_j) \right\rVert^2_{w_j}$$

  i.e. each pixel seeks a motion that explains its neighbors — but only pairs with similar embeddings contribute. Because every term touches a single $\mathbf{T}_i$, the enormous system (200M equations at FlyingThings3D resolution) decomposes into $H \times W$ independent 6-variable problems built in place in CUDA; 12 GRU iterations yield 12 Gauss-Newton updates.
- **Supporting layers**: a differentiable bi-Laplacian optimization layer (sparse Cholesky) smooths embeddings within motion boundaries using GRU-predicted edge weights; SE3 upsampling maps $\mathbf{T}$ to the Lie algebra, convex-upsamples there, and maps back with the exponential.
- **Supervision**: only the induced flow / inverse-depth change is supervised, $\mathcal{L} = \sum_k \gamma^{N-k} \lVert \mathbf{f}_{est}^k - \mathbf{f}_{gt} \rVert_1$ with $\gamma = 0.9$ — the rigid-motion embeddings are learned *implicitly* by differentiating through Dense-SE3 (backpropagation in the tangent space via the LieTorch library). No box or mask supervision anywhere.

## Results

- **FlyingThings3D** (two-view evaluation on the FlowNet3D split): improved the best published 3D accuracy ($\delta < 0.05$) from 34.3% to 83.7%. It also outperforms by a large margin RAFT baselines extended to 3D (backprojected 2D flow, flow + depth change, direct 3D flow prediction), and — because it decomposes the scene into rigid components — can estimate motion even for occluded regions. Rigid segmentations emerge with no supervision on the embeddings.
- **KITTI scene flow leaderboard**: error 5.77, outperforming the best published method DRISP (6.31), which combines PSMNet, PWC-Net, and a Mask-RCNN pretrained on Cityscapes with instance supervision — RAFT-3D trains only on FlyingThings3D + KITTI with no instance labels.
- **Ablations**: accuracy improves up to ~16 update iterations; a Dense-SE3 neighborhood radius of 256 beats both smaller radii and the full image; inverse-depth revisions improve 3D metrics; the bi-Laplacian layer lifts 1px accuracy from 85.8 to 86.3 and 3D accuracy from 87.1 to 87.8.
- 45M trainable parameters (40M in the ResNet50 context backbone); inference on 540x960 images takes 1.6GB of GPU memory (GTX 1080Ti, 16 updates).

## Why it matters for SLAM

Dynamic environments are a core SLAM failure mode: moving objects violate the static-world assumption behind ego-motion estimation. RAFT-3D's per-pixel rigid-motion fields provide exactly the representation needed to segment dynamic objects and estimate their motion separately from the camera — the same problem that dynamic SLAM systems (VDO-SLAM, DynaSLAM II) attack with detector-based pipelines, solved here without instance supervision. Its combination of learned iterative refinement with an embedded differentiable geometric optimization layer sits on the direct lineage from RAFT to the same authors' DROID-SLAM.

## Related

- [RAFT](raft.md) — the 2D optical flow foundation
- [FlowNet3D](flownet3d.md) — earlier point-cloud scene flow without rigidity priors
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — same authors; dense BA layer in a full SLAM system
- [VDO-SLAM](../level-03-monocular-slam/vdo-slam.md) — dynamic SLAM that tracks object motions
