# PoseNet

> Kendall 2015 · [Paper](https://arxiv.org/abs/1505.07427)

**One-line summary** — First CNN to regress a full 6-DoF camera pose (translation + quaternion) directly from a single image, pioneering Absolute Pose Regression (APR) for visual relocalization.

## Key ideas

- **Direct pose regression**: A GoogLeNet (Inception v1) backbone pre-trained on ImageNet has its classifier replaced by a regression head that outputs 7 values: translation $\mathbf{t} \in \mathbb{R}^3$ and rotation quaternion $\mathbf{q} \in \mathbb{R}^4$.
- **Combined loss**: $\mathcal{L} = \|\hat{\mathbf{t}} - \mathbf{t}^*\|_2 + \beta \,\|\hat{\mathbf{q}} - \mathbf{q}^*/\|\mathbf{q}^*\|\|_2$, where the scene-dependent weight $\beta$ balances translation vs. rotation accuracy.
- **Map-free inference**: Training poses come from an SfM reconstruction, but at test time no 3D model or feature matching is needed — the scene is implicitly encoded in the network weights, giving a compact model and millisecond-scale inference.
- **Bayesian extension**: Monte Carlo dropout at test time yields pose uncertainty estimates, an early example of uncertainty-aware learned localization.
- Accuracy is meter-level (roughly 1–2 m median error on the Cambridge Landmarks scenes), far below structure-based methods — later analysis (Sattler et al. 2019) showed APR behaves more like image retrieval than geometric pose estimation.

## Why it matters for SLAM

PoseNet launched the learned-relocalization research direction and defined the APR problem setting. Its limitations were as influential as its results: understanding *why* direct pose regression saturates motivated scene coordinate regression methods (DSAC, ACE) that combine learning with geometric solvers and achieve centimeter accuracy. In SLAM, PoseNet-style regression is occasionally used as a coarse relocalization prior, while its uncertainty-aware variant foreshadowed learned covariance modeling.

## Related

- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — why APR accuracy is bounded by retrieval
- [DSAC](dsac.md) — scene coordinate regression with differentiable RANSAC
- [ACE](ace.md) — fast modern scene coordinate regression
- [hloc](hloc.md) — the structure-based hierarchical localization alternative

[Back to Level 5](../README.md#level-5-applying-deep-learning)
