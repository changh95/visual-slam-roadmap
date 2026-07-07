# MonoRec

> Wimbauer 2021 · [Paper](https://arxiv.org/abs/2011.11814)

**One-line summary** — Semi-supervised dense 3D reconstruction from a single moving camera that handles dynamic environments by detecting moving objects from photometric inconsistencies in multi-view-stereo cost volumes.

## Problem

Multi-view stereo gives geometrically grounded dense depth from a single moving camera, but it rests on a static-scene assumption: moving cars and pedestrians violate the multi-view constraints and corrupt the cost volume, producing broken geometry exactly where autonomous systems care most. Single-image depth avoids the problem but throws away multi-view evidence. A second obstacle is supervision — dense depth ground truth means LiDAR, which is expensive to collect at scale. MonoRec targets both: dense reconstruction in dynamic scenes, trained without LiDAR depth values.

## Key ideas

- **Multi-view stereo backbone**: The information of multiple consecutive images from the monocular video is encoded into a cost volume, giving true multi-view geometric depth rather than single-image guesses.
- **MaskModule for dynamic objects**: Moving objects show up as photometric *inconsistencies* inside the cost volume — the same 3D hypothesis cannot explain their appearance across frames. A dedicated MaskModule predicts moving-object masks by leveraging exactly this signal, so dynamics detection falls out of the geometry rather than requiring a separate semantic detector.
- **Reconstructs static *and* moving content**: Unlike other multi-view stereo methods, the predicted masks let MonoRec produce sensible depth for moving objects too, instead of corrupted geometry or holes.
- **Semi-supervised multi-stage training**: A novel multi-stage training scheme with a semi-supervised loss formulation avoids the need for LiDAR depth values entirely.

## Results & impact

Carefully evaluated on KITTI, MonoRec achieved state-of-the-art performance compared to both multi-view and single-view methods. With the model trained on KITTI, it further generalized to the Oxford RobotCar dataset and to the more challenging handheld TUM-Mono sequences — evidence the cost-volume formulation transfers across platforms and motion patterns. Its design influenced later dense mapping work from the same TUM group, notably TANDEM.

## Why it matters for SLAM

Dense monocular reconstruction in the real world must cope with cars and pedestrians; MonoRec showed that the cost volume itself contains the evidence needed to find them, elegantly unifying dynamic-object detection with depth estimation. Coming from the TUM direct-SLAM group, it slots naturally on top of a visual odometry system (poses in, dense maps out) and influenced later real-time dense mapping work such as TANDEM.

## Related

- [TANDEM](tandem.md) — real-time dense tracking and mapping from the same group
- [D3VO](../level-03-monocular-slam/d3vo.md) — deep VO providing the pose/depth lineage
- [DeepV2D](deepv2d.md) — alternating depth and pose estimation
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the training philosophy background
- [DSO](../level-03-monocular-slam/dso.md) — the direct odometry lineage supplying poses to systems like MonoRec

[Back to Level 5](../README.md#level-5-applying-deep-learning)
