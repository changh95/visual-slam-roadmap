# DeMoN

> Ummenhofer 2017 · [Paper](https://arxiv.org/abs/1612.02401)

**One-line summary** — DeMoN (CVPR 2017) formulated two-view structure-from-motion as a learning problem: a stacked encoder-decoder network jointly estimates depth and camera motion from an unconstrained image pair, learning correspondence implicitly.

## Problem

Classical two-view SfM chains together feature detection, matching, essential-matrix estimation, triangulation, and refinement — a multi-step pipeline sensitive to feature quality that fails on textureless or repetitive scenes. Single-image depth networks avoid matching entirely but generalize poorly outside their training distribution because they rely purely on appearance priors. DeMoN formulates structure from motion itself as a learning problem: train a network end-to-end to compute depth and camera motion from successive, *unconstrained* image pairs.

## Key ideas

- **One network for depth + egomotion.** An end-to-end convolutional network takes two images and outputs depth and relative camera motion — no feature detection, matching, or triangulation modules anywhere.
- **Stacked encoder-decoders with iteration.** The architecture is composed of multiple stacked encoder-decoder networks; the core part is an **iterative network** that repeatedly improves its own depth and motion predictions — an early form of the learned iterative refinement that later defines RAFT-style systems.
- **Auxiliary tasks force matching.** Besides depth and motion, the network predicts surface normals, optical flow between the images, and matching confidence. Predicting flow in particular forces the network to learn the *concept of matching* rather than relying on single-image cues.
- **Scale-invariant gradient loss.** A training loss based on spatial relative differences sharpens depth discontinuities and improves robustness compared to naive per-pixel regression losses.
- **Matching ⇒ generalization.** Because it learns correspondence rather than memorized appearance, DeMoN "better generalizes to structures not seen during training" than depth-from-single-image networks — the paper's central empirical lesson.

## Results & impact

- Per the abstract, results are "more accurate and more robust" than traditional two-frame structure-from-motion baselines, and it copes with textureless regions and repetitive patterns where classical feature matching fails.
- Established the widely used DeMoN benchmark (a mix of SUN3D, RGB-D, and MVS-style data) on which BA-Net, DeepV2D, and later two-view methods were compared.
- Its ancestry runs straight to the present: iterative refinement influenced BA-Net and DeepV2D, and its two-view unconstrained setting is exactly what DUSt3R revisits in the foundation-model era.

## Why it matters for SLAM

DeMoN is the ancestor of the "feed the network two images, get geometry out" family. It demonstrated that learned two-view geometry needs matching, not just recognition — a lesson that still shapes front-end design — and it defined the joint depth-and-motion problem that modern feed-forward reconstruction models (DUSt3R, MASt3R) now solve at foundation-model scale.

## Related

- [BA-Net](ba-net.md)
- [DeepV2D](deepv2d.md)
- [SfM-Learner](sfm-learner.md)
- [FlowNet](flownet.md)
- [DUSt3R](../level-03-monocular-slam/dust3r.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
