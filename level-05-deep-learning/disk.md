# DISK

> Tyszkiewicz 2020 · [Paper](https://arxiv.org/abs/2006.13566)

**One-line summary** — Trains a joint keypoint detector and descriptor end-to-end with REINFORCE policy gradients, treating discrete keypoint selection as a stochastic policy whose reward is downstream match success or failure.

## Key ideas

- **Detection as reinforcement learning**: keypoint selection (NMS, top-$k$) is non-differentiable, so prior methods trained with proxy losses. DISK sidesteps this by making the detector a stochastic policy — keypoints are sampled from per-pixel Bernoulli distributions produced by a U-Net.
- **Policy gradient training**: the expected reward $J = \mathbb{E}_{K \sim p}[R(K)]$ is optimized with the REINFORCE estimator $\nabla_\theta J = \mathbb{E}_{K \sim p}[R(K) \nabla_\theta \log p(K)]$ — no differentiability assumptions on the selection step.
- **Match success as reward**: keypoints earn positive reward when they produce geometrically correct matches (verified against epipolar-geometry ground truth) and negative reward for wrong matches, directly optimizing the true downstream objective instead of a proxy.
- **Joint descriptor branch**: dense 128-dim descriptors are trained alongside the detector with a contrastive loss at the sampled keypoint locations.
- **Uniform keypoint coverage**: DISK's features spread more evenly across the image than supervised detectors that cluster on high-gradient regions — a useful property for pose estimation stability.

## Why it matters for SLAM

DISK proved that optimizing matching success directly beats hand-designed proxy losses, and it became one of the standard learned front-end features alongside SuperPoint and R2D2. Its uniform spatial distribution of keypoints benefits SLAM systems that need constraints across the whole image, and it is supported as a feature backbone in LightGlue, making it a plug-and-play choice in the hloc localization pipeline.

## Related

- [SuperPoint](superpoint.md) — self-supervised joint detector/descriptor alternative
- [R2D2](r2d2.md) — reliability-aware detection, another answer to "where to detect"
- [HardNet](hardnet.md) — the descriptor-loss design lineage DISK builds on
- [LightGlue](lightglue.md) — matcher with native DISK support
- [hloc](hloc.md) — localization pipeline where DISK can drop in

[Back to Level 5](../README.md#level-5-applying-deep-learning)
