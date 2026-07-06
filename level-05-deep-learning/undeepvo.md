# UndeepVO
> Li 2018 · [Paper](https://arxiv.org/abs/1709.06841)

**One-line summary** — A monocular visual odometry system trained with *unsupervised* deep learning that recovers absolute metric scale by training on stereo image pairs while running on monocular input at test time.

## Key ideas
- **Two networks, no ground truth**: a pose network estimates the 6-DoF camera motion between consecutive frames and a depth network predicts per-pixel depth; both are trained without any pose or depth labels.
- **Stereo training for absolute scale**: during training, the known, fixed stereo baseline anchors the metric scale of the predicted depths and poses. This sidesteps the scale ambiguity that plagues purely monocular self-supervised methods like SfM-Learner, which can only recover trajectories up to an unknown scale.
- **Monocular at test time**: after training, only consecutive monocular images are needed — the stereo rig is a training-time supervisory signal, not a deployment requirement.
- **Spatial and temporal losses**: the training loss combines spatial constraints between the left/right images of a stereo pair (photometric consistency, disparity consistency) with temporal constraints between consecutive frames (photometric warping using the predicted depth and pose).
- Evaluated on KITTI, showing good pose accuracy for an unsupervised monocular system of its time.

## Why it matters for SLAM
UndeepVO was one of the first works to show that the monocular scale problem can be attacked with *training data geometry* rather than extra sensors at runtime: use stereo supervision once, deploy monocular forever. This stereo-supervised self-supervision recipe became a standard ingredient in later self-supervised depth and VO methods (e.g., MonoDepth-style photometric losses combined with pose networks, later refined by D3VO). It is a useful case study of how classical multi-view geometry constraints can serve as free supervisory signals for learning.

## Related
- [SfM-Learner](sfm-learner.md) — the purely monocular self-supervised depth+pose predecessor (scale-ambiguous).
- [MonoDepth](monodepth.md) — stereo-supervised self-supervised depth estimation.
- [DeepVO](deepvo.md) — supervised end-to-end learned VO counterpart.
- [D3VO](../level-03-monocular-slam/d3vo.md) — later system integrating self-supervised depth, pose, and uncertainty into direct VO.
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the general concept.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
