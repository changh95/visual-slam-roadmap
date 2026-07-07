# Theseus

> Pineda (Meta) 2022 · [Paper](https://arxiv.org/abs/2207.09442)

**One-line summary** — An application-agnostic, open-source PyTorch library for differentiable nonlinear least squares (DNLS), providing the reusable infrastructure that lets neural networks learn *inside* geometric optimization loops such as bundle adjustment.

## Problem

By 2022 several landmark systems (BA-Net, DROID-SLAM, gradSLAM) had shown the power of putting a nonlinear least-squares solver *inside* a network and training through it — but each implementation was hand-rolled for one system. As the paper puts it, existing DNLS implementations "are application specific and do not always incorporate many ingredients important for efficiency": sparse solvers, batching, vectorization, GPU support, and memory-efficient gradient computation were reinvented (or omitted) per project, and prior DNLS work supported only unrolling for gradients. Meanwhile mature classical solvers (Ceres, g2o, GTSAM) had the efficiency machinery but no way to backpropagate through the solve. Theseus closes that gap once, as shared infrastructure for "end-to-end structured learning in robotics and vision."

## Method & architecture

**DNLS as a bilevel optimization.** The inner problem is nonlinear least squares over manifold-valued variables $\theta = \{\theta_j\}$ (Euclidean vectors or Lie groups), with residuals factored into weights and costs, $r_i(\theta^i) = w_i c_i(\theta^i)$:

$$\theta^{\star} = \operatorname*{arg\,min}_{\theta} S(\theta), \qquad S(\theta) = \frac{1}{2}\sum_i \|w_i c_i(\theta^i)\|^2 .$$

It is solved by iteratively linearizing: solve $\big(\textstyle\sum_i J_i^{\top}J_i\big)\,\delta\theta = \textstyle\sum_i J_i^{\top} r_i$ with $J_i = \partial r_i / \partial\theta^i$, then retract $\theta \leftarrow \theta - \delta\theta$ (Gauss–Newton; LM with adaptive damping and Dogleg are also provided). Any upstream network parameters $\phi$ may enter the costs, weights, or initialization, giving the bilevel setup

$$\text{inner:}\;\; \theta^{\star}(\phi) = \operatorname*{arg\,min}_{\theta} S(\theta;\phi), \qquad \text{outer:}\;\; \phi^{\star} = \operatorname*{arg\,min}_{\phi} L(\theta^{\star}(\phi)),$$

where the outer loop is ordinary gradient descent using $\partial\theta^{\star}/\partial\phi$ through the solver.

**API (factor-graph shaped).** `Variable` (optimization or auxiliary tensors), `CostFunction` ($c_i$; library-provided with analytical Jacobians — Gaussian measurements, reprojection, relative pose, motion models, collision — or in-place `AutoDiffCostFunction`), `CostWeight` ($w_i$, incl. robust losses), `Objective` ($S$), `Optimizer`, and `TheseusLayer`, whose `forward` maps input tensors to optimal variable values inside any PyTorch graph. Differentiable Lie groups compute exp/log, inverse, and composition in closed form with analytical tangent-space derivatives, plus a projection operator so autograd gradients map correctly to the tangent space (contrasting with LieTorch's per-operation custom kernels); differentiable forward kinematics wraps Differentiable Robot Model.

**Efficiency machinery.** (i) Two levels of parallelism — native batching of DNLS problems and automatic vectorization of same-type cost operations (SIMD-style). (ii) End-to-end differentiable *sparse* linear solvers replacing PyTorch's dense Cholesky: CHOLMOD (CPU), cudaLU (cuSolverRF-based batched LU on GPU), and BaSpaCho, a novel open-source batched supernodal sparse Cholesky with GPU support whose sparse elimination removes the need for an external Schur-complement trick. Backward through a linear solve $y = A^{-1}b$ uses implicit differentiation, $\partial f/\partial b = A^{-1}\,\partial f/\partial y$ and $\partial f/\partial A = -A^{-1}(\partial f/\partial y)\,y^{\top}$, with cached factorizations making backward faster than forward.

**Four backward modes.** Unrolling (backprop through solver iterations — compute/memory grow linearly, vanishing-gradient risk); truncated differentiation (TBPTT, biased); **implicit differentiation** via the implicit function theorem applied to the optimality condition $g(\theta;\phi) := \nabla_{\theta} S(\theta;\phi) = 0$:

$$\mathrm{D}_{\phi}\theta^{\star}(\bar{\phi}) = -\mathrm{D}_{\theta}^{-1} g\big(\theta^{\star}(\bar{\phi});\bar{\phi}\big)\, \mathrm{D}_{\phi} g\big(\theta^{\star}(\bar{\phi});\bar{\phi}\big),$$

computed in practice by differentiating a single Newton step $h(\theta;\phi) = \theta - [\nabla^2_{\theta}S]^{-1}_{\text{stop}}\nabla_{\theta}S$ at the solution; and direct loss minimization (DLM), a finite-difference vector-Jacobian-product scheme using a loss-augmented inner solve. Implicit and DLM have cost independent of iteration count.

**Example applications** built from the same components: pose graph optimization (learning a Welsch robust-kernel radius), tactile state estimation (learning a tactile-image-to-relative-pose network end-to-end), bundle adjustment (learning an outlier soft-kernel radius), motion planning (differentiable GPMP2 with a learned initialization model), and feature-metric homography estimation (training a CNN for robust alignment features).

## Results

- **Sparse vs dense (PGO, synthetic Cube dataset, V100 32 GB, 10 inner iterations / 20 outer epochs, implicit mode):** PyTorch's dense solver runs out of memory beyond 256 poses at batch size 128, where its forward+backward time is already 20.81 s vs 10.96 s (CHOLMOD), 2.86 s (cudaLU), and 2.25 s (BaSpaCho). BaSpaCho scales to 2048 poses, cudaLU to 4096, and CHOLMOD to 8192 poses at batch 256; BaSpaCho outperforms dense at every scale, up to an order of magnitude faster.
- **vs Ceres (batched PGO, 10 iterations, 256 problems):** Ceres wins at small scale (25x faster at 256 poses, batch 16), but at 2048 poses / batch 256 BaSpaCho is about 23x faster than Ceres and the other sparse solvers about 4x; the abstract headlines "up to 20x" forward-pass speedup from batching + vectorization + sparsity.
- **Backward modes (tactile state estimation, 100 epochs):** unrolling's backward time and memory grow linearly with inner iterations (roughly 34 MB to 262 MB), while implicit/DLM stay constant at about 28–29 MB; implicit differentiation also achieved the best validation loss, making it the recommended default.
- Automatic vectorization gives significant forward/backward speedups on PGO at the cost of up to ~82% (forward) / ~55% (backward) more memory.

## Why it matters for SLAM

Classical SLAM back-ends (g2o, Ceres, GTSAM) are highly optimized but not differentiable, while deep networks are differentiable but discard the sparse structure that makes SLAM tractable. Theseus bridges the two: it brings factor-graph-style optimization into PyTorch so hybrid systems — learned front-end, optimization back-end — can be trained end-to-end on the true task loss. It generalizes the pattern pioneered by BA-Net and DROID-SLAM into shared infrastructure, and is the natural tool for learning residual weights, robust kernels, or initialization networks for a VIO/SLAM estimator rather than hand-tuning them.

## Related

- [BA-Net](ba-net.md) — differentiable bundle adjustment as a network layer, a direct precursor.
- [Lietorch](lietorch.md) — differentiable Lie group operations in PyTorch, used for the same class of problems.
- [GradSLAM](gradslam.md) — fully differentiable dense SLAM pipeline.
- [DROID-SLAM](droid-slam.md) — end-to-end SLAM system built around a differentiable BA layer.
- [Differentiability](differentiability.md) — the concept underlying all of these systems.
- [MAP inference as sparse nonlinear least squares](../level-02-getting-familiar/map-inference-as-sparse-nonlinear-least-squares.md) — the classical problem being made differentiable.
