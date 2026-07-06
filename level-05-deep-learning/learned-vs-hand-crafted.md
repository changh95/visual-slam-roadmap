# Learned vs hand-crafted

Classical SLAM is a pipeline of hand-designed modules: a corner detector (FAST, Harris), a descriptor (ORB, SIFT), a matcher (nearest neighbor + ratio test), robust estimation (RANSAC), and a nonlinear least-squares back-end. Every one of these components encodes human assumptions — what a "good" feature looks like, what noise distributions to expect, which heuristics reject outliers. Deep learning offers an alternative: let a network learn these functions from data.

There are two very different ways to apply learning to SLAM, and it is important to keep them apart:

- **Module replacement**: keep the classical pipeline structure, but swap individual hand-crafted modules for learned ones. Examples: SuperPoint replaces ORB/SIFT detection and description; SuperGlue replaces heuristic matching; MiDaS or Depth Anything provides dense depth where no depth sensor exists; NetVLAD replaces bag-of-words place recognition. The system remains interpretable and its geometric back-end (bundle adjustment, pose-graph optimization) is untouched.
- **End-to-end learning**: replace the whole pipeline (or large parts of it) with a network that maps images to poses or maps directly, e.g. DeepVO regressing motion with an LSTM, or DROID-SLAM learning a recurrent update operator around a differentiable bundle-adjustment layer.

Where do learned modules clearly win? Under conditions that break hand-crafted assumptions: severe illumination change, weak texture, motion blur, seasonal or day-night appearance change, and wide-baseline matching. Learned features are trained on exactly this variation, while a hand-crafted descriptor sees only its designer's imagination. Where do classical modules still win? Well-textured, well-lit scenes at high frame rates — ORB is orders of magnitude cheaper to compute; classical geometry gives exact, verifiable solutions with no training-distribution concerns; and failure modes are analyzable.

A few practical rules of thumb:

| Question | Leans classical | Leans learned |
|---|---|---|
| Compute budget | Embedded CPU | GPU available |
| Environment | Controlled, textured | Appearance change, low texture |
| Interpretability / certification | Required | Optional |
| Training data for your domain | Scarce | Plentiful |

In practice, the most successful modern systems are hybrids: learned perception feeding classical geometric optimization (e.g. learned features inside an ORB-SLAM-style pipeline, or DROID-SLAM's learned updates around a classical BA solver). The maximum-likelihood machinery of SLAM is hard to beat with a black box; the perception layers that feed it are where learning pays off first.

## Why it matters for SLAM

Almost every paper in Level 5 is a point on the learned-vs-hand-crafted spectrum, and knowing where a method sits tells you what problem it solves and what it costs. When designing a system, this framing turns "should I use deep learning?" into concrete engineering questions: which module is failing, whether you can afford inference on your platform, and whether the geometry should remain classical.

## Related

- [SuperPoint](superpoint.md)
- [SuperGlue](superglue.md)
- [DeepVO](deepvo.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [Differentiability](differentiability.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
