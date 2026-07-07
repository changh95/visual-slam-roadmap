# SuMa++

> Chen (Bonn) 2019 · [Paper](https://www.ipb.uni-bonn.de/pdfs/chen2019iros.pdf)

**One-line summary** — SuMa++ extends SuMa with deep semantic segmentation from RangeNet++, filtering dynamic objects out of ICP registration and building semantically labeled surfel maps that are markedly more robust in dynamic urban traffic.

## Problem

SuMa — like most LiDAR SLAM systems — assumes a static world: every scan point contributes equally to ICP registration. In urban driving a significant fraction of the scene is dynamic (cars, cyclists, pedestrians), and including those points corrupts registration, pulling the estimated pose toward the motion of the most numerous moving objects rather than the static background. Purely geometric dynamic-point rejection (outlier detection after registration, temporal motion segmentation) fails exactly when it is needed most: when dynamic objects are numerous (heavy traffic) or move slowly enough to be indistinguishable from static structure. Knowing *what* each point is — semantics — offers a more direct solution.

## Key ideas

- **Semantics on the range image**: each LiDAR sweep is projected to a range image (as in SuMa) and passed through RangeNet++, an encoder-decoder CNN trained on SemanticKITTI, producing per-point labels such as road, building, vegetation (static) and car, person, bicycle (movable).
- **Dynamic object filtering**: points belonging to dynamic classes are removed from registration, and residual dynamics are caught by checking semantic consistency between the new scan and the already-built semantic map — so movable objects contaminate neither the pose estimate nor the map:

  $$\mathcal{P}_{\text{ICP}} = \{\,p_k \mid \text{label}(p_k) \notin \mathcal{C}_{\text{dynamic}}\,\}$$

- **Semantic ICP weighting**: within the remaining points, ICP residuals are weighted by semantic consistency — a correspondence whose scan label agrees with the map surfel's label gets weight $w_k^{\text{sem}} > 1$, softly down-weighting misclassified or boundary points instead of hard-rejecting them:

  $$\mathbf{T}^* = \arg\min_{\mathbf{T}} \sum_k w_k^{\text{sem}} \left(\mathbf{n}_k^\top(\mathbf{T}\mathbf{p}_k - \hat{\mathbf{p}}_k)\right)^2$$

- **Semantic surfel map**: each surfel carries a semantic label distribution alongside its geometry, fused over multiple observations with a Bayesian update, yielding a globally consistent labeled map usable by downstream navigation and planning.
- **Semantics-aware loop closure**: loop candidates are additionally filtered by semantic consistency — two frames are only considered a plausible loop if their semantic label histograms are sufficiently similar.
- **Geometry and semantics help each other**: the range-image pipeline makes real-time segmentation feasible, and cleaner segmentation in turn makes registration more accurate — an early demonstration of the geometry–semantics feedback loop in SLAM.

## Results & impact

- On KITTI odometry sequences 00–10, SuMa++ reduces mean relative translation error from $1.01\%$ (SuMa) to $0.83\%$, with the largest gains on traffic-heavy sequences (seq. 01: $2.17\% \to 1.49\%$; seq. 07: $0.57\% \to 0.43\%$).
- RangeNet++ segmentation runs at 11.4 Hz on a Titan XP GPU, adding only modest overhead to the SuMa pipeline; the resulting semantic map reaches 52.8% mIoU on SemanticKITTI — competitive with offline methods.
- It was one of the first LiDAR SLAM systems to use a deep segmentation network to filter dynamics from registration — a recipe that became standard practice in urban autonomous-driving SLAM.
- The semantic surfel map directly supports downstream tasks (planning on drivable surfaces, object-aware navigation) without extra processing.

## Why it matters for SLAM

SuMa++ was one of the first LiDAR SLAM systems to use a deep segmentation network to handle dynamic environments, a problem that pure geometry struggles with when traffic is dense or slow-moving. The recipe — segment on the range image, exclude dynamic classes, weight residuals by semantic agreement — became standard practice in urban autonomous-driving SLAM, and mirrors what DynaSLAM did for visual SLAM. It also cemented the range image as the standard intermediate representation for learned LiDAR processing.

## Related

- [SuMa](suma.md)
- [Range image](range-image.md)
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md)
- [SemanticFusion](../level-04-rgbd-slam/semanticfusion.md)
- [FAST-LIO2](fast-lio2.md)

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
