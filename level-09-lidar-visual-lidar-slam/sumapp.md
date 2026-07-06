# SuMa++

> Chen (Bonn) 2019 · [Paper](https://www.ipb.uni-bonn.de/pdfs/chen2019iros.pdf)

**One-line summary** — SuMa++ extends SuMa with deep semantic segmentation from RangeNet++, filtering dynamic objects out of ICP registration and building semantically labeled surfel maps that are markedly more robust in dynamic urban traffic.

## Key ideas

- **Semantics on the range image**: each LiDAR sweep is projected to a range image (as in SuMa) and passed through RangeNet++, a CNN trained on SemanticKITTI, producing per-point labels such as road, building, vegetation, car, person, and bicycle.
- **Dynamic object filtering**: points belonging to moving objects corrupt ICP by pulling the pose estimate toward the motion of traffic rather than the static background. SuMa++ detects and removes dynamics by checking semantic consistency between the new scan and the already-built semantic map, so movable objects do not contaminate registration or the map.
- **Semantic ICP weighting**: within the remaining points, ICP residuals are weighted by semantic consistency — correspondences whose labels agree contribute more, softly down-weighting misclassified or boundary points instead of hard-rejecting them.
- **Semantic surfel map**: each surfel carries a semantic label (with its probability) alongside geometry, fused over multiple observations, yielding a globally consistent labeled map usable by downstream navigation and planning.
- **Geometry and semantics help each other**: the range-image pipeline makes real-time segmentation feasible, and cleaner segmentation in turn makes registration more accurate — an early demonstration of the geometry–semantics feedback loop in SLAM.

## Why it matters for SLAM

SuMa++ was one of the first LiDAR SLAM systems to use a deep segmentation network to handle dynamic environments, a problem that pure geometry struggles with when traffic is dense or slow-moving. The recipe — segment on the range image, exclude dynamic classes, weight residuals by semantic agreement — became standard practice in urban autonomous-driving SLAM, and mirrors what DynaSLAM did for visual SLAM. It also cemented the range image as the standard intermediate representation for learned LiDAR processing.

## Related

- [SuMa](suma.md)
- [Range image](range-image.md)
- [DynaSLAM](../level-03-monocular-slam/dynaslam.md)
- [FAST-LIO2](fast-lio2.md)

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
