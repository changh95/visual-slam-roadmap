# Theseus
> Pineda (Meta) 2022 · [Paper](https://arxiv.org/abs/2207.09442)

**One-line summary** — An application-agnostic, open-source PyTorch library for differentiable nonlinear least squares (DNLS), providing the reusable infrastructure that lets neural networks learn *inside* geometric optimization loops such as bundle adjustment.

## Key ideas
- **Differentiable nonlinear least squares as a layer**: the solution of a Gauss-Newton / Levenberg-Marquardt solve becomes a differentiable function of its inputs, so gradients flow from a task loss back through the optimizer into upstream networks.
- **Application-agnostic design**: prior DNLS implementations were baked into specific systems (e.g., the BA layer in BA-Net or DROID-SLAM). Theseus factors out the common building blocks — second-order optimizers, standard cost functions, and Lie group types — so any robotics/vision problem can be assembled from the same components.
- **Efficiency features**: sparse linear solvers, automatic vectorization, batching, and GPU acceleration make it practical at SLAM-scale problem sizes.
- **Implicit differentiation and direct loss minimization** for computing gradients through the optimizer, which is more memory-efficient and numerically stable than naively unrolling all inner iterations.
- **End-to-end structured learning**: enables learning cost functions, sensor noise models, robust-loss parameters, and solver hyperparameters directly from data while keeping the well-understood least-squares structure.

## Why it matters for SLAM
Classical SLAM back-ends (g2o, Ceres, GTSAM) are highly optimized but not differentiable, while deep networks are differentiable but discard the sparse geometric structure that makes SLAM tractable. Theseus bridges the two: it brings factor-graph-style optimization into PyTorch so that hybrid systems — learned front-end, optimization back-end — can be trained end-to-end. It generalizes the pattern pioneered by BA-Net and DROID-SLAM into shared infrastructure, and is a natural tool when you want to learn residual weights or priors for a VIO/SLAM estimator rather than hand-tune them.

## Related
- [BA-Net](ba-net.md) — differentiable bundle adjustment as a network layer, a direct precursor.
- [Lietorch](lietorch.md) — differentiable Lie group operations in PyTorch, used for the same class of problems.
- [GradSLAM](gradslam.md) — fully differentiable dense SLAM pipeline.
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — end-to-end SLAM system built around a differentiable BA layer.
- [Differentiability](differentiability.md) — the concept underlying all of these systems.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
