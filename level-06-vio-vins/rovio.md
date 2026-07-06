# ROVIO

> Bloesch 2015 · [Paper](https://github.com/ethz-asl/rovio)

**One-line summary** — ROVIO (Robust Visual Inertial Odometry) is a tightly-coupled monocular VIO that combines a *robocentric* EKF formulation with *direct photometric* multi-level patch tracking, gaining robustness in texture-poor scenes and fast motion where feature-descriptor pipelines fail.

## Key ideas

- **Robocentric state**: instead of estimating poses in an unobservable world frame, the filter origin rides with the current IMU body frame; landmarks are stored as bearing vectors + inverse depth in the body frame. This sidesteps the unobservable global position/yaw and improves EKF conditioning.
- **Direct photometric tracking in the filter**: each landmark is a multi-level (pyramidal) intensity patch; the EKF innovation is the photometric error between the warped reference patch and the current image — no feature descriptors or explicit matching step.
- **Iterated EKF update**: photometric residuals are strongly nonlinear, so the update re-linearizes within each step (IEKF) for accuracy.
- **Inverse-depth landmark initialization**: new patches enter with high depth uncertainty and converge over multiple observations, allowing immediate use of new regions of the scene.
- Runs in real time on standard CPUs, and is famously robust on sequences with featureless floors/walls where corner-based systems lose track.

## Why it matters for SLAM

ROVIO showed that direct methods and Kalman filtering combine naturally: the camera becomes "just another sensor" producing intensity innovations for the EKF. It became the VIO front-end (ROVIOLI) of the maplab mapping framework and a standard EuRoC-era baseline alongside MSCKF and OKVIS, and its photometric-residual philosophy carried into later direct VIO systems such as VI-DSO and DM-VIO. Choose it when you need a lightweight, robust odometry that tolerates low texture and motion blur.

## Related

- [MSCKF](msckf.md)
- [OpenVINS](openvins.md)
- [DM-VIO](dm-vio.md)
- [maplab](maplab.md)
- [Quaternion kinematics for error-state KF](quaternion-kinematics-for-error-state-kf.md)

---
[Back to Level 6](../README.md#level-6-vio--vins)
