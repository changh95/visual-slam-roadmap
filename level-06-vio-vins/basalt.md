# Basalt
> Usenko 2020 · [Paper](https://arxiv.org/abs/1904.06504)

**One-line summary** — Splits visual-inertial estimation into a real-time odometry front-end and a mapping back-end, and introduces non-linear factor recovery (NFR): replacing linearized marginalization priors with recovered nonlinear factors that can be re-linearized freely during global mapping.

## Problem
Cameras and IMUs are complementary, but combining them *for globally consistent mapping* is not straightforward: mapping wants keyframes with large baselines and long time intervals, while "inertial data ... quickly degrades with the duration of the intervals and after several seconds of integration it typically contains only little useful information" (abstract).

Meanwhile, sliding-window VIO (OKVIS, VINS-Mono) compresses old states into a Schur-complement prior frozen at its linearization point; as later optimization moves the remaining variables, that prior becomes inconsistent — the FEJ problem — and accumulated linearization error degrades the global map. How do you carry the odometry's information into global optimization without freezing linearization points or hauling along all raw measurements?

## Key ideas
- **Non-linear factor recovery (NFR).** Instead of exporting the linearized prior, Basalt reconstructs a small set of *nonlinear* factors — e.g., relative-pose factors of the form

  $$\|\mathbf{T}_j^{-1}\mathbf{T}_i \ominus \hat{\mathbf{T}}_{ij}\|^2_{\boldsymbol{\Omega}_{ij}}$$

  plus roll/pitch factors — that make "an optimal approximation of the information on the trajectory accumulated by VIO." Because they are nonlinear, the mapping back-end can re-linearize them at any estimate, eliminating the frozen-prior inconsistency.
- **Two-stage architecture.**
  - *Front-end (online)*: a fast stereo-inertial odometry over a small keyframe window — optical-flow tracking, preintegrated IMU factors, and the double-sphere camera model for wide-FoV fisheye lenses — which emits keyframes and recovered factors.
  - *Back-end (mapping)*: combines the recovered VIO factors with loop-closure constraints in global visual-inertial bundle adjustment, free to re-linearize everything.
- **Gravity survives the hand-off.** "The VIO factors make the roll and pitch angles of the global map observable, and improve the robustness and the accuracy of the mapping" (abstract) — the inertial information that would be lost by keeping only relative-pose constraints is explicitly preserved.
- **Principled information budget.** NFR frames "what to keep from odometry" as an approximation problem (which nonlinear factors best match the accumulated information) rather than an engineering habit, which is why the idea transfers beyond this one system.

## Results & impact
On a public benchmark the paper demonstrates "superior performance of our method over the state-of-the-art approaches" (abstract), with the recovered VIO factors improving the robustness and accuracy of the mapping.

The high-quality open-source implementation became a common high-accuracy baseline on EuRoC and TUM-VI, and NFR influenced later systems (including OKVIS2's pose-graph-edge treatment of marginalized landmarks).

## Why it matters for SLAM
Basalt gave a principled answer to a question every VIO-plus-mapping system faces: how do you carry odometry information into global optimization without either freezing linearization points or hauling along all raw measurements? Its recovered-factor idea influenced later systems (including OKVIS2's pose-graph-edge treatment of marginalized landmarks), and its high-quality open-source implementation is a common high-accuracy baseline on EuRoC and TUM-VI. Reach for it when you need both real-time odometry and globally consistent visual-inertial maps.

## Related
- [OKVIS](okvis.md) — the sliding-window architecture whose marginalization weakness Basalt targets.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the underlying mechanism and its linearization pitfalls.
- [DM-VIO](dm-vio.md) — a different remedy (delayed marginalization) for the same inconsistency problem.
- [OKVIS2](okvis2.md) — successor-generation system with reactivatable marginalized information.
- [VINS-Mono](vins-mono.md) — contemporaneous sliding-window VIO baseline.
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — background on the double-sphere fisheye model Basalt uses.

[Back to Level 6](../README.md#level-6-vio--vins)
