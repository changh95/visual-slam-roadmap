# GradSLAM

> Murthy 2020 · [Paper](https://arxiv.org/abs/1910.10672)

**One-line summary** — A PyTorch framework that poses dense SLAM as a fully differentiable computational graph, so gradients can flow end-to-end through tracking, fusion, and mapping to any learnable component.

## Key ideas

- **Differentiable everything**: classical dense SLAM contains many non-differentiable pieces (ICP association, surfel updates, discrete map operations); gradSLAM re-implements them as smooth, autograd-friendly PyTorch ops.
- **Differentiable optimizers**: Gauss-Newton and Levenberg-Marquardt solvers for camera tracking are unrolled so their outputs carry gradients back to the inputs.
- **Differentiable surface measurements and maps**: point cloud, surfel, and TSDF representations are built from differentiable operations.
- **Multiple SLAM backends**: wraps differentiable analogues of PointFusion, KinectFusion-style ICP, and ElasticFusion, so a full pipeline from images to a map is one computational graph.
- **Task-driven learning**: with autodiff through the whole system, one can learn depth priors, sensor noise models, or cost functions from task-level losses instead of hand-tuning them.

## Why it matters for SLAM

GradSLAM was the first general differentiable SLAM framework, turning "SLAM as a layer" from a slogan into runnable research code. It sits in the same movement as BA-Net, Theseus, and LieTorch — embedding geometric optimization inside networks — and it opened the door to training perception modules with supervision that comes from downstream mapping quality rather than per-frame labels. It remains a common starting point for differentiable robot perception research.

## Related

- [Differentiability](differentiability.md) — why differentiable geometric pipelines matter
- [BA-Net](ba-net.md) — differentiable bundle adjustment as a network layer
- [Theseus](theseus.md) — general differentiable nonlinear least squares library
- [Lietorch](lietorch.md) — differentiable Lie group operations in PyTorch
- [ElasticFusion](../level-04-rgbd-slam/elasticfusion.md) — one of the classical dense systems gradSLAM differentiates

[Back to Level 5](../README.md#level-5-applying-deep-learning)
