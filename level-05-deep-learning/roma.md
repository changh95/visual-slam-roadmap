# RoMa

> Edstedt 2024 · [Paper](https://arxiv.org/abs/2305.15404)

**One-line summary** — Robust dense feature matching that fuses frozen DINOv2 foundation-model features (robust but coarse) with fine-grained ConvNet features (precise but narrow) in a coarse-to-fine match decoder.

## Problem

Dense feature matching — estimating *all* correspondences between two images of a 3D scene — must work under challenging real-world changes: extreme viewpoint shifts, day/night, seasons. Local features trained from scratch on matching data are spatially precise but brittle under such changes; frozen foundation-model features (DINOv2) are significantly more robust thanks to massive pre-training, but inherently coarse (patch-level resolution).

RoMa addresses how to get foundation-level robustness *and* sub-pixel precision in one dense matcher — and how to train it with a loss that respects the different error regimes of coarse global matching and fine refinement.

## Key ideas

- **Robustness vs. precision, resolved by fusion**: Frozen DINOv2 features carry semantic priors that survive extreme appearance change but live at coarse resolution (1/14); a specialized trainable ConvNet supplies precisely localizable fine features at high resolution. Together they form a feature pyramid with the right property at each level.
- **Frozen means frozen**: The DINOv2 backbone is never fine-tuned — its generalization comes precisely from *not* specializing it to the matching data, so all task adaptation lives in the ConvNet and the match decoder.
- **Transformer match decoder with anchor probabilities**: The coarse stage predicts *anchor probabilities* — a probability distribution over candidate match locations rather than a single point estimate — so multimodal ambiguity (repetitive structure, symmetric facades) is represented instead of averaged into a meaningless midpoint.
- **Coarse-to-fine refinement**: Coarse matches from the DINOv2 level are refined to sub-pixel accuracy through the ConvNet feature pyramid using local correlation, producing a dense warp between the images.
- **Regression-by-classification + robust regression loss**: The coarse global matching is trained as classification over discretized locations (which tolerates multimodality), followed by robust regression for refinement — a loss design matched to the two stages' distinct error regimes.
- **Per-match certainty**: A predicted confidence lets downstream pose solvers filter unreliable correspondences before RANSAC, which is essential when the matcher outputs a match for *every* pixel.

## Results & impact

- Set a new state of the art in dense feature matching, with a 36% improvement on the extremely challenging WxBS benchmark (wide multi-nuisance baseline pairs).
- State-of-the-art two-view pose estimation on MegaDepth-1500 (outdoor) and ScanNet-1500 (indoor), with the biggest gains on extreme viewpoint/appearance change where sparse and from-scratch methods fail.
- Established the "frozen foundation features for robust coarse anchors + specialized features for precision" paradigm now common across matching and reconstruction pipelines, and directly spawned RoMa v2.

## Why it matters for SLAM

RoMa demonstrated that frozen foundation-model features dramatically improve matching robustness — establishing the "foundation features for coarse anchors + specialized features for precision" paradigm. For SLAM this matters most in relocalization and loop closure under severe appearance change (day/night, seasons), where sparse hand-crafted or even learned keypoints fail. Dense RoMa-style matchers now back several modern reconstruction and localization pipelines.

## Related

- [RoMa v2](roma-v2.md) — the harder-better-faster-denser successor
- [LoFTR](loftr.md) — earlier detector-free Transformer matching
- [DeDoDe](dedode.md) — same group; decoupled detection/description, also DINOv2-based
- [Foundation models](foundation-models.md) — why frozen pre-trained features generalize
- [MASt3R](../level-03-monocular-slam/mast3r.md) — dense matching fused with 3D reconstruction

[Back to Level 5](../README.md#level-5-applying-deep-learning)
