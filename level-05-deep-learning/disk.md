# DISK

> Tyszkiewicz 2020 · [Paper](https://arxiv.org/abs/2006.13566)

**One-line summary** — Trains a joint keypoint detector and descriptor end-to-end with REINFORCE policy gradients, treating discrete keypoint selection as a stochastic policy whose reward is downstream match success or failure.

## Problem

Local feature frameworks are difficult to learn end-to-end because of the discreteness inherent to selecting and matching sparse keypoints: NMS and top-$k$ selection are non-differentiable. Prior methods worked around this with proxy losses — SuperPoint's homographic adaptation, R2D2's reliability maps, or soft relaxations of selection — which creates a train-test mismatch: the network is trained with soft selection but deployed with hard NMS, and none of these proxies directly optimizes what actually matters, the number of correct matches.

## Key ideas

- **Detection as reinforcement learning**: DISK makes the detector a stochastic policy — keypoints are sampled from per-pixel Bernoulli distributions, $p(k_i = 1) = \sigma(h_i)$, where $h_i$ is the heatmap logit produced by a U-Net. Discreteness stops being an obstacle because nothing needs to be differentiated through the selection.
- **Policy gradient training**: the expected reward $J = \mathbb{E}_{K \sim p}[R(K)]$ is optimized with the REINFORCE estimator $\nabla_\theta J = \mathbb{E}_{K \sim p}[R(K) \nabla_\theta \log p(K)]$ — no differentiability assumptions on the selection or matching steps.
- **Match success as reward**: keypoints earn positive reward $r^+$ when they produce geometrically correct matches (verified against epipolar-geometry ground truth) and negative reward $r^-$ for wrong matches, directly optimizing for a high number of correct feature matches instead of a proxy.
- **Training ≈ inference**: the simple probabilistic model keeps the training and inference regimes close while converging well enough to train reliably from scratch — the train-test mismatch of proxy-loss methods largely disappears.
- **Joint descriptor branch**: dense 128-dim descriptors are trained alongside the detector with a contrastive loss at the sampled keypoint locations.
- **Dense yet discriminative**: DISK features can be extracted very densely while remaining discriminative, challenging the common assumption that good keypoints must be sparse corners; they also spread more uniformly across the image than supervised detectors that cluster on high-gradient regions.

## Results & impact

- Delivered state-of-the-art results on three public benchmarks at publication, including HPatches homography estimation and the Image Matching Challenge 2020, and was competitive with SuperPoint+SuperGlue on visual localization tasks.
- Its uniform keypoint coverage (less clustering on textured regions) proved practically valuable for pose estimation stability.
- Demonstrated that optimizing the true downstream objective — matching success — outperforms hand-designed proxy losses, a lesson later feature-learning work absorbed.
- Adopted as one of the standard learned features: supported as a backbone in LightGlue and usable throughout the hloc pipeline.

## Why it matters for SLAM

DISK proved that optimizing matching success directly beats hand-designed proxy losses, and it became one of the standard learned front-end features alongside SuperPoint and R2D2. Its uniform spatial distribution of keypoints benefits SLAM systems that need constraints across the whole image, and it is supported as a feature backbone in LightGlue, making it a plug-and-play choice in the hloc localization pipeline.

## Related

- [SuperPoint](superpoint.md) — self-supervised joint detector/descriptor alternative
- [R2D2](r2d2.md) — reliability-aware detection, another answer to "where to detect"
- [HardNet](hardnet.md) — the descriptor-loss design lineage DISK builds on
- [LightGlue](lightglue.md) — matcher with native DISK support
- [hloc](hloc.md) — localization pipeline where DISK can drop in
- [DeDoDe](dedode.md) — later rethink that decouples detection from description

[Back to Level 5](../README.md#level-5-applying-deep-learning)
