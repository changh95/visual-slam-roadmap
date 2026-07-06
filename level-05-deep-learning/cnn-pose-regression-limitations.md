# CNN Pose Regression Limitations

> Sattler 2019 · [Paper](https://arxiv.org/abs/1903.07504)

**One-line summary** — This CVPR 2019 analysis ("Understanding the Limitations of CNN-based Absolute Pose Regression") showed that PoseNet-style absolute pose regression behaves more like image retrieval with pose interpolation than like true 3D-geometry-based localization.

## Key ideas

- Absolute pose regression (APR) networks such as PoseNet regress a 6-DoF pose directly from a single image, which is fast and attractive — but the paper asks what these networks actually learn.
- A theoretical model shows APR predictions are effectively combinations of poses seen during training: the network embeds training images and interpolates/extrapolates their poses, rather than reasoning about scene geometry.
- Consequently, APR is more closely related to **image retrieval** baselines (retrieve nearest training image, use its pose) than to structure-based methods, and its accuracy does not consistently beat such a simple retrieval baseline.
- APR generalizes poorly to viewpoints away from the training trajectory — there is no built-in mechanism forcing geometric consistency of the predicted pose.
- Structure-based approaches (feature matching + PnP, and scene coordinate regression like DSAC) remain far more accurate, because they ground pose estimation in explicit 2D-3D geometry.

## Why it matters for SLAM

This paper is the standard reference for why "just regress the pose with a CNN" is not a substitute for geometric relocalization. It redirected the learned-localization field toward scene coordinate regression (DSAC*, ACE) and hybrid retrieval + matching pipelines (HF-Net / hloc), which keep geometry in the loop. Whenever a learned relocalizer is proposed, this is the sanity check: is it better than retrieval, and does it generalize beyond the mapping trajectory?

## Related

- [PoseNet](posenet.md)
- [DSAC](dsac.md)
- [ACE](ace.md)
- [HF-Net](hf-net.md)
- [NetVLAD](netvlad.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
