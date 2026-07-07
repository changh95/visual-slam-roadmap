# LDSO

> Gao 2018 · [Paper](https://arxiv.org/abs/1808.01111)

**One-line summary** — Extended DSO into a full SLAM system by biasing point selection toward repeatable corners, adding BoW loop detection and $\mathrm{Sim}(3)$ pose-graph optimisation, fixing DSO's unbounded drift while keeping its photometric tracking core.

## Problem

DSO achieves excellent local accuracy through sliding-window photometric bundle adjustment, but it is pure odometry: no place recognition, no loop closure, no global optimisation, so drift grows without bound on long trajectories. Adding loop closure to a direct method is non-trivial because direct methods select pixels by gradient, not repeatability — "the repeatability of those points is not required by direct methods," so there are no descriptors to feed a bag-of-words database. LDSO bridges this gap without giving up DSO's photometric frontend.

## Method & architecture

- **Point selection with repeatable features**: LDSO still picks 2000 points per keyframe as in DSO, but part of them are corners detected by the Shi–Tomasi score while the rest use DSO's gradient-based dynamic grid search. Only the (few) corners get ORB descriptors, packed into bag-of-words; both corners and non-corners are used for photometric tracking, so the extra cost of the loop-closing thread stays minimal.
- **Loop candidate proposal and checking**: a DBoW3 database over keyframes proposes candidates, restricted to keyframes outside the current window (already marginalised). ORB matches plus RANSAC PnP give an initial $\mathrm{SE}(3)$ guess; a $\mathrm{Sim}(3)$ transform $\mathbf{S}_{cr}$ from the loop candidate to the current keyframe is then refined by Gauss–Newton on combined 3D-geometric and 2D-reprojection constraints:

$$E_{loop} = \sum_{\mathbf{q}_i \in \mathcal{Q}_1} w_1 \left\| \mathbf{S}_{cr}\, \Pi^{-1}(\mathbf{p}_i, d_{\mathbf{p}_i}) - \Pi^{-1}(\mathbf{q}_i, d_{\mathbf{q}_i}) \right\|_2 + \sum_{\mathbf{q}_j \in \mathcal{Q}_2} w_2 \left\| \Pi\big(\mathbf{S}_{cr}\, \Pi^{-1}(\mathbf{p}_j, d_{\mathbf{p}_j})\big) - \mathbf{q}_j \right\|_2,$$

  where $\Pi, \Pi^{-1}$ are projection/back-projection, $d$ inverse depths (current-keyframe depths come from projecting the active window's map points into it), and $w_1, w_2$ balance the measurement units. The scale is only observable from the 3D part, but without the 2D reprojection term rotation and translation would be inaccurate under noisy depths.
- **Fusing sliding window and pose graph**: DSO's windowed optimisation solves $\mathbf{H}\,\delta\mathbf{x} = -\mathbf{b}$ with $\mathbf{H} \approx \mathbf{J}^{\top}\mathbf{W}\mathbf{J} + \lambda\mathbf{I}$ (arrow-shaped sparsity, diagonal $\mathbf{H}_{dd}$). Rather than carrying DSO's marginalisation prior (a hyper-edge over all window keyframes) into the graph, LDSO approximates the window constraints by pairwise relative $\mathrm{SE}(3)$ observations from the frontend's pose estimates, each contributing $\mathbf{e}_{ij} = \mathbf{T}_{ij}\hat{\mathbf{T}}_j^{-1}\hat{\mathbf{T}}_i$ alongside the $\mathrm{Sim}(3)$ loop constraints. The pose graph (g2o) fixes the current keyframe's pose and does not write back into the window, so global corrections never disturb the local windowed BA.
- **Unchanged photometric frontend**: DSO's direct tracking and windowed photometric bundle adjustment are preserved, retaining robustness in weakly textured areas.

## Results

- **TUM-Mono** (50 sequences, loop closure disabled to isolate the frontend change; 10 forward + 10 backward runs each): the corner-biased point selection "does not reduce the VO accuracy of the original system" in translational, rotational, and scale drift; purely random point picking fails more often but is surprisingly accurate when it survives.
- **EuRoC MAV** (RMSE after $\mathrm{Sim}(3)$ alignment): LDSO significantly improves camera tracking accuracy over DSO on most sequences; both fail on V2-03 (as does ORB-SLAM2 forward). Overall "ORB-SLAM2 is more accurate, whereas LDSO is more robust on this dataset."
- **KITTI odometry** (ATE in metres, $\mathrm{Sim}(3)$-aligned): on loopy sequences LDSO slashes DSO's drift — seq 00: 126.7 → 9.32 (ORB-SLAM2: 8.27), seq 05: 49.85 → 5.10 (7.91), seq 07: 27.99 → 2.96 (3.44) — comparable to ORB-SLAM2 despite using only pose-graph optimisation where ORB-SLAM2 runs global bundle adjustment.
- **Runtime**: point selection takes 21.8 ms per keyframe vs 12.6 ms for the original DSO picker (i7-4770HQ laptop) — and only on keyframes, not every frame.

## Why it matters for SLAM

LDSO answered the question of how a *direct* method — which by design has no repeatable feature descriptors — can do place recognition: keep the photometric core, but make a subset of points feature-like. It is also a clean case study in SLAM architecture: frontend odometry (DSO) plus backend pose graph with $\mathrm{Sim}(3)$ loop constraints, the same drift-correction pattern as LSD-SLAM and ORB-SLAM, showing that the direct and feature-based "camps" are complementary rather than exclusive.

## Related

- [DSO](dso.md)
- [LSD-SLAM](lsd-slam.md)
- [ORB-SLAM](orb-slam.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Scale ambiguity](scale-ambiguity.md)
