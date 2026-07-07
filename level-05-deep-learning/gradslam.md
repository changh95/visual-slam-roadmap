# GradSLAM

> Murthy 2020 · [Paper](https://arxiv.org/abs/1910.10672)

**One-line summary** — A PyTorch framework that poses dense SLAM as a fully differentiable computational graph, so gradients can flow end-to-end through tracking, fusion, and mapping to any learnable component.

## Problem

Blending representation learning with SLAM is an open question because SLAM systems are highly modular and complex. Functionally, SLAM transforms raw sensor inputs into a distribution over the states of the robot and the environment — and if that transformation were expressible as a differentiable function, task-based error signals could be used to learn representations that optimize task performance. But several components of a typical dense SLAM system (ICP association, surfel updates, map raycasting, discrete decisions inside solvers) are non-differentiable, blocking gradients at every seam.

## Key ideas

- **SLAM as a computational graph**: gradSLAM is a methodology for posing full SLAM systems as differentiable computational graphs, unifying gradient-based learning and SLAM — one autograd graph runs from input pixels to the final 3D map.
- **Differentiable trust-region optimizers**: Gauss-Newton / Levenberg-Marquardt-style solvers for camera tracking are made differentiable, so the pose that comes out of optimization still carries gradients back to whatever produced its residuals.
- **Differentiable surface measurement and fusion**: point-cloud, surfel, and TSDF-style map construction and update steps are re-implemented as smooth operations — without sacrificing accuracy relative to their classical counterparts.
- **Differentiable raycasting**: rendering the map back into a camera for frame-to-model tracking is also differentiable, closing the loop from 3D maps back to 2D pixels.
- **Multiple dense SLAM back-ends**: the framework wraps differentiable analogues of PointFusion, KinectFusion-style ICP odometry, and ElasticFusion, so complete pipelines — not just isolated layers — are trainable.
- **Task-driven learning**: with autodiff through the whole system, one can learn depth priors, sensor noise models, or cost functions from task-level losses ("backprop all the way from 3D maps to 2D pixels") instead of per-frame labels.

## Results & impact

- Demonstrated that dense SLAM pipelines can be made differentiable end-to-end without sacrificing accuracy, validating the "SLAM as a layer" idea with runnable code rather than a slogan.
- The open-source PyTorch library became a common starting point for differentiable robot perception research and a reference for later differentiable-optimization tooling (Theseus, LieTorch continue the theme with different scope).
- Its conceptual framing — supervision from downstream mapping quality rather than per-frame labels — recurs across learned SLAM work.

## Why it matters for SLAM

GradSLAM was the first general differentiable SLAM framework, turning "SLAM as a layer" from a slogan into runnable research code. It sits in the same movement as BA-Net, Theseus, and LieTorch — embedding geometric optimization inside networks — and it opened the door to training perception modules with supervision that comes from downstream mapping quality rather than per-frame labels. It remains a common starting point for differentiable robot perception research.

## Related

- [Differentiability](differentiability.md) — why differentiable geometric pipelines matter
- [BA-Net](ba-net.md) — differentiable bundle adjustment as a network layer
- [Theseus](theseus.md) — general differentiable nonlinear least squares library
- [Lietorch](lietorch.md) — differentiable Lie group operations in PyTorch
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md) — one of the classical dense systems gradSLAM differentiates
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md) — the TSDF-fusion lineage it re-implements differentiably

[Back to Level 5](../README.md#level-5-applying-deep-learning)
