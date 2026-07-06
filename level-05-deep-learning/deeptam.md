# DeepTAM

> Zhou 2018 · [Paper](https://arxiv.org/abs/1808.01900)

**One-line summary** — DeepTAM (ECCV 2018) is a learned re-imagining of DTAM: a tracking network estimates the camera pose against a keyframe and a mapping network accumulates a cost volume over frames to produce dense keyframe depth.

## Key ideas

- **Keyframe-based dense tracking, learned**: instead of direct photometric minimization (as in DTAM/LSD-SLAM), a network predicts pose increments that align the current image with a synthetic view rendered from the keyframe, refined coarse-to-fine over multiple resolution levels.
- Generating many small pose hypotheses and aggregating them makes tracking robust and keeps the learning problem local (small increments rather than absolute poses), reducing dependence on training-set motion statistics.
- **Cost-volume mapping**: depth for each keyframe is computed by accumulating photoconsistency information from many frames into a plane-sweep cost volume, which a network then refines — combining classical multi-view accumulation with learned regularization (including narrow-band refinement around the current surface estimate).
- Tracking and mapping remain separate, interacting modules (the classical PTAM/DTAM architecture), rather than one monolithic pose-and-depth regressor.

## Why it matters for SLAM

DeepTAM showed that the classical dense tracking-and-mapping architecture survives the transition to deep learning: keep the structure (keyframes, cost volumes, incremental alignment) and learn the components that classical methods do poorly (robust alignment, depth regularization). This cost-volume-plus-refinement pattern became a staple of learned multi-view depth (DeepV2D, TANDEM, MVS networks) and its incremental-alignment idea foreshadows the update operators of RAFT/DROID-SLAM.

## Related

- [DTAM](../level-03-monocular-slam/dtam.md)
- [DeepV2D](deepv2d.md)
- [DeMoN](demon.md)
- [TANDEM](tandem.md)
- [DVO](../level-04-rgbd-slam/dvo.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
