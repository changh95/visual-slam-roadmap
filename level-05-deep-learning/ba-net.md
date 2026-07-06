# BA-Net

> Tang 2019 · [Paper](https://arxiv.org/abs/1806.04807)

**One-line summary** — BA-Net (ICLR 2019) made bundle adjustment a differentiable network layer, solving SfM via feature-metric BA with a learned feature pyramid and a compact basis-depth-map parameterization, trained end-to-end.

## Key ideas

- **Feature-metric BA**: instead of minimizing photometric or reprojection error, BA-Net minimizes error in a learned multi-scale feature space (from a feature pyramid network). Because the whole pipeline is differentiable, the network learns features that make the BA problem itself more tractable (smoother, wider basin of convergence).
- **Differentiable Levenberg-Marquardt layer**: the iterative nonlinear least-squares optimization is unrolled/differentiated so gradients from the final reconstruction loss flow back through the optimizer into the feature extractor.
- **Basis depth maps**: dense per-pixel depth is not optimized directly; the network generates a small set of basis depth maps and BA optimizes only their linear combination coefficients, reducing the depth variables from one-per-pixel to a handful per keyframe:

  $$D(\mathbf{x}) = \sum_{k=1}^{K} c_k \, B_k(\mathbf{x})$$

- The system elegantly combines hard-coded domain knowledge (multi-view geometry constraints) with deep learning (feature and depth-basis learning) in a single end-to-end trainable architecture.

## Why it matters for SLAM

BA-Net is the founding paper of "differentiable bundle adjustment": it demonstrated that the classical geometric optimization at the heart of SfM/SLAM can live inside a network and be trained through. This idea became the backbone of DROID-SLAM and DPVO (differentiable dense BA layers), general libraries like Theseus, and the low-dimensional optimizable-depth idea is closely related to CodeSLAM-style latent depth codes. If you want to understand modern learned SLAM back-ends, start here.

## Related

- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [Theseus](theseus.md)
- [DeMoN](demon.md)
- [CodeSLAM](codeslam.md)
- [DeepV2D](deepv2d.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
