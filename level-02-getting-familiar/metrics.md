# Metrics

How do you say one SLAM system is "better" than another? The community's answer is a pair of trajectory-error metrics computed against ground truth (from motion capture, GPS/INS, or a survey-grade reference): **ATE** for global accuracy and **RPE** for local accuracy. Both are standard because they measure different failures.

**Absolute Trajectory Error (ATE)** measures global consistency of the whole trajectory. The estimated trajectory $\{\hat{T}_i\}$ is first aligned to the ground truth $\{T_i^*\}$ with a single rigid transformation $S$ (found by least squares; for monocular systems a similarity transform, since scale is unobservable). Then:

$$
\text{ATE}_{\text{RMSE}} = \sqrt{\frac{1}{N}\sum_{i=1}^{N} \left\| T_i^* - S\hat{T}_i \right\|_F^2}
$$

In practice the translational part is reported as RMSE in meters. A high ATE indicates accumulated drift or an incorrect loop closure that bent the trajectory globally.

**Relative Pose Error (RPE)** measures local accuracy — drift per unit of time or distance. For relative motions over a gap $\delta$, with $Q_i = T_i^{-1} T_{i+\delta}$ (ground truth) and $\hat{Q}_i = \hat{T}_i^{-1} \hat{T}_{i+\delta}$ (estimate):

$$
\text{RPE}_i = Q_i^{-1} \hat{Q}_i
$$

The RMSE of the translational and rotational parts is reported separately (e.g., % translation error and deg/m). KITTI's official metric is an RPE flavor: errors averaged over sub-sequences of 100–800 m.

Why you need both: a visual odometry system with excellent local tracking but no loop closure can have low RPE and terrible ATE; a system with aggressive (occasionally wrong) loop closure can show the opposite. ATE rewards global map correctness; RPE isolates odometry quality and is insensitive to where drift happened. When comparing papers, also check the alignment convention (SE(3) vs. Sim(3)) — scale-aligned monocular numbers are not comparable to metric stereo/VIO numbers.

Standard benchmarks pair these metrics with datasets: **KITTI Odometry** (outdoor driving; RPE-style %/deg-per-m), **TUM RGB-D** (indoor handheld; ATE is the standard metric, and its evaluation scripts popularized both metrics), and **EuRoC MAV** (indoor drone; both ATE and RPE). Beyond accuracy, serious evaluations also report runtime, robustness (tracking-failure rate across runs), and — for probabilistic estimators — consistency, which trajectory metrics alone cannot capture.

## Why it matters for SLAM

ATE and RPE are the shared currency of the field: every SLAM paper's results table is built on them, so you must know exactly what they measure — and what they hide — to read the literature critically or to claim your own system works. They are also daily engineering tools: an RPE regression points at the front-end/odometry, an ATE regression with stable RPE points at loop closure or the back-end.

## Related

- [Consistency](consistency.md)
- [Odometry](odometry.md)
- [VO vs SLAM](../level-03-monocular-slam/vo-vs-slam.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
- [RGBD-SLAM-V2 (TUM RGB-D benchmark)](../level-04-rgbd-slam/rgbd-slam-v2.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
