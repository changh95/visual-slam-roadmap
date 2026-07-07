# MiDaS

> Ranftl 2020 · [Paper](https://arxiv.org/abs/1907.01341)

**One-line summary** — Robust relative (affine-invariant) monocular depth trained by mixing many heterogeneous datasets with a scale-and-shift invariant loss, achieving strong zero-shot generalization across domains.

## Problem

The success of monocular depth estimation depends on large and diverse training sets, but acquiring dense ground-truth depth at scale across different environments is so hard that the field fragmented into datasets with distinct characteristics and biases — stereo-derived, laser-scanned, structured-light, each with its own scale conventions, depth ranges, and even unknown or inconsistent calibration. Models trained on any single dataset are brittle outside their domain. MiDaS builds the tools to train on all of them *jointly*, even though their annotations are mutually incompatible.

## Key ideas

- **Scale-and-shift invariant loss**: Predictions and ground truth are aligned by a least-squares scale $s$ and shift $t$ ($\hat{d}_i = s \cdot d_i + t$) before the loss is computed, making training invariant to each dataset's units and depth conventions — the model learns *relative* (affine-invariant) depth, giving up absolute scale in exchange for compatibility.
- **Principled multi-objective learning**: Data from different sources is combined via multi-objective optimization rather than naive loss averaging, so no single dataset dominates training.
- **Encoder pretraining**: The paper highlights the importance of pretraining encoders on auxiliary tasks (ImageNet-scale pretraining) as a strong initialization for depth.
- **3D films as a data source**: Alongside five diverse training datasets (ReDWeb, DIML, MegaDepth, WSVD, and 3D Movies), MiDaS mines a massive new source of stereo supervision — 3D movies — trading label precision for enormous visual diversity.
- **Zero-shot cross-dataset transfer**: The evaluation protocol tests on datasets never seen during training, directly measuring generalization instead of benchmark overfitting — a protocol that later depth foundation models all adopted.

## Results & impact

Zero-shot cross-dataset experiments confirm that mixing complementary data sources greatly improves monocular depth estimation: MiDaS clearly outperforms competing methods across diverse datasets, setting a new state of the art and generalizing far better than single-dataset models. MiDaS v2/v3 (with the DPT backbone) became the standard off-the-shelf monocular depth model for roughly half a decade, and the scale-shift invariant loss was adopted by ZoeDepth, Depth Anything, and Marigold.

## Why it matters for SLAM

MiDaS (in its v2/v3 DPT-backbone versions) was *the* off-the-shelf monocular depth model for roughly half a decade, and its scale-shift invariant loss is now standard in depth learning (ZoeDepth, Depth Anything, Marigold). For SLAM, relative depth is directly useful as a dense prior — for filling textureless regions, regularizing dense mapping, or initializing depth in monocular pipelines — with the caveat that scale and shift must be resolved per frame by the SLAM system itself.

## Related

- [MonoDepth](monodepth.md) — earlier self-supervised single-dataset approach
- [DPT](dpt.md) — the ViT backbone that became MiDaS v3
- [ZoeDepth](zoedepth.md) — adds metric scale on top of MiDaS-style pretraining
- [Depth Anything](depth-anything.md) — scales the recipe to 62M images
- [Metric3D](metric3d.md) — the canonical-camera route to metric instead of relative depth

[Back to Level 5](../README.md#level-5-applying-deep-learning)
