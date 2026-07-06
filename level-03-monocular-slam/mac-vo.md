# MAC-VO

> Qiu 2024 · [Paper](https://arxiv.org/abs/2409.09479)

**One-line summary** — A learning-based stereo visual odometry that predicts *metrics-aware* matching covariances and uses them both to select keypoints and to weight residuals in pose optimisation.

## Key ideas

- **Learned matching uncertainty**: instead of scalar confidences, the network models the expected matching error as a full covariance, capturing anisotropic, correlated error (e.g., uncertainty elongated along the viewing ray after triangulation).
- **Uncertainty-guided keypoint selection**: keypoints whose learned uncertainty is high or globally inconsistent are filtered out — a departure from classical selectors that simply prefer textured corners and edges.
- **Covariance-weighted optimisation**: residuals in the pose (graph) optimisation are weighted by the inverse covariance (Mahalanobis distance), so unreliable matches contribute less and directional uncertainty is modelled correctly, unlike scale-agnostic diagonal weightings used in prior learned VO.
- **Metric-space propagation**: image-space matching uncertainty is propagated through stereo triangulation into 3D, giving covariances that are meaningful in metres — useful beyond VO itself.
- **Robustness focus**: the design targets challenging conditions — varying illumination, low feature density, aggressive motion — where the covariance map also serves as a reliability signal for downstream decision-making.

## Why it matters for SLAM

MAC-VO represents the maturing of learning-based odometry: not just predicting poses or flow, but predicting *how wrong* the predictions are, in a form (covariances) that classical estimation theory knows how to consume. On challenging benchmarks it outperforms prior learned VO (TartanVO, DPVO) and even some full SLAM systems. Calibrated uncertainty is exactly what is needed to fuse learned front-ends with filters, factor graphs, and multi-sensor systems.

## Related

- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [DROID-SLAM](droid-slam.md)
- [D3VO](d3vo.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
