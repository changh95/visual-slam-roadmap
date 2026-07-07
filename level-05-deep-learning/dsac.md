# DSAC

> Brachmann 2017 · [Paper](https://arxiv.org/abs/1611.05705)

**One-line summary** — Makes RANSAC differentiable via probabilistic hypothesis selection, enabling end-to-end training of scene coordinate regression networks through the robust pose estimator.

## Problem

RANSAC is a central building block of robust geometric vision, but its discrete hypothesis-selection step (pick the hypothesis with the most inliers) is non-differentiable, so it could not be used inside end-to-end trainable deep pipelines. For camera relocalization specifically, deep learning had so far failed to improve on traditional approaches: direct pose regression (PoseNet-style) discards geometry, while scene coordinate regression kept the geometry but could not be trained through the RANSAC-based pose solver that its output ultimately feeds.

## Key ideas

- **Scene Coordinate Regression (SCR)**: a network (random forest or CNN) predicts a 3D scene coordinate $\mathbf{Y}_i \in \mathbb{R}^3$ for each pixel, turning relocalization into dense 2D-3D correspondence estimation; minimal sets of correspondences are sampled to generate pose hypotheses via PnP.
- **Two routes to differentiability**: the paper investigates both a soft-argmax relaxation of hypothesis selection and a probabilistic selection; the probabilistic route — inspired by reinforcement learning — proves the more promising.
- **Probabilistic hypothesis selection**: replace the deterministic argmax with sampling a hypothesis according to its score, and optimize the *expected* loss $\mathbb{E}[\mathcal{L}] = \sum_j p(\mathcal{H}_j)\,\mathcal{L}(\mathcal{H}_j)$ with $p(\mathcal{H}_j) \propto \text{score}(\mathcal{H}_j)$ — the expected loss is differentiable w.r.t. all learnable parameters even though each selection is discrete.
- **Soft inlier counting**: the hard inlier threshold in hypothesis scoring is smoothed into a differentiable surrogate so gradients flow through scoring as well.
- **Train what you test**: the network is trained by directly minimizing the expected loss of the final, robustly estimated camera pose — the actual quantity relocalization cares about — rather than a per-pixel proxy.

## Results & impact

- Directly minimizing the expected pose loss through the robust estimator yields an increase in relocalization accuracy over the non-end-to-end pipeline — the first demonstration that deep learning could improve camera localization by keeping RANSAC in the loop.
- Established scene coordinate regression as the dominant learned paradigm for indoor relocalization, far more accurate than absolute pose regression.
- The differentiable-RANSAC concept spread broadly through geometric deep learning ("any deep learning pipeline can use DSAC as a robust optimization component"), and DSAC is the direct ancestor of DSAC++, DSAC\*, and the ACE line.

## Why it matters for SLAM

DSAC established scene coordinate regression as the dominant learned paradigm for indoor camera relocalization, dramatically outperforming absolute pose regression (PoseNet-style) methods because it keeps the geometric solver in the loop. The differentiable-RANSAC idea spread broadly through geometric deep learning, and DSAC is the direct ancestor of DSAC++, DSAC\*, and the ACE line of fast-training relocalizers used today.

## Related

- [PoseNet](posenet.md) — absolute pose regression baseline that SCR superseded
- [DSAC++](dsacpp.md) — self-supervised successor needing only camera poses
- [DSAC\*](dsac-star.md) — unified RGB/RGB-D framework with stabilized training
- [ACE](ace.md) — scene coordinate regression trained in minutes instead of hours
- [CNN Pose Regression Limitations](cnn-pose-regression-limitations.md) — why direct pose regression falls short

[Back to Level 5](../README.md#level-5-applying-deep-learning)
