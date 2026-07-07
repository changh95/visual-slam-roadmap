# DeepSLAM

> Li 2020 · [Paper](https://ieeexplore.ieee.org/document/9047170)

**One-line summary** — DeepSLAM assembles a full monocular SLAM pipeline out of neural networks — Tracking-Net for pose, Mapping-Net for depth, and Loop-Net for loop detection — trained with self-supervision instead of ground-truth labels.

## Problem

By 2020, learned visual odometry existed in supervised (DeepVO) and self-supervised (SfM-Learner, UnDeepVO) forms, but these were odometry-only: they drifted without bound because they had no loop closing, and supervised variants needed expensive ground-truth trajectories. DeepSLAM asks whether the *whole* classical SLAM decomposition — tracking, mapping, and loop closure — can be reproduced with neural networks trained without ground-truth labels.

## Key ideas

- Mirrors the classical SLAM decomposition with learned modules: **Tracking-Net** estimates frame-to-frame camera motion, **Mapping-Net** (encoder-decoder) predicts scene depth, and **Loop-Net** produces embeddings for loop-closure detection.
- Training is unsupervised/self-supervised: stereo image pairs provide the geometric supervision signal (photometric consistency), so no ground-truth poses or depth labels are required; at test time the system runs on monocular input.
- Training on stereo pairs but deploying monocular sidesteps monocular scale ambiguity during training — the same trick as UnDeepVO.
- Including a learned loop-detection component moves beyond "learned visual odometry" toward a complete SLAM system with drift correction, which most early deep VO works (DeepVO, SfM-Learner, UnDeepVO) lacked.
- The recurrent structure of the tracking network lets it exploit temporal context across a sequence rather than treating each frame pair independently.

## Results & impact

- Published in an IEEE journal in 2020; this note stays deliberately brief on specifics — see the paper (linked above) for its KITTI evaluation details.
- Historically, DeepSLAM is representative of the late-2010s push to see how much of the classical SLAM pipeline could be replaced end-to-end by networks while keeping the pipeline's overall shape (tracking / mapping / loop closing).

## Why it matters for SLAM

DeepSLAM shows the "replace every module with a network, keep the architecture" strategy at its fullest extent, including the loop-closure stage that pure learned-VO papers omitted. Today it reads as a stepping stone between per-module deep VO and fully integrated learned systems like DROID-SLAM, and its stereo-trained/monocular-deployed recipe remains a standard way to obtain scale-aware self-supervision.

## Related

- [DeepVO](deepvo.md)
- [UndeepVO](undeepvo.md)
- [SfM-Learner](sfm-learner.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
