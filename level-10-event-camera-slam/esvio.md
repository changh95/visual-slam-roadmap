# ESVIO

> Chen 2023 · [Paper](https://arxiv.org/abs/2212.13184)

**One-line summary** — ESVIO is the first event-based *stereo* visual-inertial odometry system, tightly fusing stereo event streams, standard stereo images, and IMU measurements for robust state estimation in aggressive-motion and low-light conditions.

## Problem

Event cameras' low-latency, asynchronous output (and 140 dB dynamic range vs ~60 dB for standard cameras) is a great fit for state estimation in challenging situations, but most event-based VO was monocular — stereo event vision had seen little research. The design space had a hole: ESVO offered stereo event odometry without an IMU, while Ultimate-SLAM fused events, frames, and IMU but only monocularly. Moreover, image-style instantaneous matching cannot be applied directly to two asynchronous event streams — temporal deviations, noise, and differing contrast sensitivities cause false stereo correspondences.

## Method & architecture

The pipeline has two variants: **ESIO** (purely event-inertial) and **ESVIO** (event + image-aided). Three front-end/back-end stages interact in a closed loop:

1. **IMU-aided motion compensation.** Each event $e_k = \{l_k, t_k, p_k\}$ is warped to a reference time $t_{ref}$ assuming uniform motion over the short interval $\Delta t$, using the gyroscope for rotation and the back-end's velocity estimate for translation:

$$ {}^{ref}\mathbf{R}_k = \exp\big((\tilde{\boldsymbol{\omega}}_k - \mathbf{b}_g - \mathbf{n}_g)\Delta t\big), \qquad {}^{ref}\mathbf{L}_k = {}^{ref}\mathbf{R}_k \mathbf{L}_k + \mathbf{v}_{ref}\Delta t, $$

where $\mathbf{L}_k$ is the homogeneous pixel location and $\mathbf{v}_{ref}$ the back-end velocity. Better state estimates sharpen the compensated event edges, which in turn improve the next estimate.

2. **Spatial and temporal data association.** Compensated events populate polarity-separated surfaces of active events (SAE), converted to time surfaces (TS). Event corners are extracted with a modified Arc* detector (100–200 features maintained, spread by a minimum-distance mask on the TS). Features are tracked *temporally* between consecutive left event streams and matched *instantaneously* across stereo-rectified left/right time surfaces, both with forward-inverse LK optical flow; depth is recovered by triangulation with RANSAC outlier rejection.

3. **Graph-based back-end.** A sliding window optimizes the full state $\boldsymbol{\chi} = [\mathbf{x}_{b_0}, \dots, \mathbf{x}_{b_n}, \mathbf{x}^b_e, \mathbf{x}^b_c, \boldsymbol{\Lambda}_{es}, \boldsymbol{\Lambda}_{et}, \boldsymbol{\Lambda}_c]$ — IMU states (position, quaternion, velocity, biases), camera-IMU extrinsics, and inverse depths of event/image features — by minimizing

$$ \min_{\boldsymbol{\chi}} \Big( \sum_{k} \|\mathbf{r}_b\|^2_{\Omega_b} + \sum_{(l,k)} \|\mathbf{r}_{es}\|^2_{\Omega_{es}} + \sum_{(l,k)} \|\mathbf{r}_{et}\|^2_{\Omega_{et}} + \sum_{(l,k)} \|\mathbf{r}_c\|^2_{\Omega_c} \Big), $$

combining IMU preintegration residuals $\mathbf{r}_b$, **spatial** event residuals $\mathbf{r}_{es}$ (reprojection of a feature from right to left event camera through inverse depth $\lambda_{es}$ and extrinsic $\mathbf{T}^{le}_{re}$), **temporal** event residuals $\mathbf{r}_{et}$ (reprojection between the $i$-th and $k$-th left event streams through body poses $\mathbf{T}^w_{b_i}, \mathbf{T}^{b_k}_w$), and standard-camera residuals $\mathbf{r}_c$.

## Results

- **Self-collected HKU dataset** (two DAVIS346, 6 cm baseline, stereo events 60 Hz, frames 30 Hz, IMU 1000 Hz, VICON ground truth; aggressive motion and HDR): ESVIO achieves average MPE 0.14% / MRE 0.033°/m vs ORB-SLAM3 stereo VIO 0.16% / 0.12°/m, VINS-Fusion 0.76% / 0.38°/m, USLAM mono EIO 5.06% / 1.05°/m, and PL-EVIO 0.26% / 0.41°/m. ESIO reaches 0.89% and motion-compensated ESIO+ 0.66%. ORB-SLAM3 and VINS-Fusion fail on hku_agg_walk (motion blur); ORB-SLAM3 fails on hku_dark_normal; EVO and ESVO failed on all sequences.
- **Public datasets**: first reported results on VECtor (e.g., robot-fast 0.20% where VINS-Fusion, EVO, ESVO fail) and strong MVSEC indoor-flying results (e.g., 0.94% / 0.47% MPE on flying 1/3 vs 1.35% / 0.64% for PL-EVIO); low-texture units-dolly/scooter remain hard for all vision-only methods.
- **Real-time**: on an i7-1260P NUC, front-end 10.44 ms and back-end 19.30 ms at 346×260 (35.69 / 35.59 ms at 640×480).
- **Onboard quadrotor flights**: closed-loop flight with ESVIO as the only pose feedback; on a 56.0 m HDR flight, ATE RMSE 0.17 m with average relative translation error around 0.1 m; large-scale outdoor and driving sequences demonstrate long-term operation.

## Why it matters for SLAM

ESVIO completes the sensor-fusion lineage of event SLAM: it shows the full stereo + events + frames + IMU combination is practical on real aerial platforms, in exactly the dark and fast conditions the sensor was designed for. It is a natural study target after ESVO and Ultimate-SLAM, and its open-source release (HKU ArcLab) makes it a common baseline for subsequent event VIO work.

## Related

- [ESVO](esvo.md)
- [Ultimate-SLAM](ultimate-slam.md)
- [EKLT](eklt.md)
- [IMU preintegration](../level-06-vio-vins/imu-preintegration.md)
- [VINS-Fusion](../level-06-vio-vins/vins-fusion.md)
