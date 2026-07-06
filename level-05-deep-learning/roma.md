# RoMa

> Edstedt 2024 · [Paper](https://arxiv.org/abs/2305.15404)

**One-line summary** — Robust dense feature matching that fuses frozen DINOv2 foundation-model features (robust but coarse) with fine-grained ConvNet features (precise but narrow) in a coarse-to-fine match decoder.

## Key ideas

- **Robustness vs. precision tension**: Foundation features (DINOv2) carry semantic priors from massive pre-training and survive extreme appearance change, but live at coarse resolution (1/14). Specialized ConvNet features are spatially precise but brittle across wide baselines. RoMa uses both.
- **Coarse Transformer match decoder**: Cross-attention over DINOv2 features of the two images produces a coarse warp — and outputs a *probability distribution* over match locations rather than a point estimate, so multimodal ambiguity (repetitive structure) is represented instead of averaged away.
- **Fine-grained refinement**: Coarse matches are refined to sub-pixel accuracy with local correlation on the trainable ConvNet features.
- **Per-match certainty**: A predicted confidence allows downstream filtering of unreliable correspondences before pose estimation.
- State-of-the-art two-view pose estimation on MegaDepth-1500 and ScanNet-1500, with the biggest gains on extreme viewpoint/appearance change.

## Why it matters for SLAM

RoMa demonstrated that frozen foundation-model features dramatically improve matching robustness — establishing the "foundation features for coarse anchors + specialized features for precision" paradigm. For SLAM this matters most in relocalization and loop closure under severe appearance change (day/night, seasons), where sparse hand-crafted or even learned keypoints fail. Dense RoMa-style matchers now back several modern reconstruction and localization pipelines.

## Related

- [RoMa v2](roma-v2.md) — the harder-better-faster-denser successor
- [LoFTR](loftr.md) — earlier detector-free Transformer matching
- [DeDoDe](dedode.md) — same group; decoupled detection/description, also DINOv2-based
- [Foundation models](foundation-models.md) — why frozen pre-trained features generalize

[Back to Level 5](../README.md#level-5-applying-deep-learning)
