# Differentiability

To train a neural network you need gradients flowing from the loss back to the parameters. But classical SLAM is full of operations that block gradients: RANSAC makes a discrete hypothesis selection (argmax), keypoint detection applies non-maximum suppression and top-$k$ selection, and optimization solvers like bundle adjustment are iterative procedures rather than closed-form functions. *Differentiability* research asks: how do we make these classical geometric algorithms differentiable, so a network can be trained *through* them — optimizing for the final pose or map quality rather than for some proxy label?

The main techniques, each attached to a landmark system:

- **Soft selection instead of argmax**: DSAC replaces RANSAC's hard hypothesis choice with probabilistic selection — the expected loss $\mathbb{E}[\mathcal{L}] = \sum_j p(\mathcal{H}_j)\,\mathcal{L}(\mathcal{H}_j)$ is differentiable even though sampling one hypothesis is not. Hard inlier counting is likewise replaced with a smooth surrogate.
- **Unrolling the solver**: a Gauss-Newton or Levenberg-Marquardt optimizer is a sequence of differentiable linear-algebra steps, so a fixed number of iterations can be unrolled into the computation graph. BA-Net unrolls bundle adjustment over learned features; DROID-SLAM's dense BA layer applies the same idea inside a recurrent update loop.
- **Implicit differentiation**: rather than back-propagating through every solver iteration (memory-hungry), differentiate the optimality conditions at the solution. Libraries like Theseus provide differentiable nonlinear least squares this way.
- **Manifold-aware autodiff**: poses live on $\mathrm{SE}(3)$, not $\mathbb{R}^{12}$; LieTorch implements automatic differentiation directly on Lie groups so that gradient steps stay on the manifold, using the local tangent-space parameterization familiar from classical state estimation.
- **Reinforcement-learning workarounds**: when a step truly cannot be relaxed (e.g. discrete keypoint selection), treat it as a stochastic policy and optimize expected reward, as DISK does for feature learning.

The payoff is *task-level training*: instead of teaching a network to imitate ground-truth depth or hand-labeled matches, you train it so that, after RANSAC/PnP/BA does its job, the final camera pose is accurate. This alignment between training objective and system objective is why differentiable-geometry systems (DSAC-family relocalization, DROID-SLAM) generalize better than naive end-to-end pose regression like PoseNet.

The costs are real too: unrolled solvers are memory- and compute-intensive to train, soft relaxations can create a train/test mismatch with the hard operations used at inference, and gradients through long iterative procedures can vanish or explode. Much of the engineering in this literature is about managing exactly these issues.

## Why it matters for SLAM

Differentiability is the bridge between the two halves of Level 5: it lets learned front-ends be trained with the geometric back-end in the loop, producing hybrid systems that keep the rigor of classical optimization while learning everything around it. Understanding soft selection, solver unrolling, and Lie-group autodiff will let you read papers from DSAC to DROID-SLAM as variations on one idea.

## Related

- [DSAC](dsac.md)
- [BA-Net](ba-net.md)
- [Theseus](theseus.md)
- [Lietorch](lietorch.md)
- [GradSLAM](gradslam.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
