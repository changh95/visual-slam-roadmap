# MiDaS

> Ranftl 2020 · [Paper](https://arxiv.org/abs/1907.01341)

**One-line summary** — Robust relative (affine-invariant) monocular depth trained by mixing many heterogeneous datasets with a scale-and-shift invariant loss, achieving strong zero-shot generalization across domains.

## Key ideas

- **Multi-dataset mixing**: Depth datasets come from stereo, laser, and structured-light sources with incompatible scales and ranges; MiDaS trains on many of them jointly (ReDWeb, MegaDepth, 3D movies, and more) instead of overfitting to one.
- **Scale-and-shift invariant loss**: Predictions and ground truth are aligned by a least-squares scale $s$ and shift $t$ ($\hat{d}_i = s \cdot d_i + t$) before computing the loss, making training invariant to each dataset's units — the model learns *relative* depth.
- **Zero-shot evaluation protocol**: Test on datasets never seen in training; MiDaS generalizes across indoor, outdoor, and film domains far better than single-dataset models.
- **Foundation-model recipe before the name**: Large, diverse data plus an invariance-aware loss beats specialized supervised training — the blueprint later scaled up by DPT and Depth Anything.

## Why it matters for SLAM

MiDaS (in its v2/v3 DPT-backbone versions) was *the* off-the-shelf monocular depth model for roughly half a decade, and its scale-shift invariant loss is now standard in depth learning (ZoeDepth, Depth Anything, Marigold). For SLAM, relative depth is directly useful as a dense prior — for filling textureless regions, regularizing dense mapping, or initializing depth in monocular pipelines — with the caveat that scale and shift must be resolved per frame by the SLAM system itself.

## Related

- [MonoDepth](monodepth.md) — earlier self-supervised single-dataset approach
- [DPT](dpt.md) — the ViT backbone that became MiDaS v3
- [ZoeDepth](zoedepth.md) — adds metric scale on top of MiDaS-style pretraining
- [Depth Anything](depth-anything.md) — scales the recipe to 62M images

[Back to Level 5](../README.md#level-5-applying-deep-learning)
