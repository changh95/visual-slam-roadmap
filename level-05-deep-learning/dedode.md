# DeDoDe

> Edstedt 2024 · [Paper](https://arxiv.org/abs/2308.08479)

**One-line summary** — DeDoDe ("Detect, Don't Describe — Describe, Don't Detect") decouples keypoint detection from description, training the detector directly for 3D consistency from SfM tracks and the descriptor separately for matching.

## Problem

The core difficulty in learned keypoint detection is the learning objective: what makes a pixel a "good" keypoint? Previous learning-based methods (SuperPoint, R2D2, DISK) jointly learn descriptors with keypoints and treat detection as binary classification on descriptor mutual nearest neighbours — a proxy task that is "not guaranteed to produce 3D-consistent keypoints" and that ties the keypoints to one specific descriptor, complicating downstream usage. This coupling is also a chicken-and-egg problem: good detection presupposes knowing what is matchable, and good description presupposes knowing what will be detected.

## Key ideas

- **Detect for 3D consistency, directly.** The detector is trained to fire on points that appear in **tracks from large-scale SfM reconstructions** — points empirically proven to correspond to the same 3D point across many views — rather than on texture-salient or descriptor-matchable points.
- **Semi-supervised expansion.** SfM tracks are overly sparse for a useful detector, so a semi-supervised two-view detection objective expands the supervision to the desired number of detections per image (up to a target budget of $K$ points).
- **Describe independently.** The descriptor is a *separate* network trained to maximize the mutual-nearest-neighbour matching objective over the detected keypoints — pure discriminativeness, with no detection duties mixed into its loss.
- **Decoupled inference.** Because detection and description are independent, either component can be swapped or upgraded on its own; the pair plugs into matchers (e.g., LightGlue) and localization stacks (hloc) as a drop-in replacement for joint detector-descriptors.
- **Principled division of labour.** Each sub-task finally gets its own optimal objective — geometric stability for the detector, matchability for the descriptor — removing the proxy feedback loop that limited joint methods.

## Results & impact

- The abstract reports "significant gains on multiple geometry benchmarks" over prior joint detector-descriptors such as SuperPoint and DISK — a payoff of 3D-consistent keypoints that stay stable across viewpoint change.
- A refined follow-up (DeDoDe v2) further improved the detector training; the decoupled design has influenced how the community structures learned feature front-ends.
- Published at 3DV 2024 with code released; widely used in image-matching pipelines alongside the same group's RoMa dense matcher.

## Why it matters for SLAM

Keypoint quality bounds everything downstream in feature-based SLAM: triangulation, BA, relocalization. DeDoDe's insight — supervise detection with 3D consistency rather than descriptor-matching proxies — gives keypoints that survive wide baselines and viewpoint change, which is exactly what long-term SLAM and mapping need. It also exemplifies the modern trend of decomposing the learned front-end into independently optimized, composable pieces.

## Related

- [SuperPoint](superpoint.md)
- [DISK](disk.md)
- [R2D2](r2d2.md)
- [LightGlue](lightglue.md)
- [RoMa](roma.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
