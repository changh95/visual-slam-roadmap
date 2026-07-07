# Lietorch

> Teed 2021 · [Paper](https://github.com/princeton-vl/lietorch)

**One-line summary** — PyTorch library that implements 3D transformation groups (SO(3), SE(3), Sim(3)) as first-class differentiable tensor types, with backpropagation performed in the tangent space of the group.

## Problem

Deep networks that estimate or refine camera poses must differentiate through rotations and rigid-body transforms, but these live on curved manifolds, not in flat parameter space: naively backpropagating through matrix entries or quaternion components produces gradients that push estimates off the manifold and destabilize training. Before Lietorch, every deep SLAM project re-implemented this manifold machinery by hand — an error-prone exercise in Lie-group calculus and CUDA.

## Key ideas

- **Lie groups as tensor types**: Group elements behave like PyTorch tensors with overloaded operators — composition, inversion, exponential/logarithm maps, and action on 3D points — so pose-manipulating code reads naturally and stays autograd-compatible.
- **Tangent-space backpropagation**: Gradients are computed in the local (tangent-space) coordinates of the manifold rather than by naively differentiating matrix or quaternion entries, so updates respect the group structure instead of drifting off the manifold. Introduced in the accompanying paper "Tangent Space Backpropagation for 3D Transformation Groups" (Teed and Deng).
- **Batched GPU kernels**: CUDA implementations of the group operations make large batches of pose transformations fast enough for training-time use.
- **Drop-in for deep SLAM**: Provides exactly the machinery needed to embed iterative pose updates ($\xi \in \mathfrak{se}(3)$ increments applied via $\exp$) inside a network's forward pass, as done in differentiable bundle adjustment layers.

## Results & impact

Lietorch's practical impact is best measured by adoption: it supplies the pose layers of DROID-SLAM and DPVO, and it turned manifold-correct differentiation from a per-project liability into a reusable, tested library. Together with Theseus (differentiable nonlinear least squares), it forms the standard toolbox for differentiable geometric optimization in PyTorch.

## Why it matters for SLAM

Every deep SLAM or deep VO system that learns through pose optimization needs derivatives with respect to elements of SE(3), and getting these right by hand is error-prone. Lietorch made manifold-correct differentiation a reusable library, and it powers the pose layers of DROID-SLAM and DPVO among others. Together with Theseus it forms the standard toolbox for differentiable geometric optimization in PyTorch.

## Related

- [Theseus](theseus.md) — differentiable nonlinear least squares built on the same needs
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — flagship system built on Lietorch
- [DPVO](../level-03-monocular-slam/dpvo.md) — sparse patch-based successor, also Lietorch-based
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the underlying mathematics
- [Differentiability](differentiability.md) — why gradients through geometry matter in deep SLAM

[Back to Level 5](../README.md#level-5-applying-deep-learning)
