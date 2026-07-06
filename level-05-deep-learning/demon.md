# DeMoN

> Ummenhofer 2017 · [Paper](https://arxiv.org/abs/1612.02401)

**One-line summary** — DeMoN (CVPR 2017) formulated two-view structure-from-motion as a learning problem: a stacked encoder-decoder network jointly estimates depth and camera motion from an unconstrained image pair, learning correspondence implicitly.

## Key ideas

- End-to-end network computes **depth and egomotion from two successive, unconstrained images** — no feature detection, matching, essential-matrix estimation, or triangulation modules.
- Architecture: multiple stacked encoder-decoder networks; the core is an **iterative network** that repeatedly refines its own depth and motion predictions.
- Beyond depth and motion, the network predicts surface normals, optical flow between the images, and matching confidence — the auxiliary tasks (especially flow) force it to learn the concept of correspondence.
- A training loss based on spatial relative differences (gradient-based) sharpens depth discontinuities and improves robustness.
- Because it learns matching rather than single-image priors, DeMoN generalizes to structures unseen during training far better than depth-from-single-image networks, and is more accurate and robust than classical two-frame SfM baselines.

## Why it matters for SLAM

DeMoN is the ancestor of the "feed the network two images, get geometry out" family: its iterative refinement influenced BA-Net, DeepV2D, and ultimately DROID-SLAM, while its two-view unconstrained setting is exactly what DUSt3R revisits in the foundation-model era. It also established the DeMoN benchmark used to compare learned depth-and-motion methods. Conceptually, it demonstrated that learned two-view geometry needs matching, not just recognition — a lesson that still shapes front-end design.

## Related

- [BA-Net](ba-net.md)
- [DeepV2D](deepv2d.md)
- [SfM-Learner](sfm-learner.md)
- [FlowNet](flownet.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
