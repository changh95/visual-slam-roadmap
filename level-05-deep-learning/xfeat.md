# XFeat
> Potje 2024 · [Paper](https://arxiv.org/abs/2404.19174)

**One-line summary** — An ultra-lightweight learned local feature with compact 64-dim descriptors that runs up to 5× faster than existing deep features — in real time even on a laptop CPU — by keeping spatial resolution high and channel count low, making learned matching practical on embedded hardware.

## Problem
State-of-the-art learned features (SuperPoint, R2D2, DISK) are accurate but too heavy for the hardware robots actually ship with — drones, AR glasses, mobile robots. The bottleneck is architectural: prior networks use wide channels (256-dim) and multiple downsampling stages, trading away the spatial resolution that geometric tasks need, while accurate matching "requires sufficiently large image resolutions" (per the abstract).

XFeat revisits the fundamental CNN design choices for detecting, extracting, and matching local features under a hard compute budget, asking: what if we keep spatial resolution as high as possible and spend as little as possible on channels?

## Key ideas
- **Resolution-first CNN design.** XFeat inverts the usual recipe: keep the image resolution as large as possible while limiting the number of channels. The encoder is shallow with very few channels and only limited downsampling, based on the insight that high spatial resolution matters more than wide channels for accurate keypoint localization.
- **Compact 64-dim descriptors** — a quarter the size of SuperPoint's 256-dim descriptors, cutting both memory and matching cost with minimal accuracy loss.
- **Sparse *and* semi-dense modes.** The same model offers classical sparse keypoint matching and a semi-dense mode producing coarse-grid correspondences, "each of which may be more suitable for different downstream applications, such as visual navigation and augmented reality."
- **Match refinement module.** XFeat is the first to offer semi-dense matching efficiently, via a novel refinement module that upgrades coarse matches using only the coarse local descriptors — a practical middle ground between sparse (SuperPoint) and dense (LoFTR) matching, without ever computing a dense fine-level feature map.
- **Training recipe.** A multi-task loss combining keypoint detection, descriptor matching, and reliability objectives, trained on a mixture of real correspondences (MegaDepth) and synthetically warped images.
- **Hardware-independent speed.** Up to 5× faster than existing deep local features with comparable or better accuracy, "proven in pose estimation and visual localization," and shown running in real time on an inexpensive laptop CPU without specialized hardware optimizations — embedded-friendly by construction rather than by post-hoc quantization.

At a glance, against the de-facto standard learned feature:

| | SuperPoint | XFeat |
|---|---|---|
| Descriptor dimension | 256 | 64 |
| Throughput | ~70 FPS (desktop GPU) | up to 5× faster than prior deep features; real-time on laptop CPU |
| Matching modes | sparse | sparse + semi-dense |

## Results & impact
Published at CVPR 2024. The headline result: up to 5× faster than competing deep local features at comparable or better accuracy on pose estimation and visual localization benchmarks, with real-time operation on a plain laptop CPU. The semi-dense mode approaches detector-free matching quality at a fraction of the cost. XFeat quickly became the default choice for learned features on edge devices and is commonly paired with LightGlue, enabling full learned front-ends (detect, describe, match) at frame rate on embedded platforms.

## Why it matters for SLAM
Learned features had clearly surpassed hand-crafted ones (ORB, SIFT) in robustness, but their compute cost kept them out of real-time SLAM front-ends on embedded platforms. XFeat is the point where learned features became cheap enough to drop into a SLAM pipeline running on the kind of hardware robots actually ship with. Paired with a lightweight matcher such as LightGlue, it enables a full learned front-end (detection, description, matching) at frame rate on edge devices.

## Related
- [SuperPoint](superpoint.md) — the standard learned feature XFeat is benchmarked against.
- [LightGlue](lightglue.md) — efficient learned matcher commonly paired with XFeat.
- [LoFTR](loftr.md) — detector-free dense matching alternative that XFeat's semi-dense mode approximates at far lower cost.
- [DISK](disk.md) — accurate but heavier learned feature, illustrating the accuracy/speed trade-off.
- [Learned vs hand-crafted](learned-vs-hand-crafted.md) — the surrounding design debate.
- [Edge deployment](../level-02-getting-familiar/edge-deployment.md) — the deployment context XFeat is designed for.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
