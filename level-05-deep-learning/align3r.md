# Align3R

> Lu 2025 · [Paper](https://arxiv.org/abs/2412.03079)

**One-line summary** — Align3R turns flickering per-frame monocular depth predictions into temporally consistent video depth by aligning them with pairwise 3D pointmaps from a DUSt3R-based model (CVPR 2025 Highlight).

## Problem

Recent monocular depth estimators produce high-quality depth for single images but fail to estimate *consistent* depth across the frames of a video: scale and structure oscillate frame to frame. Recent works attack this by conditioning a video diffusion model on the input video to generate video depth, but that is training-expensive and can only produce scale-invariant depth values without camera poses. Align3R asks how to get temporally consistent depth maps — plus poses — for a dynamic monocular video without paying the diffusion price.

## Key ideas

- **Monocular detail + pairwise geometry.** Keep the sharp per-frame detail of a strong monocular depth estimator, and use the DUSt3R model's pairwise 3D pointmaps as the multi-view geometric glue that aligns depth maps of different timesteps.
- **Fine-tune DUSt3R with depth as input.** DUSt3R is fine-tuned to take the estimated monocular depth maps as additional inputs, adapting its pairwise pointmap prediction to dynamic scenes with moving objects — where vanilla DUSt3R, trained mostly on static scenes, struggles.
- **Joint optimization of depth and poses.** A subsequent optimization stage reconstructs both the per-frame depth maps and the camera poses, so the output is directly usable by downstream 3D and SLAM pipelines rather than being poseless, scale-free depth.
- **Geometric rather than photometric smoothing.** Compared to optical-flow-based or purely temporal smoothing, the inter-frame constraints are genuinely 3D — pairwise pointmaps constrain structure, not just appearance — which suppresses flicker without washing out detail.
- **Dynamic-scene aware by construction.** Because the alignment model is fine-tuned for dynamic scenes, moving objects do not corrupt the consistency optimization the way they corrupt naive multi-view constraints.

## Results & impact

- Per the abstract: "Extensive experiments demonstrate that Align3R estimates consistent video depth and camera poses for a monocular video with superior performance than baseline methods."
- Recognized as a CVPR 2025 Highlight; it has become a reference recipe for upgrading single-image depth foundation models into video-consistent estimators within the fast-moving DUSt3R ecosystem.
- Compared with video-diffusion depth approaches, Align3R avoids expensive generative training and additionally recovers camera poses.

## Why it matters for SLAM

Consistent depth across frames is exactly what dense visual odometry and mapping need: a monocular depth network that disagrees with itself between frames poisons pose estimation and map fusion. Align3R shows a practical recipe — foundation-model depth for detail, DUSt3R-style pairwise geometry for consistency — that makes single-image depth models usable as a video/SLAM front-end, and it sits in the broader DUSt3R family of feed-forward 3D reconstruction methods being adapted to sequential and dynamic data (MonST3R, MASt3R-SLAM).

## Related

- [DUSt3R](../level-03-monocular-slam/dust3r.md)
- [MonST3R](../level-03-monocular-slam/monst3r.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Marigold](marigold.md)
- [MASt3R-SLAM](../level-03-monocular-slam/mast3r-slam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
