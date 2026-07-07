# Learned vs hand-crafted

Classical SLAM is a pipeline of hand-designed modules: a corner detector (FAST, Harris), a descriptor (ORB, SIFT), a matcher (nearest neighbor + ratio test), robust estimation (RANSAC), and a nonlinear least-squares back-end. Every one of these components encodes human assumptions — what a "good" feature looks like, what noise distributions to expect, which heuristics reject outliers. Deep learning offers an alternative: let a network learn these functions from data.

## Two very different strategies

There are two ways to apply learning to SLAM, and it is important to keep them apart:

- **Module replacement**: keep the classical pipeline structure, but swap individual hand-crafted modules for learned ones. The system remains interpretable and its geometric back-end (bundle adjustment, pose-graph optimization) is untouched.
- **End-to-end learning**: replace the whole pipeline (or large parts of it) with a network that maps images to poses or maps directly, e.g. DeepVO regressing motion with an LSTM, or DROID-SLAM learning a recurrent update operator around a differentiable bundle-adjustment layer.

## The module-by-module replacement map

Most of Level 5 is organized around which classical module a paper replaces:

| Pipeline stage | Hand-crafted standard | Learned replacement |
|---|---|---|
| Keypoint detection + description | FAST/Harris + ORB/SIFT | SuperPoint, R2D2, DISK, XFeat |
| Matching | nearest neighbor + ratio test | SuperGlue, LightGlue, LoFTR (detector-free) |
| Place recognition | bag-of-words (DBoW) | NetVLAD, Patch-NetVLAD, HF-Net |
| Depth | stereo block matching / depth sensor | MonoDepth, MiDaS, Depth Anything |
| Optical flow | Lucas-Kanade, variational flow | RAFT, SEA-RAFT |
| Relocalization | descriptor matching against a 3D map | PoseNet (regression), DSAC/ACE (scene coordinates) |
| Outlier rejection / solver | RANSAC, Gauss-Newton | DSAC (soft RANSAC), unrolled/implicit BA layers |

Reading a new paper, the first question to ask is: *which row is it, and does it keep the classical back-end?*

## Where each side wins

**Learned modules clearly win** under conditions that break hand-crafted assumptions: severe illumination change, weak texture, motion blur, seasonal or day-night appearance change, and wide-baseline matching. Learned features are trained on exactly this variation, while a hand-crafted descriptor sees only its designer's imagination.

**Classical modules still win** in well-textured, well-lit scenes at high frame rates — ORB is orders of magnitude cheaper to compute; classical geometry gives exact, verifiable solutions with no training-distribution concerns; and failure modes are analyzable. A RANSAC failure can be diagnosed from inlier counts; a network failure is often silent.

**End-to-end pose regression specifically loses** to geometry: a network that regresses pose directly (PoseNet-style) behaves more like image retrieval than like triangulation, and its errors do not shrink with more texture or better calibration the way geometric methods' errors do. This is why the field converged on hybrids — learned perception, geometric estimation.

## Practical rules of thumb

| Question | Leans classical | Leans learned |
|---|---|---|
| Compute budget | Embedded CPU | GPU available |
| Environment | Controlled, textured | Appearance change, low texture |
| Interpretability / certification | Required | Optional |
| Training data for your domain | Scarce | Plentiful |

## Common pitfalls when adopting learned modules

- **Distribution shift**: a matcher trained on outdoor landmarks may underperform indoors; always validate on data from *your* domain, not just the paper's benchmark.
- **Throughput accounting**: papers quote GPU inference times; on a robot the GPU may be shared with other perception tasks, and preprocessing (resizing, normalization) is often the hidden cost.
- **Mixed convention bugs**: learned features come with their own resolutions, score conventions, and sub-pixel behavior; plugging SuperPoint into an ORB-tuned pipeline without re-tuning thresholds (matching, RANSAC, keyframe selection) is a classic source of silent accuracy loss.
- **Evaluation leakage**: some learned modules were trained on the very benchmarks used for evaluation (or their close relatives); check the training set before trusting a comparison.

## The hybrid consensus

In practice, the most successful modern systems are hybrids: learned perception feeding classical geometric optimization (e.g. learned features inside an ORB-SLAM-style pipeline, or DROID-SLAM's learned updates around a classical BA solver). The maximum-likelihood machinery of SLAM is hard to beat with a black box; the perception layers that feed it are where learning pays off first. The [Differentiability](differentiability.md) note covers the technology that lets these two halves be trained together.

## Why it matters for SLAM

Almost every paper in Level 5 is a point on the learned-vs-hand-crafted spectrum, and knowing where a method sits tells you what problem it solves and what it costs. When designing a system, this framing turns "should I use deep learning?" into concrete engineering questions: which module is failing, whether you can afford inference on your platform, and whether the geometry should remain classical.

## Related

- [SuperPoint](superpoint.md)
- [SuperGlue](superglue.md)
- [DeepVO](deepvo.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [Differentiability](differentiability.md)
- [NetVLAD](netvlad.md)
- [Foundation models](foundation-models.md)
