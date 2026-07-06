# DeepSLAM

> Li 2020 · [Paper](https://ieeexplore.ieee.org/document/9047170)

**One-line summary** — DeepSLAM assembles a full monocular SLAM pipeline out of neural networks — Tracking-Net for pose, Mapping-Net for depth, and Loop-Net for loop detection — trained with self-supervision instead of ground-truth labels.

## Key ideas

- Mirrors the classical SLAM decomposition with learned modules: **Tracking-Net** estimates frame-to-frame camera motion, **Mapping-Net** (encoder-decoder) predicts scene depth, and **Loop-Net** produces embeddings for loop-closure detection.
- Training is unsupervised/self-supervised: stereo image pairs provide the geometric supervision signal (photometric consistency), so no ground-truth poses or depth labels are required; at test time the system runs on monocular input.
- Including a learned loop-detection component moves beyond "learned visual odometry" toward a complete SLAM system with drift correction, which most early deep VO works (DeepVO, SfM-Learner, UnDeepVO) lacked.
- The recurrent structure of the tracking network lets it exploit temporal context across a sequence rather than treating each frame pair independently.

## Why it matters for SLAM

DeepSLAM is representative of the late-2010s push to see how much of the classical SLAM pipeline could be replaced end-to-end by networks while keeping the pipeline's overall shape (tracking / mapping / loop closing). Its stereo-trained, monocular-deployed recipe sidesteps monocular scale ambiguity during training, the same trick as UnDeepVO. Today it reads as a stepping stone between per-module deep VO and fully integrated learned systems like DROID-SLAM.

## Related

- [DeepVO](deepvo.md)
- [UndeepVO](undeepvo.md)
- [SfM-Learner](sfm-learner.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
