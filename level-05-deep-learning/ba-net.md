# BA-Net

> Tang 2019 · [Paper](https://arxiv.org/abs/1806.04807)

**One-line summary** — BA-Net (ICLR 2019) made bundle adjustment a differentiable network layer, solving SfM via feature-metric BA with a learned feature pyramid and a compact basis-depth-map parameterization, trained end-to-end.

## Problem

Traditional SfM pipelines are modular — feature extraction, matching, and bundle adjustment are designed and optimized independently — so the features are never optimized for the geometric estimation task they ultimately serve, and BA cannot benefit from learned priors. The obstacle to unifying them is that BA is an iterative nonlinear least-squares (Levenberg–Marquardt) procedure, not an ordinary differentiable layer. BA-Net asks: can the whole dense SfM problem be solved *through* a differentiable BA layer, so that gradients from the reconstruction loss train the features themselves?

## Key ideas

- **Feature-metric BA.** Instead of minimizing photometric or reprojection error, BA-Net minimizes alignment error in a learned multi-scale feature space produced by a feature pyramid network. Because the whole pipeline is differentiable, the network learns features that make the BA problem itself more tractable — smoother cost surfaces with wider basins of convergence than raw intensities.
- **Differentiable Levenberg–Marquardt layer.** The iterative optimization is unrolled/differentiated so gradients from the final loss flow back through the optimizer into the feature extractor; the implicit function theorem gives the corresponding view of the solution's sensitivity,

  $$\frac{\partial \mathbf{x}^*}{\partial \theta} = -(J^\top J)^{-1} J^\top \frac{\partial \mathbf{r}}{\partial \theta},$$

  where $\mathbf{x}^*$ is the BA solution, $J$ the residual Jacobian, and $\theta$ the network parameters.
- **Basis depth maps.** Dense per-pixel depth is not optimized directly; the network generates a small set of basis depth maps from the image and BA optimizes only their linear combination coefficients,

  $$D(\mathbf{x}) = \sum_{k=1}^{K} c_k \, B_k(\mathbf{x}),$$

  shrinking the depth unknowns from one-per-pixel ($HW$) to $K$ coefficients per keyframe while still recovering dense per-pixel depth. The basis generator is itself learned end-to-end.
- **Domain knowledge + learning.** The architecture hard-codes multi-view geometry constraints (projection, warping, least-squares structure) and learns only what geometry cannot supply: the features and the depth basis — an early, clean statement of the "embed geometry as structure, learn the rest" philosophy.

## Results & impact

- The abstract reports that "experiments on large scale real data prove the success of the proposed method"; the paper's experiments compare against DeMoN and classical two-view SfM baselines on the DeMoN benchmark for depth and pose accuracy.
- The basis-depth parameterization achieves dense reconstruction with orders-of-magnitude fewer optimization variables, and the learned feature-metric objective proved more robust than photometric alignment.
- Its differentiable-optimization-layer recipe became foundational: DROID-SLAM's dense BA layer, DPVO, and general libraries like Theseus all descend from this idea.

## Why it matters for SLAM

BA-Net is the founding paper of "differentiable bundle adjustment": it demonstrated that the classical geometric optimization at the heart of SfM/SLAM can live inside a network and be trained through. This idea became the backbone of DROID-SLAM and DPVO (differentiable dense BA layers) and general differentiable optimization libraries like Theseus, and the low-dimensional optimizable-depth idea is closely related to CodeSLAM-style latent depth codes. If you want to understand modern learned SLAM back-ends, start here.

## Related

- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
- [Theseus](theseus.md)
- [DeMoN](demon.md)
- [CodeSLAM](codeslam.md)
- [DeepV2D](deepv2d.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
