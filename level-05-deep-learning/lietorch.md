# Lietorch

> Teed 2021 · [Paper](https://github.com/princeton-vl/lietorch)

**One-line summary** — PyTorch library that implements 3D transformation groups (SO(3), SE(3), Sim(3)) as first-class differentiable tensor types, with backpropagation performed in the tangent space of the group.

## Key ideas

- **Lie groups as tensor types**: Group elements behave like PyTorch tensors with overloaded operators — composition, inversion, exponential/logarithm maps, and action on 3D points — so pose-manipulating code reads naturally and stays autograd-compatible.
- **Tangent-space backpropagation**: Gradients are computed in the local (tangent-space) coordinates of the manifold rather than naively differentiating matrix or quaternion entries, so updates respect the group structure instead of drifting off the manifold. Introduced in the accompanying paper "Tangent Space Backpropagation for 3D Transformation Groups" (Teed and Deng).
- **Batched GPU kernels**: CUDA implementations of group operations make large batches of pose transformations fast enough for training-time use.
- **Drop-in for deep SLAM**: Provides exactly the machinery needed to embed iterative pose updates ($\xi \in \mathfrak{se}(3)$ increments applied via $\exp$) inside a network.

## Why it matters for SLAM

Every deep SLAM or deep VO system that learns through pose optimization needs derivatives with respect to elements of SE(3), and getting these right by hand is error-prone. Lietorch made manifold-correct differentiation a reusable library, and it powers the pose layers of DROID-SLAM and DPVO among others. Together with Theseus it forms the standard toolbox for differentiable geometric optimization in PyTorch.

## Related

- [Theseus](theseus.md) — differentiable nonlinear least squares built on the same needs
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — flagship system built on Lietorch
- [DPVO](../level-03-monocular-slam/dpvo.md) — sparse patch-based successor, also Lietorch-based
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the underlying mathematics

[Back to Level 5](../README.md#level-5-applying-deep-learning)
