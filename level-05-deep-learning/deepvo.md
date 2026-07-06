# DeepVO

> Wang 2017 · [Paper](https://arxiv.org/abs/1709.08429)

**One-line summary** — DeepVO (ICRA 2017) was the pioneering end-to-end learned visual odometry: a recurrent convolutional network that regresses 6-DoF camera poses directly from raw monocular video, replacing the entire classical VO pipeline.

## Key ideas

- Classical VO pipelines (feature extraction, matching, motion estimation, local optimization) must be carefully engineered and tuned per environment; DeepVO learns the whole mapping from images to poses end-to-end with supervised training.
- Architecture: a FlowNet-style **CNN** extracts motion features from consecutive frame pairs, and stacked **LSTM** layers integrate them over time, implicitly modeling sequential dynamics (motion smoothness, velocity) that frame-pair methods ignore.
- A regression head outputs the 6-DoF relative pose per step; the loss weights translation and orientation errors, and training uses ground-truth trajectories (KITTI).
- Because the network learns from data, it can implicitly absorb scale (from the training distribution) — something geometric monocular VO cannot recover without prior knowledge.
- On KITTI it showed competitive performance versus classical monocular VO, but generalization to unseen environments is limited — supervised pose regression tends to memorize the training domain.

## Why it matters for SLAM

DeepVO defined the CNN+RNN template for learned odometry and made "can a network do VO end-to-end?" a serious research question. Its limitations (data hunger, weak generalization) directly motivated the self-supervised line (SfM-Learner, UnDeepVO) and, later, hybrid architectures that reintroduce geometry (TartanVO, DROID-SLAM). It remains the standard first citation for supervised learned VO.

## Related

- [SfM-Learner](sfm-learner.md)
- [UndeepVO](undeepvo.md)
- [PoseNet](posenet.md)
- [TartanVO](../level-03-monocular-slam/tartanvo.md)
- [DeepSLAM](deepslam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
