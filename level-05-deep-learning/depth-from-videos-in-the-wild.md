# Depth from Videos in the Wild

> Gordon 2019 · [Paper](https://arxiv.org/abs/1904.04998)

**One-line summary** — This work (ICCV 2019) pushed self-supervised depth learning to truly unconstrained video by learning the camera intrinsics along with depth, ego-motion, and object motion — enabling training on arbitrary videos with unknown cameras.

## Key ideas

- Earlier self-supervised methods (SfM-Learner and descendants) require known camera intrinsics, effectively restricting training to calibrated datasets like KITTI; here the network **predicts the intrinsics (focal lengths, distortion) from the video itself**, removing that requirement.
- Depth, ego-motion, and per-object motion are estimated jointly: moving objects are handled by predicting translation fields for independently moving regions, so dynamic scenes no longer corrupt the photometric training signal.
- Occlusion-aware photometric losses account for geometry becoming visible/invisible between frames, improving supervision quality.
- The upshot: training data can be "videos in the wild" — e.g., ordinary internet videos shot with unknown, diverse cameras — vastly broadening the available data distribution.

## Why it matters for SLAM

This paper removed the last practical barrier to learning geometry from unlimited video: calibration. That idea — treat camera parameters as just another learnable output — reappears in learned camera models (Neural Ray Surfaces) and in today's calibration-free feed-forward reconstruction (DUSt3R-style models predicting geometry without intrinsics). For SLAM practitioners, it is also a reference point for handling dynamic objects inside self-supervised depth training, a persistent failure mode of photometric methods.

## Related

- [SfM-Learner](sfm-learner.md)
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md)
- [Neural Ray Surfaces](neural-ray-surfaces.md)
- [MonoDepth](monodepth.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
