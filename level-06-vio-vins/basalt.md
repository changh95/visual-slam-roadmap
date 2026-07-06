# Basalt
> Usenko 2020 · [Paper](https://arxiv.org/abs/1904.06504)

**One-line summary** — Splits visual-inertial estimation into a real-time odometry front-end and a mapping back-end, and introduces non-linear factor recovery (NFR): replacing linearized marginalization priors with recovered nonlinear factors that can be re-linearized freely during global mapping.

## Key ideas
- **The marginalization-prior problem**: sliding-window VIO (OKVIS, VINS-Mono) compresses old states into a Schur-complement prior that is frozen at its linearization point; as later optimization moves the remaining variables, this prior becomes inconsistent (the FEJ problem), degrading global maps.
- **Non-linear factor recovery**: instead of exporting the linearized prior, Basalt reconstructs a small set of *nonlinear* factors (e.g., relative-pose and roll/pitch factors) that optimally approximate the information VIO accumulated about the trajectory — and these can be re-linearized at any point in the mapping back-end.
- **Two-stage architecture**: a fast stereo-inertial odometry front-end over a small keyframe window (optical-flow tracking, preintegrated IMU factors, double-sphere fisheye camera model) feeds recovered factors to a back-end that combines them with loop-closure constraints in global bundle adjustment.
- **VIO factors make the map's roll and pitch observable** — gravity information survives the transfer from odometry to mapping, improving robustness and accuracy of the global map.
- **Square-root marginalization**: storing the prior in Cholesky/QR form avoids numerical cancellation in ill-conditioned problems.

## Why it matters for SLAM
Basalt gave a principled answer to a question every VIO-plus-mapping system faces: how do you carry odometry information into global optimization without either freezing linearization points or hauling along all raw measurements? Its recovered-factor idea and square-root numerics influenced later systems (including OKVIS2's pose-graph-edge treatment of marginalized landmarks), and its high-quality open-source implementation is a common high-accuracy baseline on EuRoC and TUM-VI. Reach for it when you need both real-time odometry and globally consistent visual-inertial maps.

## Related
- [OKVIS](okvis.md) — the sliding-window architecture whose marginalization weakness Basalt targets.
- [Marginalization](../level-02-getting-familiar/marginalization.md) — the underlying mechanism and its linearization pitfalls.
- [DM-VIO](dm-vio.md) — a different remedy (delayed marginalization) for the same inconsistency problem.
- [OKVIS2](okvis2.md) — successor-generation system with reactivatable marginalized information.
- [VINS-Mono](vins-mono.md) — contemporaneous sliding-window VIO baseline.

[Back to Level 6](../README.md#level-6-vio--vins)
