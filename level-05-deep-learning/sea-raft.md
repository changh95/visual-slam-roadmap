# SEA-RAFT

> Wang 2024 · [Paper](https://arxiv.org/abs/2405.14793)

**One-line summary** — Simple, Efficient, Accurate RAFT: shows that three training-recipe changes — a mixture-of-Laplace loss, direct initial flow regression, and rigid-motion pre-training — make RAFT state-of-the-art again without architectural complexity.

## Key ideas

- **Mixture-of-Laplace loss**: Replaces RAFT's plain $\ell_1$ loss with a probabilistic mixture, $p(\mathbf{f}\mid\mathbf{x}) = \sum_k \pi_k\,\text{Laplace}(\mathbf{f}; \mu_k, b_k)$, modeling the multi-modal ambiguity of flow near occlusion boundaries and yielding uncertainty estimates for free.
- **Direct initial flow regression**: A lightweight head predicts a starting flow from the correlation volume instead of initializing at zero, so GRU iterations refine rather than recover large displacements — fewer iterations, faster convergence.
- **Rigid-motion pre-training**: Pre-training on rigid-body motion data (camera ego-motion + rigid objects) injects a geometric prior that transfers well to real scenes.
- **No new architecture**: Keeps RAFT's lightweight encoder + ConvGRU design, achieving competitive accuracy with Transformer-based flow methods at a multiple of their speed.

## Why it matters for SLAM

SEA-RAFT is the practical choice when a SLAM front-end needs dense flow at real-time rates: RAFT-class accuracy without Transformer-class latency. Two of its ingredients align directly with SLAM needs — the rigid-motion prior matches the mostly rigid world SLAM assumes, and the Laplace-mixture uncertainty maps naturally onto measurement covariances in probabilistic estimation. It is also a case study that training strategy can beat architecture growth, a lesson relevant to any learned SLAM component.

## Related

- [RAFT](raft.md) — the base architecture and training target
- [FlowFormer](flowformer.md) — the heavier Transformer alternative
- [DPVO](../level-03-monocular-slam/dpvo.md) — sparse learned odometry with RAFT-style updates
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — RAFT machinery in a full SLAM system

[Back to Level 5](../README.md#level-5-applying-deep-learning)
