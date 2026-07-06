# MonoRec

> Wimbauer 2021 · [Paper](https://arxiv.org/abs/2011.11814)

**One-line summary** — Semi-supervised dense 3D reconstruction from a single moving camera that handles dynamic environments by detecting moving objects from photometric inconsistencies in multi-view-stereo cost volumes.

## Key ideas

- **Multi-view stereo backbone**: Encodes several consecutive frames of a monocular video into a cost volume, getting true multi-view geometric depth rather than single-image guesses.
- **MaskModule for dynamic objects**: Moving objects violate the static-scene assumption and show up as photometric inconsistencies in the cost volume; a dedicated module predicts moving-object masks from exactly this signal.
- **Reconstructs static *and* moving content**: Unlike standard MVS, the predicted masks let MonoRec produce sensible depth for moving objects too, instead of corrupted geometry.
- **Semi-supervised multi-stage training**: A training scheme with a semi-supervised loss formulation that does not require LiDAR depth ground truth.
- Achieved state-of-the-art results on KITTI against both multi-view and single-view methods, and transferred to Oxford RobotCar and handheld TUM-Mono sequences.

## Why it matters for SLAM

Dense monocular reconstruction in the real world must cope with cars and pedestrians; MonoRec showed that the cost volume itself contains the evidence needed to find them, elegantly unifying dynamic-object detection with depth estimation. Coming from the TUM direct-SLAM group, it slots naturally on top of a visual odometry system (poses in, dense maps out) and influenced later real-time dense mapping work such as TANDEM.

## Related

- [TANDEM](tandem.md) — real-time dense tracking and mapping from the same group
- [D3VO](../level-03-monocular-slam/d3vo.md) — deep VO providing the pose/depth lineage
- [DeepV2D](deepv2d.md) — alternating depth and pose estimation
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the training philosophy background

[Back to Level 5](../README.md#level-5-applying-deep-learning)
