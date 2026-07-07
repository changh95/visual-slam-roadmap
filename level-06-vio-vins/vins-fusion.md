# VINS-Fusion

> Qin 2019 · [Paper](https://arxiv.org/abs/1901.03638)

**One-line summary** — VINS-Fusion generalizes VINS-Mono into an optimization-based multi-sensor odometry framework where every sensor (mono/stereo cameras, IMU, GPS) is treated as a general factor, enabling stereo and GPS-fused configurations for drift-free large-scale operation.

## Problem

Robots ship with increasingly diverse sensor suites — stereo cameras on ground vehicles, a monocular camera plus IMU on phones, stereo plus IMU on aerial robots — yet most state estimators are designed for a single sensor or one specific suite, and few can be reused across sensor choices. On top of that, VINS-Mono specifically suffers monocular scale drift in large-scale or low-excitation scenarios and has no mechanism to fuse absolute measurements like GPS, so long-term drift is unbounded. VINS-Fusion proposes one general optimization-based framework in which every sensor is just another factor.

## Key ideas

- **Sensors as general factors**: each sensor contributes residual factors over shared state variables; factors that share states are summed into one optimization problem. This single design supports stereo-only, mono+IMU, and stereo+IMU suites in the same codebase — the three suites demonstrated in the paper.
- **Stereo extension**: features observed in the right camera add reprojection constraints through the fixed, calibrated baseline,
  $$\mathbf{r}^{(\text{stereo})} = \mathbf{z}^R - \pi\!\left({}^{C_R}_{C_L}\mathbf{T}\cdot {}^{C_L}\mathbf{p}_f\right),$$
  directly constraining metric scale with no reliance on IMU excitation.
- **GPS / global sensor fusion**: low-rate, noisy global position measurements are fused in a global pose graph, with an online-estimated 4-DoF alignment (yaw + 3D translation, since roll/pitch are observable from gravity) between the local odometry frame $L$ and the global frame $W$:
  $$\mathbf{r}^{\text{GPS}} = \mathbf{R}_{WL}\,{}^L\hat{\mathbf{p}} + \mathbf{t}_{WL} - {}^W\mathbf{p}^{\text{GPS}}.$$
  This bounds long-term drift outdoors while leaving local odometry untouched.
- **Asynchronous local + global architecture**: the sliding-window VIO runs at camera rate while global measurements are buffered and merged asynchronously in the pose graph, so odometry latency is unaffected by GPS delays or dropouts; outlier GPS fixes are rejected before entering the graph.
- **Inherited VINS-Mono machinery**: KLT feature tracking, on-manifold IMU preintegration, sliding-window optimization with marginalization, and DBoW2 loop closure — the pose graph simply gains GPS factors next to loop-closure edges.

## Results & impact

The paper validates the framework on public datasets and in real-world multi-sensor experiments, comparing against other state-of-the-art algorithms across the three sensor suites. Adding stereo to the IMU configuration measurably improves accuracy over monocular VIO on EuRoC, and GPS fusion reduces kilometer-scale outdoor drift to meter-level absolute accuracy in open-sky conditions. Released fully open source, VINS-Fusion became one of the most widely deployed odometry stacks in robotics and a standard template for combining local odometry with global positioning.

## Why it matters for SLAM

VINS-Fusion is one of the most widely deployed open-source odometry stacks in robotics: it took the academically successful VINS-Mono and made it practical for real vehicles by adding stereo scale observability and GPS drift correction. Its "everything is a factor" formulation became the template for local-plus-global fusion in autonomous driving and drone autonomy, and it remains a standard baseline for stereo-inertial estimation.

## Related

- [VINS-Mono](vins-mono.md)
- [Scale observability](../level-07-stereo-slam/scale-observability.md)
- [Tightly-coupled vs Loosely-coupled](tightly-coupled-vs-loosely-coupled.md)
- [LVI-SAM](../level-09-lidar-visual-lidar-slam/lvi-sam.md)
- [OKVIS2-X](okvis2-x.md)

[Back to Level 6](../README.md#level-6-vio--vins)
