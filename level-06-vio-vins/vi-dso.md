# VI-DSO

> von Stumberg 2018 · [Paper](https://arxiv.org/abs/1804.05625)

**One-line summary** — VI-DSO tightly integrates preintegrated IMU factors into DSO's direct sparse photometric bundle adjustment, explicitly optimizing metric scale and gravity direction so the system can initialize immediately with an arbitrary scale — kept consistent by a novel "dynamic marginalization" scheme.

## Problem

Monocular direct odometry (DSO) delivers excellent accuracy but only up to an unknown scale. An IMU makes scale observable — yet often *not immediately*: for certain motions (e.g., zero acceleration at constant velocity) immediate initialization is impossible, which is why VI ORB-SLAM waits 15 seconds of camera motion before initializing on EuRoC. Meanwhile, sliding-window estimators keep computation bounded via partial marginalization, and the linearized prior becomes inconsistent if the scale estimate later moves far from the value at which the prior was linearized. VI-DSO addresses both problems at once.

## Method & architecture

Two components run in parallel: **coarse tracking** estimates every frame's pose by direct image alignment against the latest keyframe plus an inertial term (geometry and scale fixed), and whenever a new keyframe is created a **visual-inertial bundle adjustment** re-estimates geometry and poses of all active keyframes by minimizing the combined energy

$$E_{\text{total}} = \lambda \cdot E_{\text{photo}} + E_{\text{inertial}}$$

The photometric term is DSO's error for a point $\boldsymbol{p}$ hosted in keyframe $i$ and observed in frame $j$:

$$E_{\boldsymbol{p}j} = \sum_{\mathbf{p}\in\mathcal{N}_{\boldsymbol{p}}} \omega_{\boldsymbol{p}} \left\lVert (I_j[\boldsymbol{p}'] - b_j) - \frac{t_j e^{a_j}}{t_i e^{a_i}} (I_i[\boldsymbol{p}] - b_i) \right\rVert_{\gamma}$$

with $\mathcal{N}_{\boldsymbol{p}}$ a small pixel neighborhood, $t_i, t_j$ exposure times, $a_i, b_i, a_j, b_j$ affine illumination parameters, $\omega_{\boldsymbol{p}}$ a gradient-dependent weight and $\gamma$ the Huber norm — so *any* pixel with a large enough intensity gradient can be tracked, not just corners. IMU measurements between consecutive keyframes are preintegrated into a single factor: with predicted state $\widehat{\boldsymbol{s}}_j$ and covariance $\widehat{\boldsymbol{\Sigma}}_{s,j}$,

$$E_{\text{inertial}}(\boldsymbol{s}_i, \boldsymbol{s}_j) = \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)^{T} \widehat{\boldsymbol{\Sigma}}_{s,j}^{-1} \left(\boldsymbol{s}_j \boxminus \widehat{\boldsymbol{s}}_j\right)$$

Each keyframe's state stacks pose, velocity, IMU biases, affine brightness and the inverse depths of its hosted points,

$$\boldsymbol{s}_i = \big[(\boldsymbol{\xi}^{D}_{cam_i\_w})^{T},\ \boldsymbol{v}_i^{T},\ \boldsymbol{b}_i^{T},\ a_i,\ b_i,\ d_i^{1}, \dots, d_i^{m}\big]^{T}$$

and the full state additionally contains camera intrinsics and $\boldsymbol{\xi}_{m\_d} \in \mathfrak{sim}(3)$, a translation-free SIM(3) transform between the scale/gravity-free "DSO frame" and the metric frame. Photometric errors are evaluated in the DSO frame (scale-independent), inertial errors in the metric frame — so **scale and gravity direction are explicit variables** optimized jointly with everything else by Gauss–Newton, where $\mathbf{H} = \mathbf{H}_{\text{photo}} + \mathbf{H}_{\text{imu}}$ and the inertial block is mapped between the two state representations via a relative Jacobian $\mathbf{J}_{\text{rel}}$. The gap between consecutive keyframes is kept below 0.5 s so preintegration stays accurate.

**Initialization** — DSO's visual initializer (average depth normalized to 1), gravity direction from averaging up to 40 accelerometer measurements, zero velocity and biases, scale 1.0; all jointly refined afterwards, so inertial data improves pose estimation from the very first frames.

**Dynamic marginalization** — marginalizing old keyframes via the Schur complement (with First-Estimate Jacobians) freezes linearization points, which is unsafe while scale is still converging. VI-DSO therefore maintains three marginalization priors: $M_{\text{visual}}$ (scale-independent visual factors only), $M_{\text{curr}}$ (all factors since the scale linearization point; used in the optimization) and $M_{\text{half}}$ (only recent states whose scale is close to the current estimate), enforcing

$$\forall i \in M_{\text{curr}}:\ s_i \in \left[\, s_{\text{middle}}/d_i,\ s_{\text{middle}} \cdot d_i \,\right]$$

Whenever the scale estimate exceeds the interval boundary, the priors are cascaded ($M_{\text{curr}} \leftarrow M_{\text{half}}$, $M_{\text{half}} \leftarrow M_{\text{visual}}$) and the interval center $s_{\text{middle}}$ shifts — so the optimization always keeps *some* inertial history with a consistent scale, with the interval size $d_i$ adapted dynamically ($d_{\text{min}} = \sqrt{1.1}$).

## Results

On EuRoC (left camera, each sequence run 10 times, median RMSE, real-time): 0.062 / 0.044 / 0.117 / 0.132 / 0.121 m on MH1–MH5 and 0.059 / 0.067 / 0.096 / 0.040 / 0.062 / 0.174 m on V11–V23 — every sequence under 0.23 m, and the only evaluated method besides ROVIO that fails on none. VI-DSO beats monocular VI odometry (Leutenegger et al.) on every sequence and even the stereo/SLAM variants (Kasyanov et al.) on 9 of 11. Against VI ORB-SLAM (a full SLAM system, evaluated on its bundle-adjusted keyframe trajectory) it is competitive in RMSE without any loop closures and more robust — ORB-SLAM's initialization fails on V1_03_difficult. Scale estimation is also better: average scale error 0.7% vs 1.0%, maximum 1.2% vs 3.4%. Visual-only DSO cannot process V1_03/V2_03 at all; ROVIO is robust but, as a filter, far less accurate.

## Why it matters for SLAM

VI-DSO demonstrated that visual-inertial fusion is not exclusive to feature-based pipelines: direct photometric bundle adjustment accommodates IMU factors and delivers EuRoC accuracy competitive with mature feature-based VIO. It is a key link in the DSO lineage (DSO → Stereo DSO / LDSO → VI-DSO → DM-VIO): joint in-window estimation of scale and gravity became a common pattern for visual-inertial initialization, and dynamic marginalization is the direct precursor of DM-VIO's delayed marginalization.

## Related

- [DSO](../level-03-monocular-slam/dso.md)
- [DM-VIO](dm-vio.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)
- [IMU preintegration](imu-preintegration.md)
- [VINS-Mono](vins-mono.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
