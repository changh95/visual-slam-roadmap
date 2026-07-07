# MAC-VO

> Qiu 2024 · [Paper](https://arxiv.org/abs/2409.09479)

**One-line summary** — A learning-based stereo visual odometry that predicts *metrics-aware* matching covariances and uses them both to select keypoints and to weight residuals in pose optimisation.

## Problem

Learning-based VO systems predict dense matches or flow, but they model reliability poorly: most use either no uncertainty at all or a scale-agnostic scalar/diagonal confidence per match, which cannot express that matching error is anisotropic and correlated across axes (e.g., much larger along the viewing ray after triangulation than across it). Meanwhile keypoint selection still follows the classical habit of preferring texture-rich corners and edges, even when those matches are globally inconsistent. MAC-VO replaces both with a single learned, metrics-aware covariance model.

## Key ideas

- **Learned matching uncertainty, used twice**: the learned metrics-aware matching uncertainty serves "dual purposes: selecting keypoint and weighing the residual in pose graph optimization" (abstract) — the same quantity filters the input and calibrates the estimator.
- **Uncertainty-guided keypoint selection**: instead of prioritising "texture-affluent features like edges", the keypoint selector "employs the learned uncertainty to filter out the low-quality features based on global inconsistency" (abstract) — a match can look sharp locally and still be rejected because it disagrees with the scene globally.
- **Full covariance, not a scalar**: in contrast to prior learned VO that models "the scale-agnostic diagonal weight matrix for covariance", MAC-VO's covariance model captures "the spatial error during keypoint registration and the correlations between different axes" (abstract) — anisotropic, correlated, and in metric units.
- **Covariance-weighted optimisation**: residuals in the pose-graph optimisation are weighted by inverse covariance (Mahalanobis form, $\sum_i \mathbf{e}_i^\top \boldsymbol{\Sigma}_i^{-1} \mathbf{e}_i$), so unreliable matches contribute less and directional uncertainty is modelled correctly — exactly how classical estimation expects measurement noise to be described.
- **Metric-space propagation**: image-space matching uncertainty is propagated through stereo triangulation into 3D, giving covariances meaningful in metres — usable by downstream consumers (mapping, planning, fusion), not just the VO itself.
- **Robustness as the target**: the design aims at "challenging environments with varying illumination, feature density, and motion patterns" (abstract), where uniform weighting of learned matches breaks down.

## Results & impact

- "On public benchmark datasets, MAC-VO outperforms existing VO algorithms and even some SLAM algorithms in challenging environments" (abstract); the evaluation benchmarks include KITTI and TartanAir, with prior learned VO (TartanVO, DPVO) among the main points of comparison.
- "The covariance map also provides valuable information about the reliability of the estimated poses, which can benefit decision-making for autonomous systems" (abstract) — the output is a pose *with* a trustworthiness signal.

## Why it matters for SLAM

MAC-VO represents the maturing of learning-based odometry: not just predicting poses or flow, but predicting *how wrong* the predictions are, in a form (covariances) that classical estimation theory knows how to consume. Calibrated uncertainty is exactly what is needed to fuse learned front-ends with filters, factor graphs, and multi-sensor systems — the missing piece that keeps most learned VO out of production estimation stacks.

## Related

- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [DROID-SLAM](droid-slam.md)
- [D3VO](d3vo.md)
- [Consistency](../level-02-getting-familiar/consistency.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
