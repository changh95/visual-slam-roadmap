# MID-Fusion

> Xu 2019 · [Paper](https://arxiv.org/abs/1812.07976)

**One-line summary** — An octree-based, object-level, multi-instance dynamic RGB-D SLAM system that builds a separate volumetric (TSDF) model for each object while staying robust to scene motion.

## Problem

Static-world SLAM treats moving objects as outliers, so in dynamic environments it either loses tracking or corrupts its map — and even when it survives, the map contains no per-object information a robot could act on. MaskFusion and Co-Fusion had shown surfel-based object-level dynamic SLAM, but surfel clouds cannot directly represent free space or surface connectivity, which robotic tasks need. MID-Fusion targets a *volumetric* object-level dynamic SLAM: robust camera tracking in dynamic scenes while continuously estimating geometric, semantic, and motion properties for arbitrary objects.

## Method & architecture

The pipeline has four parts — segmentation, tracking, fusion, raycasting. Each detected object $n \in \{0..N\}$ (0 = background) lives in its own coordinate frame with an octree-based TSDF volume (built on Supereight) whose voxels store SDF, intensity, a foreground probability and weights, plus a COCO class distribution, a pose $T_{WO_n}$, and a moving/static flag.

**Camera tracking.** The live pose $T_{WC_L}$ minimises a joint dense residual over valid pixels (excluding humans):

$$E_{\mathrm{track}}(T_{WC_L}) = \tfrac{1}{2}\Big(\sum_{\mathbf{u}_L \in M_L} w_{\mathrm{g}}\,\rho(e_{\mathrm{g}}) + \sum_{\mathbf{u}_R \in M_R} w_{\mathrm{p}}\,\rho(e_{\mathrm{p}})\Big),$$

where $\rho$ is the Cauchy loss, $e_{\mathrm{g}}$ is the point-to-plane ICP residual between the live vertex map and the model-rendered vertex/normal maps, and $e_{\mathrm{p}}$ is a photometric residual evaluated against *rendered* (de-noised) model depth. Residuals are weighted by measurement uncertainty: constant for RGB, and for ICP $w_{\mathrm{g}} = 1/(\mathbf{n}^{r\top}\mathbf{n}^{r}\,\sigma_D^{\top}\sigma_D)$ with a sensor model $\sigma_D = \big(\tfrac{D}{f}\sigma_{xy},\ \tfrac{D}{f}\sigma_{xy},\ \tfrac{D^2}{fb}\sigma_z\big)$ ($f$ focal length, $b$ baseline). Gauss–Newton, 3-level coarse-to-fine. Tracking runs twice: first against all model vertices minus people, then — after raycasting reveals visible objects and a residual test flags movers (object considered moving if its inlier ratio drops below 0.9 inside its rendered mask) — refined against only the static parts.

**Object pose estimation.** Moving objects are tracked with the same weighted ICP + RGB cost but re-parametrised *in object coordinates*, estimating $T_{C_LO_L}$ directly instead of a "virtual camera". The rotation Jacobian is then proportional to $C_{C_LO_L}^{-1}(\mathbf{v}_L - \mathbf{r}_{C_LO_L})$, which is small because the object frame is centred on the object — a smaller lever arm, hence more stable convergence under large object rotations.

**Segmentation.** Mask R-CNN masks are refined with geometric edges, associated to existing models by IoU of rendered masks (accept if > 0.5; no class-agreement requirement, since labels are refined probabilistically in the map), then filtered by motion residuals — pixels with high joint ICP+RGB residual are treated as outliers. A foreground probability (1 in the mask, 0 in a dilated background, 0.5 for objects Mask R-CNN missed) guards fusion against bad masks.

**Fusion.** Depth, colour, foreground probability and the semantic distribution are integrated into each object's octree TSDF (semantics by averaging rather than Bayesian update, which over-commits with Mask R-CNN predictions). New objects are initialised with a volume 3× their back-projected point-cloud size at ~1 mm voxel resolution — affordable only because unused octree voxels are never allocated.

## Results

- TUM RGB-D, ATE RMSE (cm): f3s_static **1.0**, f3s_xyz 6.2, f3s_halfsphere **3.1**, f3w_static 2.3, f3w_xyz **6.8**, f3w_halfsphere **3.8** — best among the compared dense-tracking methods in almost all sequences (on f3w_halfsphere: VO-SF 73.9, StaticFusion 39.1, Co-Fusion 80.3, MaskFusion 10.6). Feature-based DynaSLAM remains lower still (e.g. 2.5 on f3w_halfsphere), which the authors note as an argument for combining sparse tracking with dense object mapping.
- Synthetic photo-realistic scenes: lower object reconstruction error than Co-Fusion; replacing its segmentation with ground-truth masks changes results negligibly, while the virtual-camera tracking ablation degrades markedly under large object rotations — validating the object-centric parametrisation.
- Runtime: 2–3 Hz on CPU (i7-7700, 32 GB) excluding Mask R-CNN; ~400 ms per frame with over 25 objects instantiated, ~10 ms to initialise a new object. First object-level dynamic volumetric map from a single RGB-D camera.

## Why it matters for SLAM

Together with MaskFusion, MID-Fusion defined object-level dynamic SLAM: maps composed of individually tracked, reconstructed object instances. The volumetric choice matters — a watertight TSDF per object supports grasp planning, collision checking, and free-space reasoning in a way surfel clouds do not — and its object-centric tracking parametrisation and uncertainty-weighted residuals became standard tricks. It marks the point where dynamic SLAM stopped being only about *surviving* motion and started being about *modelling* it.

## Related

- [MaskFusion](maskfusion.md)
- [VDO-SLAM](vdo-slam.md)
- [DynaSLAM II](dynaslam-ii.md)
- [Fusion++](../level-04-rgbd-slam/fusionpp.md)
- [TSDF vs Surfel maps](../level-04-rgbd-slam/tsdf-vs-surfel-maps.md)
