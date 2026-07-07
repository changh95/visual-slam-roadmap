# DynamicFusion

> Newcombe 2015 · [Paper](https://ieeexplore.ieee.org/document/7298631)

**One-line summary** — Extended KinectFusion to non-rigid, deformable scenes by estimating a dense volumetric 6D warp field that maps a canonical TSDF model to each live frame in real time.

## Problem

KinectFusion and its successors assume a static scene — any moving object causes tracking failure and reconstruction artifacts. Real-world environments contain deformable subjects (people, hands, clothing, animals), and reconstructing them requires jointly estimating camera motion, scene deformation, and the accumulating 3D model. Before DynamicFusion, that joint estimation was far too expensive for real-time operation, so non-rigid capture was confined to offline pipelines or template-based systems that needed a pre-scanned model of the subject.

## Key ideas

- **Canonical TSDF model**: a single reference volume stores the geometry in an undeformed "canonical" space. All observations are fused into this canonical space after undoing the scene's deformation, so a clean, increasingly detailed model emerges even while the subject moves.
- **6D motion (warp) field**: deformation is represented sparsely by a set of deformation nodes $\{(\mathbf{dg}_k, \mathbf{R}_k, \mathbf{t}_k, r_k)\}$, each carrying a position, a full 6-DoF rigid transform, and an influence radius. Any canonical point $\mathbf{x}$ is warped to the live frame by dual quaternion blending (DQB) of nearby node transforms, with Gaussian influence weights
  $$w_k(\mathbf{x}) = \exp\!\left(-\frac{\|\mathbf{x} - \mathbf{dg}_k\|^2}{2r_k^2}\right).$$
  Blending unit dual quaternions (rather than matrices) keeps the interpolated transform a valid rigid motion.
- **Joint data + regularization optimization**: each frame, the warp field is estimated by minimizing
  $$E = E_{\text{data}} + \lambda_{\text{reg}}\,E_{\text{reg}},$$
  where the data term is a dense point-to-plane alignment of the warped model against the live depth,
  $$E_{\text{data}} = \sum_{\mathbf{u}} \left\|\mathbf{n}_{\mathbf{u}}^\top\!\left(\mathcal{W}(\hat{\mathbf{v}}_{\mathbf{u}}) - \mathbf{v}_{\mathbf{u}}^{\text{live}}\right)\right\|^2,$$
  and the regularizer is an as-rigid-as-possible term over deformation-graph edges,
  $$E_{\text{reg}} = \sum_{(k,l)\in\mathcal{E}} \left\|\mathbf{R}_k(\mathbf{dg}_l - \mathbf{dg}_k) + \mathbf{dg}_k + \mathbf{t}_k - (\mathbf{dg}_l + \mathbf{t}_l)\right\|^2,$$
  which keeps neighboring nodes moving consistently and lets unobserved regions be plausibly interpolated.
- **Deformable scene fusion**: after solving the warp, the live depth is warped back into canonical space and fused with the standard TSDF weighted running average — deformation estimation and reconstruction reinforce each other, exactly as tracking and mapping do in rigid fusion.
- **Adaptive warp-field growth**: as new surface area enters the canonical model, new deformation nodes are inserted to cover it, so the motion representation scales with the reconstructed geometry rather than the volume size.
- **GPU implementation**: like KinectFusion, the whole pipeline (warping, dense alignment, TSDF fusion) is implemented on the GPU, which is what makes per-frame non-rigid optimization feasible.

## Results & impact

DynamicFusion demonstrated real-time (~30 Hz) non-rigid reconstruction of human hands, faces, upper bodies, and deforming objects from a single consumer depth camera, with the canonical model accumulating detail over time despite continuous deformation and handling moderate topology changes (e.g. separating fingers). It received the CVPR 2015 Best Paper award. Its canonical-volume + embedded-deformation-graph paradigm became the standard recipe for follow-up non-rigid fusion systems such as VolumeDeform, KillingFusion, and SurfelWarp, and enabled applications in performance capture, telepresence, and AR with deformable objects.

## Why it matters for SLAM

DynamicFusion broke the static-scene assumption that underpinned all prior dense fusion systems, showing that per-point rigid motion fields can be estimated fast enough for real-time SLAM-style pipelines. Its canonical-model + embedded-deformation-graph paradigm became the template for non-rigid fusion (VolumeDeform, KillingFusion, SurfelWarp) and informs how modern dynamic-scene SLAM systems separate camera motion from object motion.

## Related

- [KinectFusion](kinectfusion.md)
- [ElasticFusion](elasticfusion.md)
- [MaskFusion](../level-03-monocular-slam/maskfusion.md)
- [MID-Fusion](../level-03-monocular-slam/mid-fusion.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
