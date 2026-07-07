# Lietorch

> Teed 2021 · [Paper](https://github.com/princeton-vl/lietorch)

**One-line summary** — PyTorch library that implements 3D transformation groups (SO(3), RxSO3, SE(3), Sim(3)) as first-class differentiable tensor types, with backpropagation performed in the tangent space of each group element (paper: "Tangent Space Backpropagation for 3D Transformation Groups", Teed & Deng, CVPR 2021, [arXiv:2103.12032](https://arxiv.org/abs/2103.12032)).

## Problem

Deep networks that estimate or refine camera poses must differentiate through rotations and rigid-body transforms, but these live on curved manifolds, not in flat parameter space. Standard "embedding space" autodiff (differentiating matrix entries or quaternion components) has two failure modes the paper dissects: numerically unstable terms like $\psi / \sin\psi$ whose Taylor-approximation gradients must be hand-tuned per operation, and outright singular gradients — e.g. $\cos^{-1}\big((\mathrm{tr}(X)-1)/2\big)$ in the SO(3) logarithm has an undefined derivative at the identity, so PyTorch3D's matrix logarithm returns NaN gradients there. Before Lietorch, every deep SLAM project re-implemented this manifold machinery by hand.

## Method & architecture

- **Lie groups as tensor types.** `lietorch.SE3` is to SE(3) what `torch.Tensor` is to scalars: a multi-dimensional array of group elements supporting indexing, reshaping, broadcasting, and arbitrary batch shapes. Rotations are stored as unit quaternions; all group operations (Exp, Log, Inv, Mul, Adj, AdjT, Act on points) have both CUDA and C++ kernels and a custom gradient.
- **Tangent-space differentials.** Since a manifold is not closed under addition, the ordinary differential is generalized using the retraction $\xi \oplus X = \operatorname{Exp}(\xi) \circ X$ and its inverse $X \ominus Y = \operatorname{Log}(X \circ Y^{-1})$:

$$Df(X)[\mathbf{v}] = \lim_{t\to 0} \frac{f(t\mathbf{v} \oplus X) \ominus f(X)}{t},$$

  relating perturbations in the tangent space of $X$ to perturbations in the tangent space of $f(X)$. Reverse-mode autodiff then propagates row-vector gradients by the chain rule $\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Y} \mathbf{J}$, where $\mathbf{J}$ is the tangent-space Jacobian — for SO(3) a 3-dimensional gradient instead of autograd's 9-dimensional embedding gradient.
- **Analytic Jacobians per operation.** For group multiplication $Z = X \circ Y$ the backward pass is simply $\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial Z}$ and $\frac{\partial\mathcal{L}}{\partial Y} = \frac{\partial\mathcal{L}}{\partial Z}\,\mathbf{Adj}_X$ (for $R \in SO(3)$, $\mathbf{Adj}_R = R$). For the logarithm map $\phi = \operatorname{Log}(X)$, the BCH formula gives $\frac{\partial\mathcal{L}}{\partial X} = \frac{\partial\mathcal{L}}{\partial\phi}\,\mathbf{J}_l^{-1}(\phi)$, with the inverse left Jacobian $\mathbf{J}_l^{-1}$ in closed form for SO(3)/SE(3); for Sim(3), which has no analytic left Jacobian, the series $\mathbf{J}_l^{-1}(\phi) = \sum_n (-1)^n \frac{B_n}{n!} (\phi^{\curlywedge})^n$ ($B_n$ Bernoulli numbers) is truncated to desired precision. The backward pass is thus as well-behaved as the forward pass — no singular gradients, no tuned Taylor thresholds.
- **Drop-in for deep SLAM.** The target computation graph is exactly the "iterative update" pattern of learned SLAM — a network predicts increments $\delta_k$ applied as $e^{\delta_1}e^{\delta_2}e^{\delta_3}\mathbf{G}_1$, trained with the geodesic loss

$$\mathcal{L}(\mathbf{T}_1,\ldots,\mathbf{T}_K) = \sum_k \|\operatorname{Log}(\mathbf{T}_k^{-1} \cdot \mathbf{T}^{*})\|,$$

  where $\mathbf{T}^{*}$ is the ground-truth pose — a loss the authors note is hard to implement with standard backpropagation.

## Results

- **Inverse kinematics** (1000 runs, convergence within 1000 iterations at $10^{-4}$ tolerance): naive PyTorch+Autograd converges on 0% of problems; hand-tuned Autograd reaches 99.8% (SO(3)) / 100%; Lietorch converges on 100% without any tuning.
- **Pose graph optimization** (Carlone et al. benchmark; Riemannian gradient-descent initialization + 7 Gauss–Newton steps): matches chordal relaxation's globally optimal cost on parking-garage, sphere, torus, and cube, where g2o and GTSAM alone land in poor local minima (e.g. Sphere-A: $1.49\times 10^{6}$ vs g2o's $5.32\times 10^{10}$); on the largest problem (cube, $n{=}8000$, $m{=}22236$) initialization takes 1.21 s vs 17.9 s (chordal+gtsam), 26.4 s (gradient+gtsam) and 18.3 s (Autograd) — a consistent 10–15x speedup over embedding-space Autograd thanks to the simpler GPU backward pass.
- **RGB-D Sim(3) registration** (TartanAir, RAFT-style network + 3 differentiable Gauss–Newton updates per iteration): untuned Autograd yields NaN (0% success); Lietorch reaches about 79% translation / 91% rotation / 98% scale success — the first demonstration of backpropagation through similarity transformations, with 1st/2nd/3rd-order left-Jacobian approximations performing near-identically.
- **RGB-D SLAM** (DeepV2D reimplemented with the geodesic pose loss, trained on NYU+ScanNet): average ATE RMSE on the TUM RGB-D benchmark improves to 0.105 m vs 0.113 m (original DeepV2D) and 0.116 m (DeepTAM).

## Why it matters for SLAM

Every deep SLAM or deep VO system that learns through pose optimization needs derivatives with respect to elements of SE(3), and getting these right by hand is error-prone (NaNs at singularities, off-manifold drift). Lietorch made manifold-correct differentiation a reusable, tested library, and it supplies the pose layers of DROID-SLAM and DPVO among others. Together with Theseus (differentiable nonlinear least squares) it forms the standard toolbox for differentiable geometric optimization in PyTorch.

## Related

- [Theseus](theseus.md) — differentiable nonlinear least squares built on the same needs
- [DROID-SLAM](droid-slam.md) — flagship system built on Lietorch
- [DPVO](dpvo.md) — sparse patch-based successor, also Lietorch-based
- [DeepV2D](deepv2d.md) — the deep RGB-D SLAM system re-trained with Lietorch's geodesic loss
- [Lie groups](../level-02-getting-familiar/lie-groups.md) — the underlying mathematics
- [Differentiability](differentiability.md) — why gradients through geometry matter in deep SLAM
