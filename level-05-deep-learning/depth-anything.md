# Depth Anything

> Yang 2024 · [Paper](https://arxiv.org/abs/2401.10891)

**One-line summary** — Depth Anything (CVPR 2024) is a foundation model for monocular depth estimation, built by scaling training to ~62M automatically annotated unlabeled images and achieving strong zero-shot generalization to any scene.

## Key ideas

- Supervised depth models plateau because labeled depth data is scarce; Depth Anything's answer is a **data engine** that collects large-scale unlabeled internet images (~62M) and auto-annotates them with pseudo-depth from a teacher model, drastically enlarging data coverage.
- Naively adding pseudo-labels helps little; two strategies make data scaling work: (1) a **more challenging optimization target** — strong data augmentations (color perturbation, CutMix-style operations) force the student to seek robust representations beyond appearance shortcuts; (2) **auxiliary semantic supervision** — a feature-alignment loss makes the model inherit rich semantic priors from a pre-trained encoder (DINOv2).
- Trained for robust *relative* (affine-invariant) depth, following the MiDaS multi-dataset philosophy; fine-tuning with metric labels yields metric-depth variants.
- Evaluated zero-shot on six public datasets and random photos, showing impressive generalization; model sizes scale down to variants practical for real-time use.

## Why it matters for SLAM

Monocular SLAM has long wanted a depth prior that works everywhere — for scale, map density, initialization, and robustness in low-parallax motion. Depth Anything made "just call a depth foundation model" a realistic design choice, and it (with V2) quickly became the default depth backbone plugged into dense SLAM, DUSt3R-style pipelines, and video-consistency methods like Align3R. It also cemented the data-scaling paradigm for geometric perception: more diverse unlabeled data beats more supervised labels.

## Related

- [MiDaS](midas.md)
- [DPT](dpt.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Metric3D](metric3d.md)
- [Marigold](marigold.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
