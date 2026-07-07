# ZoeDepth
> Bhat 2023 · [Paper](https://arxiv.org/abs/2302.12288)

**One-line summary** — Combines relative-depth pre-training (MiDaS/DPT style) with a lightweight Metric Bins Module to produce zero-shot *metric* depth, giving monocular SLAM a depth prior with absolute scale.

## Problem
Monocular depth research had split into two camps: *relative* depth models (MiDaS, DPT) that generalize across domains but output depth only up to an unknown scale and shift, and *metric* depth models that predict absolute distances but overfit to the single camera/dataset they were trained on. SLAM needs both properties at once — meters, everywhere.

The trap is that naively fine-tuning a strong relative model on metric data destroys the cross-domain robustness gained from multi-dataset relative training; and indoor (~0.1–10 m) versus outdoor (~1–80 m) depth ranges are so different that a single regression head handles neither well.

## Key ideas
- **Relative + metric two-stage training.** Stage 1 pre-trains on many datasets with a scale-shift-invariant relative-depth loss (the MiDaS recipe); stage 2 fine-tunes only a lightweight metric head on metric datasets while keeping the strong generalizing encoder largely intact — adding scale without sacrificing robustness.
- **Metric Bins Module (MBM).** Rather than directly regressing depth, the head adaptively discretizes the depth range into $N$ bins and predicts a per-pixel distribution over them:
  $$\hat{d}(p) = \sum_{i=1}^{N} b_i \cdot \mathrm{softmax}(f(p))_i$$
  where the bin centers $b_i$ are scene-dependent, predicted from the encoder's global features. Adaptive binning turns metric depth into a soft classification problem, which is more stable to train than direct regression.
- **Domain-specific heads + latent router.** Separate metric heads for the indoor and outdoor depth regimes, with a lightweight latent classifier on the encoder features automatically routing each image to the right head at test time — no manual domain selection.
- **What "zero-shot metric" means operationally.** On an image from a camera and scene never seen in training, the router picks a domain head and the bins adapt to the scene — no per-dataset fine-tuning, no manual scale factor. That combination (generalizing encoder + adaptive metric head + automatic routing) is what makes genuine zero-shot deployment possible.
- **Flexible configurations.** The framework admits multiple model configurations depending on which datasets are used for relative pre-training and metric fine-tuning; the flagship ZoeD-M12-NK is pre-trained on 12 datasets using relative depth and fine-tuned on two (NYU Depth v2 and KITTI) using metric depth.
- **Typical SLAM usages of the output.** A zero-shot metric depth map can (a) bootstrap monocular initialization with a correctly scaled first map, (b) densify a sparse feature map into per-pixel geometry, and (c) act as a scale reference against which monocular scale drift is corrected — all uses that relative-depth models cannot serve because their output is only defined up to an affine transform.

## Results & impact
Per the abstract: even without relative pre-training the architecture already improves the state of the art on NYU Depth v2, and with pre-training on twelve datasets plus NYU fine-tuning the improvement totals 21% in relative absolute error (REL). ZoeD-M12-NK is described as "the first model that can jointly train on multiple datasets (NYU Depth v2 and KITTI) without a significant drop in performance," achieving "unprecedented zero-shot generalization" to eight unseen indoor and outdoor datasets.

Its two-stage relative-then-metric paradigm was adopted by successors such as Metric3D, UniDepth, and Depth Anything V2, and the code and pre-trained models are publicly available — making ZoeDepth the first metric-depth network practical to drop into a robotics stack.

## Why it matters for SLAM
Monocular SLAM is scale-ambiguous; relative-depth networks like MiDaS cannot fix that because their output is only defined up to an affine transform. ZoeDepth was the first practical model to deliver metric depth zero-shot across domains, so a single network can supply scale for monocular SLAM initialization, densification, or scale-drift correction. Its relative-then-metric training paradigm was adopted by successors such as Metric3D and Depth Anything V2, making ZoeDepth a key link between the relative-depth foundation models and metric-scale robotics use.

## Related
- [MiDaS](midas.md) — the multi-dataset relative-depth backbone and training recipe.
- [DPT](dpt.md) — the ViT-based dense prediction architecture ZoeDepth builds on.
- [Metric3D](metric3d.md) — alternative canonical-camera route to zero-shot metric depth.
- [Depth Anything](depth-anything.md) — scaling up depth foundation models.
- [Depth from sensor](../level-04-rgbd-slam/depth-from-sensor.md) — what metric depth networks aim to replace or complement.
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md) — the monocular SLAM problem a metric depth prior addresses.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
