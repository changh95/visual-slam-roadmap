# Align3R

> Lu 2025 · [Paper](https://arxiv.org/abs/2412.03079)

**One-line summary** — Align3R turns flickering per-frame monocular depth predictions into temporally consistent video depth by aligning them with pairwise 3D pointmaps from a DUSt3R-based model (CVPR 2025 Highlight).

## Key ideas

- State-of-the-art monocular depth models (Depth Anything, Marigold, MiDaS) process frames independently, so scale and structure oscillate from frame to frame — a serious problem for any downstream video or SLAM use.
- Align3R keeps the sharp per-frame detail of a strong monocular depth estimator, and uses a DUSt3R-style pairwise pointmap model to supply the multi-view geometric glue between frames.
- The DUSt3R backbone is adapted (fine-tuned) so that its pairwise predictions can incorporate the monocular depth estimates, including on dynamic scenes with moving objects.
- A global alignment optimization then aligns the per-frame depth maps against the pairwise 3D constraints, producing temporally consistent video depth together with camera poses.
- Compared to purely per-frame prediction, this suppresses inter-frame flickering while keeping detail quality; compared to optical-flow-based smoothing, the constraints are genuinely geometric.

## Why it matters for SLAM

Consistent depth across frames is exactly what dense visual odometry and mapping need: a monocular depth network that disagrees with itself between frames poisons pose estimation and map fusion. Align3R shows a practical recipe — foundation-model depth for detail, DUSt3R-style pairwise geometry for consistency — that makes single-image depth models usable as a video/SLAM front-end, and it sits in the broader DUSt3R family of feed-forward 3D reconstruction methods being adapted to sequential data.

## Related

- [DUSt3R](../level-03-monocular-slam/dust3r.md)
- [MonST3R](../level-03-monocular-slam/monst3r.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Marigold](marigold.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
