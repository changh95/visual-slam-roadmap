# MonoSLAM

> Davison 2007 · [Paper](https://ieeexplore.ieee.org/document/4160954)

**One-line summary** — The first real-time monocular SLAM system: a single hand-held camera and an Extended Kalman Filter jointly estimating camera motion and a sparse 3D landmark map at 30 Hz.

## Problem

Before MonoSLAM, real-time SLAM systems required stereo rigs, laser scanners, or wheel odometry; a single camera was considered insufficient because one view provides bearing but no depth, and a bare camera has no motion measurement at all. Davison, Reid, Molton, and Stasse (IEEE TPAMI 2007) showed that a single hand-held camera suffices for real-time SLAM — provided the estimation framework explicitly handles the depth uncertainty of monocular feature initialisation and supplies a motion prior in place of odometry.

## Method & architecture

**One EKF over camera + map.** The state is a single stacked vector with full joint covariance,

$$
\hat{\mathbf{x}} = \begin{pmatrix} \hat{\mathbf{x}}_v \\ \hat{\mathbf{y}}_1 \\ \hat{\mathbf{y}}_2 \\ \vdots \end{pmatrix}, \qquad
\mathbf{P} = \begin{pmatrix} P_{xx} & P_{xy_1} & P_{xy_2} & \cdots \\ P_{y_1x} & P_{y_1y_1} & P_{y_1y_2} & \cdots \\ P_{y_2x} & P_{y_2y_1} & P_{y_2y_2} & \cdots \\ \vdots & \vdots & \vdots & \end{pmatrix},
$$

where each landmark $\mathbf{y}_i$ is a 3D point and the 13-parameter camera state comprises position, orientation quaternion, and linear/angular velocity: $\mathbf{x}_v = (\mathbf{r}^W, \mathbf{q}^{WR}, \mathbf{v}^W, \boldsymbol{\omega}^R)$. The off-diagonal blocks are the point: observing one feature improves the estimates of the camera *and* of all correlated features. Storage and update cost are $O(N^2)$ in map size, bounding the map to roughly 100 features at 30 Hz.

**Constant-velocity motion model (prediction).** With no odometry, a smoothness prior replaces control input: each timestep an unknown acceleration of zero-mean Gaussian profile applies a velocity impulse $\mathbf{n} = (\mathbf{V}^W, \boldsymbol{\Omega}^R) = (\mathbf{a}^W \Delta t, \boldsymbol{\alpha}^R \Delta t)$, giving the state update

$$
\mathbf{f}_v = \begin{pmatrix} \mathbf{r}^W + (\mathbf{v}^W + \mathbf{V}^W)\Delta t \\ \mathbf{q}^{WR} \times \mathbf{q}\big((\boldsymbol{\omega}^R + \boldsymbol{\Omega}^R)\Delta t\big) \\ \mathbf{v}^W + \mathbf{V}^W \\ \boldsymbol{\omega}^R + \boldsymbol{\Omega}^R \end{pmatrix},
\qquad
\mathbf{Q}_v = \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}} P_n \frac{\partial \mathbf{f}_v}{\partial \mathbf{n}}^{\top}.
$$

Small $P_n$ assumes smooth motion; large $P_n$ tolerates jerky motion but demands more measurements per frame.

**Active search (measurement).** A landmark's predicted camera-frame position is $\mathbf{h}_L^R = \mathbf{R}^{RW}(\mathbf{y}_i^W - \mathbf{r}^W)$, projected through a calibrated wide-angle (about 100° FOV) camera model with radial distortion. Propagating state uncertainty through the projection Jacobians yields the $2\times 2$ innovation covariance

$$
\mathbf{S}_i = \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{xx} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v} P_{x y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i x} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{x}_v}^{\top}
+ \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i} P_{y_i y_i} \frac{\partial \mathbf{u}_{di}}{\partial \mathbf{y}_i}^{\top} + \mathbf{R},
$$

which defines an elliptical gate (3 standard deviations) inside which normalized cross-correlation template matching runs. $\mathbf{S}_i$ doubles as an information measure: the 10–12 most informative features are selected per frame, squashing uncertainty along its longest axis.

**Probabilistic feature initialisation.** A new salient patch (Shi–Tomasi) defines only a ray; depth is represented by 100 particles spread uniformly over 0.5–5.0 m along it. Each frame, every depth hypothesis projects to its own search ellipse, matching likelihoods reweight the particles via Bayes' rule, and when the depth ratio $\sigma_d / d < 0.3$ the distribution collapses to a Gaussian and the feature joins the EKF state — typically after 2–4 frames. Map management adds/deletes features to keep a target number visible from any pose.

## Results

- **Real-time budget**: on a 1.6 GHz Pentium M at 30 Hz (33 ms available), a typical frame costs 19 ms — image loading 2 ms, correlation searches 3 ms, Kalman filter update 5 ms, feature initialisation search 4 ms, graphical rendering 5 ms.
- **Ground-truth accuracy**: a hand-held camera revisiting four surveyed way-points (known to about 1 cm) localized to a few centimetres with 1–2 cm jitter — e.g. way-point (1.00, 0.00, 0.62) m estimated at (0.93±0.03, 0.06±0.02, 0.63±0.02) m; residual biases shrank by around 1 cm per loop as SLAM pulled the map into consistency.
- **Applications**: real-time localization of the HRP-2 humanoid walking a 0.75 m-radius circle (fusing its 200 Hz chest gyro as an extra EKF measurement), and live augmented reality with a hand-held camera. Code released as the open-source SceneLib library.

## Why it matters for SLAM

MonoSLAM proved a single cheap camera suffices for real-time SLAM, effectively founding visual SLAM as a field (and beginning Davison's lab's lineage — iMAP, MonoGS, and MASt3R-SLAM come from the same group decades later). It is also the cleanest pedagogical example of filter-based SLAM: one EKF, one joint state, active search from predicted uncertainty — the baseline against which every keyframe-optimisation system since has been argued. Its own paper points at the successors: the depth-particle initialisation directly inspired inverse-depth parameterisations, and the $O(N^2)$ ceiling set the agenda that PTAM and "Visual SLAM: Why Filter?" answered.

## Related

- [PTAM](ptam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [Visual Odometry](visual-odometry.md)
- [ORB-SLAM](orb-slam.md)
- [Scale ambiguity](scale-ambiguity.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md) — the wide-angle model MonoSLAM relies on
