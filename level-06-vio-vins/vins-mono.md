# VINS-Mono

> Qin 2018 · [Paper](https://arxiv.org/abs/1708.03852)

**One-line summary** — VINS-Mono is a complete tightly-coupled monocular visual-inertial estimator — robust initialization, sliding-window optimization with marginalization, relocalization, and 4-DoF pose-graph loop closure — that became one of the most widely used VIO systems in robotics.

## Key ideas

- **Minimum sensor suite, full metric state**: a monocular camera + low-cost IMU is the smallest suite for metric 6-DoF estimation; the challenge is that depth is never measured directly, so initialization, extrinsic calibration, and scale must all be estimated.
- **Robust loosely-coupled initialization**: a visual SfM bootstrap is aligned with IMU preintegration to solve for gyroscope bias, gravity, velocities, and metric scale — enabling reliable start-up (and failure recovery) from unknown initial conditions.
- **Tightly-coupled sliding-window optimization**: preintegrated IMU factors and visual reprojection factors (features tracked by KLT optical flow) are jointly minimized over a window of keyframe states, with a marginalization prior preserving information from removed states.
- **Two-way marginalization strategy**: marginalize the oldest keyframe when a new keyframe enters, or discard the second-newest frame's visual measurements otherwise — keeping the window computationally bounded without losing IMU continuity.
- **Relocalization + 4-DoF pose graph**: DBoW2-based loop detection feeds a tightly-coupled relocalization step, and a global pose graph optimizes only the four drift-prone degrees of freedom (x, y, z, yaw), since roll and pitch are observable from gravity.

## Why it matters for SLAM

VINS-Mono is arguably the reference monocular VIO system: it packaged the sliding-window + marginalization architecture pioneered by OKVIS with a practical initialization and a full loop-closure back-end, all in one open-source release that runs on drones and phones. Its design choices — preintegration, Huber-robust reprojection factors, sliding-window marginalization, 4-DoF pose graph — became the standard pattern that later systems (VINS-Fusion, ORB-SLAM3's inertial mode, many commercial trackers) follow or refine.

## Related

- [IMU preintegration](imu-preintegration.md)
- [OKVIS](okvis.md)
- [VINS-Fusion](vins-fusion.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
