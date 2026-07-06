# DROID-SLAM

> Teed 2021 · [Paper](https://arxiv.org/abs/2108.10869)

**One-line summary** — An end-to-end learned SLAM system that iteratively refines dense optical flow and solves for poses and depths through a differentiable Dense Bundle Adjustment layer, dramatically reducing catastrophic failures compared to classical systems.

## Key ideas

- **Differentiable Dense Bundle Adjustment (DBA)**: a Gauss-Newton solver over $SE(3)$ poses and per-pixel inverse depths embedded as a differentiable layer, enabling end-to-end training while enforcing geometric consistency:
  $$\mathbf{G}^*, \mathbf{d}^* = \arg\min_{\mathbf{G}, \mathbf{d}} \sum_{(i,j)} \sum_{\mathbf{p}} \|w_{ij}^{\mathbf{p}}\|^2 \cdot \|\mathbf{p}_{ij}^* - \Pi(\mathbf{G}_{ij} \cdot \Pi^{-1}(\mathbf{p}, d_i^{\mathbf{p}}))\|^2$$
- **RAFT-style recurrent updates**: 4D correlation volumes between co-visible frames feed a ConvGRU that iteratively revises dense flow fields and per-pixel confidence weights.
- **Frame graph**: the system maintains a graph whose edges connect co-visible frames; update iterations alternate between flow refinement and DBA pose/depth updates, which also provides loop-closure-like global consistency.
- **Cross-modal generalisation**: trained only on monocular synthetic video (TartanAir), it works on stereo and RGB-D input at test time.
- **Robustness**: large accuracy gains over classical systems in the paper's evaluations, with far fewer tracking failures.

## Why it matters for SLAM

DROID-SLAM established the differentiable-BA paradigm for learned SLAM and demonstrated that a trained system can match or exceed decades of hand-engineered SLAM pipelines, catalysing a wave of learning-based SLAM research. Its recurrent-update + DBA architecture is the direct ancestor of DPVO, DPV-SLAM, and MAC-VO, and it serves as the pose/depth frontend inside systems like NeRF-SLAM and GO-SLAM.

## Related

- [RAFT](../level-05-deep-learning/raft.md)
- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [ORB-SLAM3](orb-slam3.md)
- [NeRF-SLAM](nerf-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
