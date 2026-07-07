# Metrics

How do you say one SLAM system is "better" than another? The community's answer is a pair of trajectory-error metrics computed against ground truth (from motion capture, GPS/INS, or a survey-grade reference): **ATE** for global accuracy and **RPE** for local accuracy. Both are standard because they measure different failures.

## ATE: Absolute Trajectory Error

ATE measures global consistency of the whole trajectory. The estimated trajectory $\{\hat{T}_i\}$ is first aligned to the ground truth $\{T_i^*\}$ with a single rigid transformation $S$ (found by least squares; for monocular systems a similarity transform, since scale is unobservable). Then:

$$
\text{ATE}_{\text{RMSE}} = \sqrt{\frac{1}{N}\sum_{i=1}^{N} \left\| T_i^* - S\hat{T}_i \right\|_F^2}
$$

In practice the translational part is reported as RMSE in meters. A high ATE indicates accumulated drift or an incorrect loop closure that bent the trajectory globally.

## RPE: Relative Pose Error

RPE measures local accuracy — drift per unit of time or distance. For relative motions over a gap $\delta$, with $Q_i = T_i^{-1} T_{i+\delta}$ (ground truth) and $\hat{Q}_i = \hat{T}_i^{-1} \hat{T}_{i+\delta}$ (estimate):

$$
\text{RPE}_i = Q_i^{-1} \hat{Q}_i
$$

The RMSE of the translational and rotational parts is reported separately (e.g., % translation error and deg/m). KITTI's official metric is an RPE flavor: errors averaged over sub-sequences of 100–800 m.

## Why you need both

A visual odometry system with excellent local tracking but no loop closure can have low RPE and terrible ATE; a system with aggressive (occasionally wrong) loop closure can show the opposite. ATE rewards global map correctness; RPE isolates odometry quality and is insensitive to where drift happened. When comparing papers, also check the alignment convention (SE(3) vs. Sim(3)) — scale-aligned monocular numbers are not comparable to metric stereo/VIO numbers.

## Standard benchmarks

| Dataset | Sensors | Environment | Ground truth |
|---|---|---|---|
| KITTI Odometry | Stereo + LiDAR + IMU | Outdoor driving | GPS/INS |
| TUM RGB-D | RGB-D + IMU | Indoor handheld | Motion capture |
| EuRoC MAV | Stereo + IMU | Indoor UAV | Motion capture |

- **KITTI**: 11 training sequences with ground truth plus 11 held-out test sequences; evaluated by % translation and rotation error averaged over all sub-sequences of lengths 100–800 m.
- **TUM RGB-D**: 39 sequences of varying difficulty (static scenes, dynamic objects, motion blur); ATE is the standard metric, and its evaluation scripts popularized both metrics.
- **EuRoC**: 11 sequences from two buildings with graded difficulty (V1_01 easy to V2_03 difficult); both ATE and RPE reported, with well-synchronized IMU data — the default proving ground for VIO.

## Tooling

The de-facto standard evaluation tool is **evo**, which reads common trajectory formats (TUM, KITTI, EuRoC, ROS bags) and computes both metrics with explicit alignment control:

```bash
evo_ape tum groundtruth.txt estimate.txt -a          # ATE with SE(3) alignment
evo_ape tum groundtruth.txt estimate.txt -as         # ...Sim(3): also aligns scale (monocular)
evo_rpe tum groundtruth.txt estimate.txt --delta 1 --delta_unit m   # RPE per meter
```

Making the alignment flags explicit in your scripts is what keeps your numbers comparable to published ones.

## Pitfalls when reading (or making) results tables

- **Alignment mismatch** — a Sim(3)-aligned monocular ATE sitting next to an SE(3)-aligned stereo ATE is not a fair column.
- **Timestamp association** — estimate and ground truth are sampled at different rates; the association tolerance silently changes the score.
- **Nondeterminism** — multi-threaded SLAM systems produce different trajectories run to run; serious evaluations report statistics over several runs, not a single lucky one.
- **Tracking failures hide in averages** — a system that loses tracking and only reports the surviving fragment can post a deceptively low ATE; completeness and failure rate must be reported alongside.
- **Metrics only measure the mean** — two systems with identical ATE can differ wildly in uncertainty quality; see [Consistency](consistency.md).

Beyond accuracy, serious evaluations also report runtime, robustness (tracking-failure rate across runs), and — for probabilistic estimators — consistency, which trajectory metrics alone cannot capture.

## Why it matters for SLAM

ATE and RPE are the shared currency of the field: every SLAM paper's results table is built on them, so you must know exactly what they measure — and what they hide — to read the literature critically or to claim your own system works. They are also daily engineering tools: an RPE regression points at the front-end/odometry, an ATE regression with stable RPE points at loop closure or the back-end.

## Related

- [Consistency](consistency.md)
- [Odometry](odometry.md)
- [VO vs SLAM](../level-03-monocular-slam/vo-vs-slam.md)
- [Scale ambiguity](../level-03-monocular-slam/scale-ambiguity.md)
- [RGBD-SLAM-V2 (TUM RGB-D benchmark)](../level-04-rgbd-slam/rgbd-slam-v2.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
