# SEA-RAFT

> Wang 2024 · [Paper](https://arxiv.org/abs/2405.14793)

**One-line summary** — Simple, Efficient, Accurate RAFT: shows that three training-recipe changes — a mixture-of-Laplace loss, direct initial flow regression, and rigid-motion pre-training — make RAFT state-of-the-art again without architectural complexity.

## Problem

Post-RAFT progress in optical flow came mostly from heavier architectures — Transformer cost-volume encoders, larger backbones — trading away the speed that makes flow usable in real-time systems.

Meanwhile RAFT's own training recipe had known weaknesses: the plain $\ell_1$ loss ignores the multi-modal ambiguity of flow near occlusion boundaries, initializing flow at zero wastes early GRU iterations recovering large displacements, and purely synthetic random-motion training data limits generalization to real, mostly-rigid scenes. SEA-RAFT asks how far training improvements alone can push the original architecture.

## Key ideas

- **Mixture-of-Laplace loss**: Replaces RAFT's plain $\ell_1$ loss with a probabilistic mixture, $p(\mathbf{f}\mid\mathbf{x}) = \sum_k \pi_k\,\text{Laplace}(\mathbf{f}; \mu_k, b_k)$, modeling the multi-modal ambiguity of flow near occlusion boundaries and yielding uncertainty estimates for free.
- **Direct initial flow regression**: A lightweight head predicts a starting flow directly from context/correlation features instead of initializing at zero, so GRU iterations refine rather than recover large displacements — faster convergence in the iterative refinements, fewer iterations needed.
- **Rigid-motion pre-training**: Pre-training on rigid-body motion (camera ego-motion over static scenes) injects a geometric prior that measurably improves generalization to real data.
- **No new architecture**: Keeps RAFT's lightweight encoder + ConvGRU design — no Transformer blocks, no cost-volume tokenization — so the deployment profile stays embedded-GPU friendly; the contribution is deliberately in the recipe, demonstrating that data and loss design can beat architecture growth.
- **Uncertainty as a first-class output**: The mixture parameters give per-pixel confidence, which downstream systems can consume directly instead of estimating flow quality heuristically.

## Results & impact

- State-of-the-art accuracy on the Spring benchmark: 3.69 endpoint-error (EPE) and a 0.36 1-pixel outlier rate — 22.9% and 17.8% error reduction from the best published results.
- Best cross-dataset generalization on KITTI and Spring — the property that matters most when deploying on a robot outside the training domains.
- Operates at least 2.3x faster than existing methods with competitive performance, restoring the RAFT lineage as the practical speed/accuracy frontier.
- A case study, much like PWC-Net vs. FlowNet2 a generation earlier, that careful engineering of loss, initialization, and data beats stacking capacity.

## Why it matters for SLAM

SEA-RAFT is the practical choice when a SLAM front-end needs dense flow at real-time rates: RAFT-class accuracy without Transformer-class latency. Two of its ingredients align directly with SLAM needs — the rigid-motion prior matches the mostly rigid world SLAM assumes, and the Laplace-mixture uncertainty maps naturally onto measurement covariances in probabilistic estimation. It is also a case study that training strategy can beat architecture growth, a lesson relevant to any learned SLAM component.

## Related

- [RAFT](raft.md) — the base architecture and training target
- [FlowFormer](flowformer.md) — the heavier Transformer alternative
- [DPVO](../level-03-monocular-slam/dpvo.md) — sparse learned odometry with RAFT-style updates
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — RAFT machinery in a full SLAM system

[Back to Level 5](../README.md#level-5-applying-deep-learning)
