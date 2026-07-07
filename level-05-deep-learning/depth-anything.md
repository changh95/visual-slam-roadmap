# Depth Anything

> Yang 2024 · [Paper](https://arxiv.org/abs/2401.10891)

**One-line summary** — Depth Anything (CVPR 2024) is a foundation model for monocular depth estimation, built by scaling training to ~62M automatically annotated unlabeled images and achieving strong zero-shot generalization to any scene.

## Problem

Supervised monocular depth models plateau because labeled depth data is scarce — on the order of a million-plus images across all public datasets, versus the effectively unlimited pool of unlabeled internet imagery. Depth Anything's stated aim is deliberately unglamorous: "without pursuing novel technical modules", build "a simple yet powerful foundation model dealing with any images under any circumstances" by making large-scale unlabeled data actually useful for depth.

## Key ideas

- **Data engine.** A pipeline collects ~62M diverse unlabeled images and auto-annotates them with pseudo-depth from a teacher model trained on labeled data — enlarging data coverage enough to visibly reduce generalization error.
- **Pseudo-labels alone are not enough.** Naively training a student on teacher pseudo-labels adds little; the student just imitates the teacher. Two strategies unlock the unlabeled data:
- **(1) A more challenging optimization target.** Strong data augmentations (heavy color distortions and spatial perturbations such as CutDepth) corrupt the student's input while the target stays clean, compelling the model "to actively seek extra visual knowledge and acquire robust representations" instead of appearance shortcuts.
- **(2) Semantic auxiliary supervision.** A feature-alignment loss makes the student inherit rich semantic priors from a pre-trained encoder (DINOv2), which helps depth in regions where photometry is ambiguous.
- **Relative first, metric second.** The core model predicts robust affine-invariant *relative* depth in the MiDaS multi-dataset tradition; fine-tuning with metric depth from NYUv2 and KITTI produces metric variants that set new states of the art (abstract).
- **A spectrum of model sizes.** Encoders from small ViTs to large ones let users trade accuracy for speed; the small variant is practical for real-time use.

## Results & impact

- Zero-shot evaluation on six public datasets and randomly captured photos demonstrates "impressive generalization ability"; metric fine-tuning on NYUv2/KITTI set new SOTAs, and the improved depth also yielded a better depth-conditioned ControlNet (abstract).
- Became — with V2 — the default monocular depth backbone plugged into dense SLAM systems, DUSt3R-style pipelines, and video-consistency methods like Align3R.
- Cemented the data-scaling paradigm for geometric perception: more diverse unlabeled data beats more supervised labels — the same lesson foundation models taught NLP and recognition.

## Why it matters for SLAM

Monocular SLAM has long wanted a depth prior that works everywhere — for scale, map density, initialization, and robustness in low-parallax motion. Depth Anything made "just call a depth foundation model" a realistic design choice: a single network that yields plausible dense depth on arbitrary indoor/outdoor imagery, with variants fast enough for real-time front-ends. Modern dense and neural SLAM pipelines increasingly assume such a prior exists.

## Related

- [MiDaS](midas.md)
- [DPT](dpt.md)
- [Depth Anything V2](depth-anything-v2.md)
- [Metric3D](metric3d.md)
- [Marigold](marigold.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
