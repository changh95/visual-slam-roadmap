# ZoeDepth
> Bhat 2023 · [Paper](https://arxiv.org/abs/2302.12288)

**One-line summary** — Combines relative-depth pre-training (MiDaS/DPT style) with a lightweight Metric Bins Module to produce zero-shot *metric* depth, giving monocular SLAM a depth prior with absolute scale.

## Key ideas
- **Relative + metric two-stage training**: stage 1 pre-trains on many datasets with a scale-shift-invariant relative-depth loss (the MiDaS recipe); stage 2 fine-tunes a lightweight metric head on metric datasets while keeping the strong generalizing encoder largely intact. This avoids the classic trap where fine-tuning for metric depth destroys cross-domain robustness.
- **Metric Bins Module (MBM)**: rather than directly regressing depth, the head adaptively discretizes the depth range into bins and predicts a per-pixel distribution over them: $\hat{d}(p) = \sum_{i=1}^{N} b_i \cdot \text{softmax}(f(p))_i$, with scene-dependent bin centers $b_i$. Adaptive binning is more stable than direct metric regression.
- **Domain-specific heads + latent router**: separate metric heads for indoor (~0.1–10 m) and outdoor (~1–80 m) depth ranges, with a lightweight latent classifier automatically routing each image to the right head at test time — no manual domain selection.
- **Zero-shot metric transfer**: the flagship ZoeD-M12-NK model (pre-trained on 12 datasets, fine-tuned on NYU + KITTI) generalizes to unseen datasets while keeping absolute scale.

## Why it matters for SLAM
Monocular SLAM is scale-ambiguous; relative-depth networks like MiDaS cannot fix that because their output is only defined up to an affine transform. ZoeDepth was the first practical model to deliver metric depth zero-shot across domains, so a single network can supply scale for monocular SLAM initialization, densification, or scale-drift correction. Its relative-then-metric training paradigm was adopted by successors such as Metric3D and Depth Anything V2, making ZoeDepth a key link between the relative-depth foundation models and metric-scale robotics use.

## Related
- [MiDaS](midas.md) — the multi-dataset relative-depth backbone and training recipe.
- [DPT](dpt.md) — the ViT-based dense prediction architecture ZoeDepth builds on.
- [Metric3D](metric3d.md) — alternative canonical-camera route to zero-shot metric depth.
- [Depth Anything](depth-anything.md) — scaling up depth foundation models.
- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — what metric depth networks aim to replace or complement.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
