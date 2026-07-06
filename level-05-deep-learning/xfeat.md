# XFeat
> Potje 2024 · [Paper](https://arxiv.org/abs/2404.19174)

**One-line summary** — An ultra-lightweight learned local feature (0.3M parameters, 64-dim descriptors) that reaches ~1400 FPS on an RTX 4090 by keeping spatial resolution high and channel count low, making learned matching practical on embedded hardware.

## Key ideas
- **Resolution-first CNN design**: prior learned features (SuperPoint, R2D2, DISK) use wide channels (256-dim) and aggressive downsampling. XFeat inverts this: a shallow encoder with very few channels and only limited downsampling, based on the insight that high spatial resolution matters more than wide channels for accurate keypoint localization.
- **Compact 64-dim descriptors**: a quarter the size of SuperPoint's 256-dim descriptors, cutting both memory and matching cost with minimal accuracy loss.
- **Sparse and semi-dense modes**: supports classical sparse keypoint matching and a semi-dense mode that produces coarse-grid correspondences refined by a match refinement module operating on coarse local descriptors — a practical middle ground between sparse (SuperPoint) and dense (LoFTR) matching.
- **Hardware-independent speed**: up to 5x faster than existing deep local features with comparable or better accuracy on pose estimation and visual localization; runs in real time even on an inexpensive laptop CPU.
- **Embedded-friendly by construction**: designed for resource-limited devices such as drones, mobile robots, and AR glasses rather than desktop GPUs.

## Why it matters for SLAM
Learned features had clearly surpassed hand-crafted ones (ORB, SIFT) in robustness, but their compute cost kept them out of real-time SLAM front-ends on embedded platforms. XFeat is the point where learned features became cheap enough to drop into a SLAM pipeline running on the kind of hardware robots actually ship with. Paired with a lightweight matcher such as LightGlue, it enables a full learned front-end (detection, description, matching) at frame rate on edge devices.

## Related
- [SuperPoint](superpoint.md) — the standard learned feature XFeat is benchmarked against.
- [LightGlue](lightglue.md) — efficient learned matcher commonly paired with XFeat.
- [LoFTR](loftr.md) — detector-free dense matching alternative that XFeat's semi-dense mode approximates at far lower cost.
- [DISK](disk.md) — accurate but heavier learned feature, illustrating the accuracy/speed trade-off.
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — the surrounding design debate.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
