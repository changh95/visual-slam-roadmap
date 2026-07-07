# NetVLAD

> Arandjelović 2016 · [Paper](https://arxiv.org/abs/1511.07247)

**One-line summary** — End-to-end trainable CNN for large-scale visual place recognition, built around a differentiable VLAD pooling layer trained from weakly supervised GPS-tagged street-view imagery.

## Problem

Large-scale visual place recognition — quickly and accurately recognizing where a query photograph was taken — needs a compact, discriminative image-level descriptor. Classical VLAD (Vector of Locally Aggregated Descriptors) aggregates local descriptors well but uses hard cluster assignment, so it cannot be trained end-to-end, and off-the-shelf CNN features were never optimized for the place-recognition task. A further obstacle is supervision: nobody hand-labels which images depict the same place, so training must work from noisy, weakly supervised GPS-tagged data.

## Key ideas

- **Differentiable VLAD layer**: VLAD accumulates residuals of local descriptors $\mathbf{x}_i$ against cluster centers $\mathbf{c}_k$, $V(k) = \sum_i \bar{a}_k(\mathbf{x}_i)\,(\mathbf{x}_i - \mathbf{c}_k)$. NetVLAD replaces the non-differentiable hard assignment with a learned soft assignment
  $\bar{a}_k(\mathbf{x}_i) = \frac{e^{\mathbf{w}_k^T \mathbf{x}_i + b_k}}{\sum_{k'} e^{\mathbf{w}_{k'}^T \mathbf{x}_i + b_{k'}}}$,
  making the whole pipeline end-to-end trainable via backpropagation.
- **Pluggable design**: The layer is readily pluggable into any CNN architecture — here a VGG-16 backbone, whose conv features become the "local descriptors" being aggregated.
- **Weak supervision from GPS**: A new weakly supervised triplet-style ranking loss trains the network on Google Street View Time Machine data — images of the same places captured over time serve as potential positives, requiring no manual labels.
- **Compact global descriptor**: The pooled representation is PCA-compressed to a single 4096-dim descriptor per image, suitable for fast nearest-neighbor retrieval at city scale.

## Results & impact

NetVLAD significantly outperforms non-learnt image representations (VLAD, Fisher Vectors) and off-the-shelf CNN descriptors on two challenging place recognition benchmarks — Pittsburgh 250k and Tokyo 24/7 — by large margins, with robustness to viewpoint and illumination (day/night) change, and improves over the then state-of-the-art compact image representations on standard image retrieval benchmarks. The NetVLAD descriptor became the de facto standard for visual place recognition for several years.

## Why it matters for SLAM

Loop-closure detection and relocalization are place-recognition problems, and NetVLAD's descriptor was the de facto standard for them for years — it is the global retrieval stage of the hloc pipeline and countless SLAM systems. It also established the template for learned place recognition (CNN backbone + trainable aggregation + weak metric-learning supervision) that Patch-NetVLAD, CosPlace, MixVPR, and today's foundation-model VPR methods still follow.

## Related

- [Patch NetVLAD](patch-netvlad.md) — multi-scale patch-level successor with spatial re-ranking
- [HF-Net](hf-net.md) — hierarchical localization built on NetVLAD retrieval
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the task in SLAM context
- [SuperPoint](superpoint.md) — the local-feature counterpart in learned localization pipelines

[Back to Level 5](../README.md#level-5-applying-deep-learning)
