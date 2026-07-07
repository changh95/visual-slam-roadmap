# DROID-SLAM

> Teed 2021 · [Paper](https://arxiv.org/abs/2108.10869)

**One-line summary** — An end-to-end learned SLAM system that iteratively refines dense optical flow and solves for poses and depths through a differentiable Dense Bundle Adjustment layer, dramatically reducing catastrophic failures compared to classical systems.

## Problem

Classical SLAM pipelines depend on hand-crafted feature extraction and matching, which are brittle exactly where robots need them most: textureless surfaces, motion blur, repetitive structure. Earlier learning-based attempts (DeepVO, TartanVO) regressed poses directly from images without maintaining a geometrically consistent map, so they could not match classical accuracy. DROID-SLAM's question: can an end-to-end trainable system keep the optimisation structure that makes SLAM accurate, while learning the parts that make classical SLAM fragile?

## Key ideas

- **Differentiable Dense Bundle Adjustment (DBA)**: a Gauss-Newton solver over $SE(3)$ poses and per-pixel inverse depths embedded as a differentiable layer, enabling end-to-end training while enforcing geometric consistency:
  $$\mathbf{G}^*, \mathbf{d}^* = \arg\min_{\mathbf{G}, \mathbf{d}} \sum_{(i,j)} \sum_{\mathbf{p}} \|w_{ij}^{\mathbf{p}}\|^2 \cdot \|\mathbf{p}_{ij}^* - \Pi(\mathbf{G}_{ij} \cdot \Pi^{-1}(\mathbf{p}, d_i^{\mathbf{p}}))\|^2$$
  where $\mathbf{p}_{ij}^* = \mathbf{p} + \mathbf{f}_{ij}^{\mathbf{p}}$ is the correspondence predicted by the flow network and $w_{ij}^{\mathbf{p}}$ its learned confidence.
- **RAFT-style recurrent updates**: 4D correlation volumes between co-visible frames feed a ConvGRU that iteratively revises dense flow fields and per-pixel confidence weights — "recurrent iterative updates of camera pose and pixelwise depth" are the system's core loop.
- **Flow proposes, BA disposes**: each iteration alternates between learned flow refinement (correlation lookup + GRU) and geometric pose/depth updates (DBA), so network errors are continually corrected by optimisation and vice versa.
- **Frame graph**: the system maintains a graph whose edges connect co-visible frames; adding edges between temporally distant but spatially close frames provides loop-closure-like global consistency within the same update machinery.
- **Cross-modal generalisation**: "despite training on monocular video, it can leverage stereo or RGB-D video to achieve improved performance at test time" — the same trained weights handle all three sensor setups, since extra measurements just add residuals to the DBA problem.
- **Robustness as headline property**: the system is "accurate, achieving large improvements over prior work, and robust, suffering from substantially fewer catastrophic failures."

## Results & impact

The paper reports large improvements over prior work in accuracy plus substantially fewer catastrophic failures (venue: NeurIPS 2021). DROID-SLAM immediately became both the accuracy reference for learned SLAM and a reusable component: it is the pose/depth engine inside NeRF-SLAM and GO-SLAM, and its heavy resource usage is the explicit motivation for DPVO and DPV-SLAM.

## Why it matters for SLAM

DROID-SLAM established the differentiable-BA paradigm for learned SLAM and demonstrated that a trained system can match or exceed decades of hand-engineered SLAM pipelines, catalysing a wave of learning-based SLAM research. Its recurrent-update + DBA architecture is the direct ancestor of DPVO, DPV-SLAM, and MAC-VO, and it serves as the pose/depth frontend inside systems like NeRF-SLAM and GO-SLAM.

## Related

- [RAFT](../level-05-deep-learning/raft.md)
- [DPVO](dpvo.md)
- [TartanVO](tartanvo.md)
- [ORB-SLAM3](orb-slam3.md)
- [NeRF-SLAM](nerf-slam.md)
- [GO-SLAM](go-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
