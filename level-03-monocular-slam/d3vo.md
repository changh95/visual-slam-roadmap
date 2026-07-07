# D3VO

> Yang 2020 · [Paper](https://arxiv.org/abs/2003.01060)

**One-line summary** — Integrated three deep networks — depth, pose, and aleatoric uncertainty — into the DSO-style direct VO framework, leveraging learned priors while keeping the geometric rigour of photometric bundle adjustment.

## Problem

By 2020 it was clear that a single learned quantity (depth, as in CNN-SLAM and DVSO) could strengthen classical monocular VO, but purely geometric monocular systems still trailed stereo and visual-inertial pipelines, and networks were still used only shallowly. D3VO ("Deep Depth, Deep Pose and Deep Uncertainty for Monocular Visual Odometry") asked how much of the gap could be closed by exploiting deep networks on *three* levels at once — depth, pose, and uncertainty — and integrating all three tightly into both the front-end tracking and the back-end nonlinear optimisation of a direct VO system.

## Key ideas

- **Deep depth**: a novel self-supervised monocular depth network is trained on stereo videos "without any external supervision"; its predictions initialise and constrain the inverse depths in the direct VO backend, supplying metric scale.
- **Brightness alignment for self-supervision**: the training procedure "aligns the training image pairs into similar lighting condition with predictive brightness transformation parameters" — attacking the illumination changes that break photometric losses, in the same spirit as DSO's affine brightness modelling.
- **Deep pose**: a pose network predicts relative pose priors that initialise and constrain tracking, helping in textureless or degenerate regions where photometric alignment struggles.
- **Deep aleatoric uncertainty**: the network models "the photometric uncertainties of pixels on the input images," which both improves depth estimation accuracy and "provides a learned weighting function for the photometric residuals" — pixels the network flags as unreliable (non-Lambertian surfaces, moving objects) are downweighted in the optimisation.
- **Priors + optimisation, not priors instead of optimisation**: D3VO "tightly incorporates the predicted depth, pose and uncertainty into a direct visual odometry method to boost both the front-end tracking as well as the back-end non-linear optimization" — the sliding-window photometric bundle adjustment remains the estimation core.

## Results & impact

From the abstract: the depth network alone outperforms state-of-the-art self-supervised depth estimation networks; on the KITTI odometry benchmark and EuRoC MAV, D3VO "outperforms state-of-the-art traditional monocular VO methods by a large margin," and — most strikingly — "achieves comparable results to state-of-the-art stereo/LiDAR odometry on KITTI and to the state-of-the-art visual-inertial odometry on EuRoC MAV, while using only a single camera." Matching stereo and VIO pipelines with one passive camera was the strongest evidence to date that learned priors can substitute for extra sensors.

## Why it matters for SLAM

D3VO is the culmination of the "deep priors inside a direct VO backend" line that runs CNN-SLAM → DVSO → D3VO: each step incorporated more learned quantities into the classical pipeline. It showed convincingly that deep networks and geometric optimisation are complementary rather than competing, achieving strong monocular VO results on standard benchmarks, and its uncertainty-weighted residual design became an influential pattern in later hybrid systems.

## Related

- [DSO](dso.md)
- [DVSO](dvso.md)
- [CNN-SLAM](cnn-slam.md)
- [MonoDepth](../level-05-deep-learning/monodepth.md)
- [Self-supervised depth](self-supervised-depth.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
