# UndeepVO
> Li 2018 · [Paper](https://arxiv.org/abs/1709.06841)

**One-line summary** — A monocular visual odometry system trained with *unsupervised* deep learning that recovers absolute metric scale by training on stereo image pairs while running on monocular input at test time.

## Problem
Supervised learned VO (DeepVO) needs ground-truth 6-DoF poses, which are expensive to collect at scale, while the first self-supervised alternatives (SfM-Learner) trained from monocular video alone and therefore inherited the fundamental monocular limitation: depth and trajectory are recovered only up to an unknown, drifting scale factor.

What was missing was a way to train *without labels* yet still deliver metric-scale odometry from a single camera. UnDeepVO's answer: let training-time geometry, not runtime sensors, supply the scale.

## Key ideas
- **Two networks, no ground truth.** A pose network estimates the 6-DoF camera motion between consecutive frames and a depth network predicts per-pixel depth; both are trained end-to-end without any pose or depth labels — the two "salient features" the paper claims are the unsupervised training scheme and absolute scale recovery.
- **Stereo training for absolute scale.** During training the networks see stereo image pairs whose baseline is known and fixed. Predicted depths must explain the left↔right geometry — for a rectified pair, depth and disparity are tied by

  $$d = \frac{f\,B}{\text{disparity}}$$

  with focal length $f$ and baseline $B$ in meters — so the metric scale of the baseline is baked into the depth network and, through the coupled losses, into the pose network. This sidesteps the scale ambiguity of purely monocular self-supervision.
- **Monocular at test time.** After training, only consecutive monocular images are needed: the stereo rig is a training-time supervisory signal, not a deployment requirement, so UnDeepVO remains a monocular system.
- **Spatial + temporal dense losses.** The training loss combines *spatial* constraints within a stereo pair (photometric consistency between left and right images, consistency of predicted disparities) with *temporal* constraints between consecutive frames (photometric error after warping one frame into the other using the predicted depth and pose). In the standard formulation, a pixel $p$ in frame $t$ is reprojected into frame $t{+}1$ as

  $$p' = \pi\!\big(\mathbf{T}_{t\to t+1}\, \pi^{-1}(p, d_p)\big)$$

  and the intensity difference $|I_{t+1}(p') - I_t(p)|$ is penalized — classical multi-view geometry used as a free label.
- **Geometry as supervision.** The broader recipe — differentiable warping + photometric loss + known stereo baseline — turns calibration constants into supervision, requiring no human annotation at all.

## Results & impact
Experiments on KITTI show that UnDeepVO "achieves good performance in terms of pose accuracy" for an unsupervised monocular system of its time (per the abstract). Its lasting contribution is the training recipe rather than benchmark numbers: stereo-supervised self-supervision became a standard ingredient of later self-supervised depth and VO work (MonoDepth-style photometric losses combined with pose networks, later refined and integrated into direct VO by D3VO), and "train with stereo, deploy monocular" is now a routine pattern for scale-aware learned depth.

## Why it matters for SLAM
UndeepVO was one of the first works to show that the monocular scale problem can be attacked with *training data geometry* rather than extra sensors at runtime: use stereo supervision once, deploy monocular forever. This stereo-supervised self-supervision recipe became a standard ingredient in later self-supervised depth and VO methods (e.g., MonoDepth-style photometric losses combined with pose networks, later refined by D3VO). It is a useful case study of how classical multi-view geometry constraints can serve as free supervisory signals for learning.

## Related
- [SfM-Learner](sfm-learner.md) — the purely monocular self-supervised depth+pose predecessor (scale-ambiguous).
- [MonoDepth](monodepth.md) — stereo-supervised self-supervised depth estimation.
- [DeepVO](deepvo.md) — supervised end-to-end learned VO counterpart.
- [D3VO](../level-03-monocular-slam/d3vo.md) — later system integrating self-supervised depth, pose, and uncertainty into direct VO.
- [Self-supervised depth](../level-03-monocular-slam/self-supervised-depth.md) — the general concept.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the monocular limitation UnDeepVO trains its way around.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
