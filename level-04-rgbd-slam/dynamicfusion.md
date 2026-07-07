# DynamicFusion

> Newcombe 2015 · [Paper](https://ieeexplore.ieee.org/document/7298631)

**One-line summary** — The first real-time dense SLAM system for non-rigidly deforming scenes: it estimates a dense volumetric 6D warp field that transforms a fixed canonical TSDF model into each live frame, so KinectFusion-style fusion works while everything moves.

## Problem

The most basic assumption behind KinectFusion and all traditional dense SLAM is that the observed scene is largely *static* — any deforming subject (people, hands, clothing, pets) breaks tracking and corrupts the model. Prior non-rigid capture either required a pre-scanned template held static during acquisition, or ran offline, three to four orders of magnitude slower than real time. The core question of the paper: how can KinectFusion be generalised to reconstruct and track dynamic scenes in real time, template-free, from a single depth camera?

## Method & architecture

DynamicFusion decomposes the scene into a latent geometric surface reconstructed in a rigid canonical space $\mathsf{S}\subseteq\mathbb{R}^3$ (a TSDF $\mathcal{V}$), plus a per-frame volumetric warp field that transforms it into the live frame. Each new depth map triggers three steps: (1) estimate the warp-field state, (2) fuse the live depth into the canonical TSDF through the warp, (3) extend the warp-field structure to cover newly observed geometry.

- **Dense 6D warp field via sparse nodes + dual-quaternion blending**: a dense per-point transformation $\mathcal{W}: \mathsf{S} \mapsto \mathbf{SE}(3)$ (a dense $256^3$ field would need ~100 million parameters per frame) is interpolated from $n$ deformation nodes $\mathcal{N}^t_{\mathrm{warp}} = \{\mathbf{dg}_v, \mathbf{dg}_w, \mathbf{dg}_{se3}\}_t$ — position, radial weight, and 6-DoF transform. A canonical point $x_c$ is warped by dual-quaternion blending of its k-nearest nodes,

$$\mathcal{W}_t(x_c) = \mathbf{T}_{lw}\, SE3\big(\mathbf{DQB}(x_c)\big), \qquad \mathbf{DQB}(x_c) = \frac{\sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc}}{\big\lVert \sum_{k\in N(x_c)} \mathbf{w}_k(x_c)\,\hat{\mathbf{q}}_{kc} \big\rVert},$$

  with unit dual quaternions $\hat{\mathbf{q}}_{kc}\in\mathbb{R}^8$, Gaussian influence weights $\mathbf{w}_i(x_c) = \exp\big(-\lVert \mathbf{dg}^i_v - x_c \rVert^2 / (2 (\mathbf{dg}^i_w)^2)\big)$, and the common rigid (camera) motion factored out as $\mathbf{T}_{lw}$. DQB keeps the blended transform a valid rigid motion.
- **Non-rigid projective TSDF fusion**: each voxel centre $x_c$ is warped into the live frame, and the projective signed distance is computed there: $\mathbf{psdf}(x_c) = \big[\mathbf{K}^{-1} D_t(u_c) [u_c^\top, 1]^\top\big]_z - [x_t]_z$, followed by the standard truncated weighted-average TSDF update. Fusion weights scale down with a voxel's average distance to its k-nearest nodes, encoding warp uncertainty. Because updates are computed along lines of sight in the camera frame, the optimality properties of rigid TSDF fusion carry over to the non-rigid case.
- **Warp-field estimation**: given depth $D_t$ and the current reconstruction $\mathcal{V}$, the node transforms minimize

$$E(\mathcal{W}_t, \mathcal{V}, D_t, \mathcal{E}) = \mathbf{Data}(\mathcal{W}_t, \mathcal{V}, D_t) + \lambda\,\mathbf{Reg}(\mathcal{W}_t, \mathcal{E}).$$

  The data term renders the warped zero-level-set mesh into the live frame for data association and sums a robust Tukey-penalised point-to-plane error over predicted pixels, $\mathbf{Data} \equiv \sum_{u\in\Omega} \psi_{\mathrm{data}}\big( \hat{\mathbf{n}}_u^\top (\hat{\mathbf{v}}_u - \mathbf{vl}_{\tilde{u}}) \big)$. The regularizer is an as-rigid-as-possible term with a discontinuity-preserving Huber penalty over edges $\mathcal{E}$ of a deformation graph,

$$\mathbf{Reg}(\mathcal{W}, \mathcal{E}) \equiv \sum_{i=0}^{n} \sum_{j \in \mathcal{E}(i)} \alpha_{ij}\, \psi_{\mathrm{reg}}\big( \mathbf{T}_{ic}\,\mathbf{dg}^j_v - \mathbf{T}_{jc}\,\mathbf{dg}^j_v \big), \qquad \alpha_{ij} = \max(\mathbf{dg}^i_w, \mathbf{dg}^j_w),$$

  built over a *hierarchical* deformation tree so unobserved regions deform piece-wise smoothly. Optimization is Gauss-Newton with per-node twists $\xi_i \in se(3)$: dense rigid ICP first resolves $\mathbf{T}_{lw}$, then 2-3 non-rigid iterations solve the linearised system by sparse block-Cholesky of its arrow-head Hessian, entirely on the GPU with a precomputed k-nearest-node volume.
- **Extending the warp field**: after fusion, surface vertices unsupported by the current nodes ($\min_k \lVert \mathbf{dg}^k_v - v_c \rVert / \mathbf{dg}^k_w \ge 1$) spawn new nodes at least $\epsilon$ apart (decimation density $\epsilon = 25$ mm by default), initialised by DQB from the current warp; an $L{=}4$-level regularisation hierarchy (radius growing by $\beta{=}4$ per level) is then rebuilt. Parameters used live: $\lambda = 200$, Tukey width 0.01, Huber width 0.0001.

## Results

The evaluation is qualitative (no benchmark tables): results were captured live from the real-time system on commodity hardware with a single depth camera — a moving person filmed by a moving camera, "drinking from a cup" over 60 s (complete arm+cup model emerges, including surfaces invisible in the first frame), and "crossing fingers" full-body sequences where the model stays consistent through hand clasping. The initially noisy, incomplete model is progressively denoised and completed while both subject and camera move, with loop closures occurring during capture. Stated limitations: scenes that move quickly from closed to open topology (a reconstruction started with closed hands cannot open them), large inter-frame motion, and growing occluded regions as scene complexity increases. Published at CVPR 2015, where it received the Best Paper award.

## Why it matters for SLAM

DynamicFusion removed the static-scene assumption pervasive across real-time 3D reconstruction and SLAM, generalising volumetric TSDF fusion to the non-rigid case and showing that a dense 6D warp field can be estimated at frame rate. Its canonical-volume + embedded-deformation-graph recipe became the template for non-rigid fusion (VolumeDeform, KillingFusion, SurfelWarp) and informs how modern dynamic-scene SLAM systems separate camera motion from scene motion.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [MID-Fusion](../level-03-monocular-slam/mid-fusion.md)
