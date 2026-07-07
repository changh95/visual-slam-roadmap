# Differentiability

To train a neural network you need gradients flowing from the loss back to the parameters. But classical SLAM is full of operations that block gradients: RANSAC makes a discrete hypothesis selection (argmax), keypoint detection applies non-maximum suppression and top-$k$ selection, and optimization solvers like bundle adjustment are iterative procedures rather than closed-form functions. *Differentiability* research asks: how do we make these classical geometric algorithms differentiable, so a network can be trained *through* them — optimizing for the final pose or map quality rather than for some proxy label?

## Why classical SLAM blocks gradients

Consider the standard relocalization pipeline: a network predicts 2D-3D correspondences, RANSAC samples minimal sets, PnP solves each hypothesis, an inlier count scores them, and the argmax hypothesis wins. Three of those steps are non-differentiable:

- **Hard selection** — argmax over hypotheses has zero gradient almost everywhere (and no gradient at the decision boundary).
- **Hard counting** — an inlier test $[\,e_i < \tau\,]$ is a step function; its derivative is zero wherever it is defined.
- **Iterative solvers** — Gauss-Newton or Levenberg-Marquardt is not one function but a loop whose iteration count varies; naively it has no closed-form Jacobian.

If any link in the chain kills gradients, everything upstream of it must be trained with proxy losses (imitate ground-truth depth, imitate hand-labeled matches) that may not align with what the *system* is supposed to do.

## The main techniques

Each technique is attached to a landmark system, so you can study them concretely:

- **Soft selection instead of argmax (DSAC)**: replace RANSAC's hard hypothesis choice with probabilistic selection. If hypothesis $\mathcal{H}_j$ is chosen with probability $p(\mathcal{H}_j) \propto \text{score}(\mathcal{H}_j)$, the *expected* task loss
  $$\mathbb{E}[\mathcal{L}] = \sum_j p(\mathcal{H}_j)\,\mathcal{L}(\mathcal{H}_j)$$
  is differentiable in the network parameters even though sampling one hypothesis is not. Hard inlier counting is likewise replaced with a smooth surrogate (e.g. a sigmoid of the residual), so hypothesis scores themselves carry gradients.
- **Unrolling the solver (BA-Net, DROID-SLAM)**: a Gauss-Newton step
  $$\Delta\boldsymbol{\xi} = -\left(\mathbf{J}^\top\mathbf{J}\right)^{-1}\mathbf{J}^\top\mathbf{r}$$
  is just matrix products, a linear solve, and a residual evaluation — all differentiable. A *fixed* number of iterations can therefore be unrolled into the computation graph and back-propagated through. BA-Net unrolls bundle adjustment over learned feature maps; DROID-SLAM applies the same idea inside a recurrent update loop, re-linearizing a dense BA layer at every iteration.
- **Implicit differentiation (Theseus)**: rather than back-propagating through every solver iteration (memory-hungry, since all intermediate states must be stored), differentiate the *optimality conditions* at the converged solution $\mathbf{x}^*(\theta)$. From $\nabla_{\mathbf{x}} E(\mathbf{x}^*, \theta) = 0$, the implicit function theorem gives
  $$\frac{d\mathbf{x}^*}{d\theta} = -\left(\nabla^2_{\mathbf{xx}} E\right)^{-1} \nabla^2_{\mathbf{x}\theta} E,$$
  so the gradient depends only on the solution, not the path taken to reach it. Libraries like Theseus provide differentiable nonlinear least squares this way (alongside unrolling and truncated variants).
- **Manifold-aware autodiff (LieTorch)**: poses live on $\mathrm{SE}(3)$, not $\mathbb{R}^{12}$; naive autodiff over matrix entries produces gradients that leave the manifold. LieTorch implements automatic differentiation directly on Lie groups so that gradient steps are taken in the local tangent space, $\mathbf{T} \leftarrow \exp(\boldsymbol{\delta}^\wedge)\,\mathbf{T}$ — the same retraction-based parameterization used by classical state estimation.
- **Reinforcement-learning workarounds (DISK)**: when a step truly cannot be relaxed (e.g. discrete keypoint selection), treat it as a stochastic policy and optimize expected reward with score-function (policy-gradient) estimators, as DISK does for feature detection and matching.

## The payoff: task-level training

The point of all this machinery is *task-level training*: instead of teaching a network to imitate ground-truth depth or hand-labeled matches, you train it so that, after RANSAC/PnP/BA does its job, the final camera pose is accurate. The training objective and the system objective become the same thing. This alignment is why differentiable-geometry systems (the DSAC-to-ACE relocalization line, DROID-SLAM) generalize better than naive end-to-end pose regression like PoseNet — the geometry is still enforced by an exact solver; the network only learns the parts that benefit from learning.

A second payoff is *self-supervision*: with a differentiable projection and solver, a reprojection loss through known camera poses can replace 3D ground truth entirely — the trick that DSAC++ introduced and that the ACE family relies on for minutes-scale mapping.

## Common pitfalls

- **Memory and compute**: unrolled solvers store every intermediate iterate for the backward pass; deep unrolls can exhaust GPU memory. Implicit differentiation or truncated backprop are the standard escapes.
- **Train/test mismatch**: soft relaxations (soft argmax, soft inlier counts) used during training differ from the hard operations used at inference; if the gap is large, the trained network is optimized for the wrong pipeline. Temperature annealing toward the hard operation mitigates this.
- **Gradient pathologies**: gradients through long iterative procedures can vanish or explode, and early in training, gradients from wildly wrong hypotheses can dominate — DSAC-style training is famously sensitive to initialization, which is why successors added pre-training and curricula.
- **Local minima are still local**: making a solver differentiable does not make its landscape convex; the network can learn to *exploit* the solver's basin of convergence, but a bad initialization at test time still fails like classical geometry does.

Much of the engineering in this literature is about managing exactly these issues.

## Why it matters for SLAM

Differentiability is the bridge between the two halves of Level 5: it lets learned front-ends be trained with the geometric back-end in the loop, producing hybrid systems that keep the rigor of classical optimization while learning everything around it. Understanding soft selection, solver unrolling, and Lie-group autodiff will let you read papers from DSAC to DROID-SLAM as variations on one idea.

## Related

- [DSAC](dsac.md)
- [BA-Net](ba-net.md)
- [Theseus](theseus.md)
- [Lietorch](lietorch.md)
- [GradSLAM](gradslam.md)
- [DISK](disk.md)
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md)
