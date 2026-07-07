# Theseus
> Pineda (Meta) 2022 · [Paper](https://arxiv.org/abs/2207.09442)

**One-line summary** — An application-agnostic, open-source PyTorch library for differentiable nonlinear least squares (DNLS), providing the reusable infrastructure that lets neural networks learn *inside* geometric optimization loops such as bundle adjustment.

## Problem
By 2022 several landmark systems (BA-Net, DROID-SLAM, gradSLAM) had shown the power of putting a nonlinear least-squares solver *inside* a network and training through it — but each implementation was hand-rolled for one system. As the paper puts it, existing DNLS implementations "are application specific and do not always incorporate many ingredients important for efficiency": sparse solvers, batching, vectorization, GPU support, and memory-efficient gradient computation were reinvented (or omitted) per project.

Meanwhile the mature classical solvers (Ceres, g2o, GTSAM) had all the efficiency machinery but no way to backpropagate through the solve. Theseus was built to close that gap once, as shared infrastructure for "end-to-end structured learning in robotics and vision."

## Key ideas
- **Differentiable nonlinear least squares as a layer.** The inner problem

  $$\theta^\star(\phi) = \arg\min_\theta \sum_i \|\mathbf{r}_i(\theta; \phi)\|^2$$

  is solved with a second-order optimizer (Gauss-Newton / Levenberg-Marquardt); the solution $\theta^\star$ is a differentiable function of the inputs $\phi$ (network outputs, weights, priors), so an outer task loss $L(\theta^\star(\phi))$ can be minimized by ordinary backpropagation into upstream networks.
- **Application-agnostic building blocks.** Instead of a baked-in BA layer, Theseus exposes the common components — second-order optimizers, standard cost functions, and Lie group types (e.g., $SE(3)$ variables with manifold-aware updates) — from which pose graph optimization, bundle adjustment, motion planning, or state estimation problems can all be assembled. The paper demonstrates several example applications built from the same underlying differentiable components.
- **Efficiency as a first-class concern**: support for sparse linear solvers (exploiting the same Hessian sparsity that classical SLAM back-ends rely on), automatic vectorization, batching across problem instances, and GPU acceleration make DNLS practical at SLAM-scale problem sizes.
- **Memory-efficient gradients.** Backpropagating through a solver can be done three ways:
  - *unrolling* the solver iterations — simple but stores every intermediate state and can be numerically fragile over many iterations;
  - **implicit differentiation** — applying the implicit function theorem at the converged solution, with cost independent of iteration count;
  - **direct loss minimization** — an alternative gradient estimator also supported by the library.

  The latter two decouple backward-pass memory from the number of inner iterations.
- **End-to-end structured learning.** With the optimizer differentiable, one can learn cost-function parameters, sensor noise models / residual weights, robust-loss parameters, and initialization networks directly from data, while keeping the interpretable, well-understood least-squares structure of the estimator.
- **A factor-graph-shaped API.** Usage mirrors classical solvers — declare variables, add cost functions to an objective, wrap it in a solver layer — except the whole thing sits inside a PyTorch graph (sketch):

  ```python
  import theseus as th
  x     = th.Vector(dof=2, name="x")                 # optimization variable
  cost  = th.AutoDiffCostFunction([x], residual_fn, dim=2, aux_vars=[phi])
  obj   = th.Objective(); obj.add(cost)
  layer = th.TheseusLayer(th.GaussNewton(obj))
  sol, info = layer.forward({"x": x_init, "phi": phi_from_network})
  task_loss(sol["x"]).backward()                     # gradients reach the network
  ```

## Results & impact
The paper reports extensive performance evaluation across a set of applications, demonstrating "significant efficiency gains and better scalability" when the sparse-solver, vectorization, batching, GPU, and implicit-differentiation features are incorporated (per the abstract). Published at NeurIPS 2022 and released as open source by Meta AI, Theseus became the standard general-purpose DNLS layer for PyTorch: rather than re-implementing a differentiable BA layer per paper, hybrid SLAM/robotics research can compose one from library primitives.

## Why it matters for SLAM
Classical SLAM back-ends (g2o, Ceres, GTSAM) are highly optimized but not differentiable, while deep networks are differentiable but discard the sparse geometric structure that makes SLAM tractable. Theseus bridges the two: it brings factor-graph-style optimization into PyTorch so that hybrid systems — learned front-end, optimization back-end — can be trained end-to-end. It generalizes the pattern pioneered by BA-Net and DROID-SLAM into shared infrastructure, and is a natural tool when you want to learn residual weights or priors for a VIO/SLAM estimator rather than hand-tune them.

## Related
- [BA-Net](ba-net.md) — differentiable bundle adjustment as a network layer, a direct precursor.
- [Lietorch](lietorch.md) — differentiable Lie group operations in PyTorch, used for the same class of problems.
- [GradSLAM](gradslam.md) — fully differentiable dense SLAM pipeline.
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — end-to-end SLAM system built around a differentiable BA layer.
- [Differentiability](differentiability.md) — the concept underlying all of these systems.
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — the classical problem being made differentiable.

[Back to Level 5](../README.md#level-5-applying-deep-learning)
