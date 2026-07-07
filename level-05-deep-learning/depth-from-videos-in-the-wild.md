# Depth from Videos in the Wild

> Gordon 2019 · [Paper](https://arxiv.org/abs/1904.04998)

**One-line summary** — This work (ICCV 2019) pushed self-supervised depth learning to truly unconstrained video by learning the camera intrinsics along with depth, ego-motion, and object motion — enabling training on arbitrary videos with unknown cameras.

## Problem

Self-supervised depth methods in the SfM-Learner tradition learn from raw video by warping one frame into another and penalizing photometric error — but they assume the camera intrinsics are known, effectively restricting training to calibrated datasets like KITTI, and they degrade when scenes contain independently moving objects or occlusions. If the goal is learning geometry from the world's video (arbitrary cameras, arbitrary content), calibration and the static-scene assumption both have to go.

## Key ideas

- **Everything is learned jointly.** The method simultaneously learns depth, ego-motion, object motion, and camera intrinsics from monocular videos, "using only consistency across neighboring video frames as supervision signal".
- **Intrinsics as a network output.** It is, per the abstract, the first work to learn the camera intrinsic parameters — *including lens distortion* — from video in an unsupervised manner. Calibration becomes just another quantity inferred from the data, so "videos of unknown origin" become valid training data at scale.
- **Geometric occlusion handling.** Occlusions are addressed geometrically and differentiably, directly using the predicted depth maps during training to determine what becomes visible or hidden between frames — cleaning the photometric supervision where naive warping is simply wrong.
- **Object motion fields.** The method accounts for object motion relative to the scene, predicting translation for independently moving regions so that dynamic content stops corrupting the ego-motion and depth signals.
- **Randomized layer normalization.** A novel regularizer introduced in the paper, described as a powerful stabilizer for this joint training problem.

## Results & impact

- Evaluated on Cityscapes, KITTI, and EuRoC, "establishing new state of the art on depth prediction and odometry" among comparable self-supervised methods (abstract).
- Demonstrated qualitatively that depth prediction can be learned from a collection of YouTube videos — the emblematic result: geometry learned from uncalibrated, uncurated internet video.
- Broadened the self-supervised training distribution beyond driving datasets, prefiguring today's expectation that geometric models train on web-scale heterogeneous data.

## Why it matters for SLAM

This paper removed the last practical barrier to learning geometry from unlimited video: calibration. The idea of treating camera parameters as just another learnable output reappears in learned camera models (Neural Ray Surfaces) and resonates with today's calibration-free feed-forward reconstruction (DUSt3R-style models predicting geometry without given intrinsics). For SLAM practitioners, it is also a reference point for handling dynamic objects and occlusion inside photometric self-supervision — persistent failure modes of direct methods.

## Related

- [SfM-Learner](sfm-learner.md)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md)
- [Neural Ray Surfaces](neural-ray-surfaces.md)
- [MonoDepth](monodepth.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
