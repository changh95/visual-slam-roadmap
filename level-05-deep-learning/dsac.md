# DSAC

> Brachmann 2017 · [Paper](https://arxiv.org/abs/1611.05705)

**One-line summary** — Makes RANSAC differentiable via probabilistic hypothesis selection, enabling end-to-end training of scene coordinate regression networks through the robust pose estimator.

## Key ideas

- **Scene Coordinate Regression (SCR)**: a network (random forest or CNN) predicts a 3D scene coordinate $\mathbf{Y}_i \in \mathbb{R}^3$ for each pixel, turning relocalization into dense 2D-3D correspondence estimation followed by PnP.
- **The differentiability problem**: pose estimation needs RANSAC to reject outlier correspondences, but RANSAC's discrete argmax hypothesis selection blocks gradients — so the SCR network could not previously be trained end-to-end through the pose objective.
- **Soft hypothesis selection**: replace the argmax with probabilistic selection, optimizing the expected loss $\mathbb{E}[\mathcal{L}] = \sum_j p(\mathcal{H}_j)\,\mathcal{L}(\mathcal{H}_j)$ where the selection probability $p(\mathcal{H}_j)$ is proportional to each hypothesis's score.
- **Soft inlier counting**: the hard inlier threshold is smoothed into a differentiable surrogate so gradients flow through hypothesis scoring as well.

## Why it matters for SLAM

DSAC established scene coordinate regression as the dominant learned paradigm for indoor camera relocalization, dramatically outperforming absolute pose regression (PoseNet-style) methods because it keeps the geometric solver in the loop. The differentiable-RANSAC idea spread broadly through geometric deep learning, and DSAC is the direct ancestor of DSAC++, DSAC\*, and the ACE line of fast-training relocalizers used today.

## Related

- [PoseNet](posenet.md) — absolute pose regression baseline that SCR superseded
- [DSAC++](dsacpp.md) — self-supervised successor needing only camera poses
- [DSAC\*](dsac-star.md) — unified RGB/RGB-D framework with stabilized training
- [ACE](ace.md) — scene coordinate regression trained in minutes instead of hours

[Back to Level 5](../README.md#level-5-applying-deep-learning)
