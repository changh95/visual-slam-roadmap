# NetVLAD

> Arandjelović 2016 · [Paper](https://arxiv.org/abs/1511.07247)

**One-line summary** — End-to-end trainable CNN for large-scale visual place recognition, built around a differentiable VLAD pooling layer trained from weakly supervised GPS-tagged street-view imagery.

## Key ideas

- **Differentiable VLAD**: Classical VLAD aggregates local descriptors against cluster centers but uses hard assignment, which is not differentiable. NetVLAD replaces it with soft assignment $\bar{a}_k(\mathbf{x}_i) = \frac{e^{\mathbf{w}_k^T \mathbf{x}_i + b_k}}{\sum_{k'} e^{\mathbf{w}_{k'}^T \mathbf{x}_i + b_{k'}}}$, making the whole pipeline end-to-end trainable.
- **Weak supervision from GPS**: Trained with a triplet-style ranking loss on Google Street View Time Machine data — images of the same place across time are positives — requiring no manual labels.
- **Compact global descriptor**: VGG-16 backbone plus NetVLAD pooling produces a single image-level descriptor (4096-dim after PCA) suitable for fast large-scale retrieval.
- **Robustness**: Substantially outperformed hand-crafted aggregation (VLAD, Fisher Vectors) on place-recognition benchmarks, including day/night and seasonal changes.

## Why it matters for SLAM

Loop-closure detection and relocalization are place-recognition problems, and NetVLAD's descriptor was the de facto standard for them for years — it is the global retrieval stage of the hloc pipeline and countless SLAM systems. It also established the template for learned place recognition (CNN backbone + trainable aggregation + weak metric-learning supervision) that Patch-NetVLAD, CosPlace, MixVPR, and today's foundation-model VPR methods still follow.

## Related

- [Patch NetVLAD](patch-netvlad.md) — multi-scale patch-level successor with spatial re-ranking
- [HF-Net](hf-net.md) — hierarchical localization built on NetVLAD retrieval
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the task in SLAM context
- [SuperPoint](superpoint.md) — the local-feature counterpart in learned localization pipelines

[Back to Level 5](../README.md#level-5-applying-deep-learning)
