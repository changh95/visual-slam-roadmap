# VINS-Mono

> Qin 2018 · [Paper](https://arxiv.org/abs/1708.03852)

**One-line summary** — VINS-Mono is a complete tightly-coupled monocular visual-inertial estimator — robust initialization, sliding-window optimization with two-way marginalization, tightly-coupled relocalization, and 4-DoF pose-graph loop closure — that became one of the most widely used VIO systems in robotics.

## Problem

A monocular camera with a low-cost IMU forms the *minimum* sensor suite for metric six-DoF state estimation — but the lack of any direct distance measurement poses significant challenges in IMU processing, estimator initialization, extrinsic calibration, and nonlinear optimization. Initialization is usually the most fragile step for monocular VINS, and eliminating long-term drift requires loop detection, relocalization, and global optimization in one system. VINS-Mono's goal was a single robust, versatile, complete package covering all of it, with failure recovery included.

## Method & architecture

The pipeline: KLT optical flow over Shi-Tomasi corners (RANSAC fundamental-matrix outlier rejection) → visual-inertial alignment initialization → sliding-window VIO (Ceres) → marginalization → DBoW2/BRIEF loop detection → tightly-coupled relocalization → 4-DoF pose graph.

- **Initialization by visual-inertial alignment.** A vision-only SfM gives up-to-scale poses; the gyro bias is calibrated by minimizing $\sum_k \lVert \mathbf{q}_{b_{k+1}}^{c_0\,-1} \otimes \mathbf{q}_{b_k}^{c_0} \otimes \boldsymbol{\gamma}_{b_{k+1}}^{b_k} \rVert^2$ against the preintegrated rotations, then velocities, gravity $\mathbf{g}^{c_0}$, and metric scale $s$ are solved in one linear system from the preintegrated $\hat{\boldsymbol{\alpha}}, \hat{\boldsymbol{\beta}}$ terms. The same module performs failure recovery.
- **Sliding-window state and cost.** The state $\mathcal{X} = [\mathbf{x}_0, \dots, \mathbf{x}_n, \mathbf{x}_c^b, \lambda_0, \dots, \lambda_m]$ holds $n{+}1$ IMU states $\mathbf{x}_k = [\mathbf{p}^w_{b_k}, \mathbf{v}^w_{b_k}, \mathbf{q}^w_{b_k}, \mathbf{b}_a, \mathbf{b}_g]$, the camera-IMU extrinsics, and inverse depths $\lambda_l$. The MAP problem (Eq. 22) is
  $$\min_{\mathcal{X}} \Big\{ \big\lVert \mathbf{r}_p - \mathbf{H}_p\mathcal{X} \big\rVert^2 + \sum_{k \in \mathcal{B}} \big\lVert \mathbf{r}_{\mathcal{B}}(\hat{\mathbf{z}}^{b_k}_{b_{k+1}}, \mathcal{X}) \big\rVert^2_{\mathbf{P}^{b_k}_{b_{k+1}}} + \sum_{(l,j) \in \mathcal{C}} \rho\big( \lVert \mathbf{r}_{\mathcal{C}}(\hat{\mathbf{z}}^{c_j}_{l}, \mathcal{X}) \rVert^2_{\mathbf{P}^{c_j}_{l}} \big) \Big\},$$
  with marginalization prior $\{\mathbf{r}_p, \mathbf{H}_p\}$ and Huber loss $\rho$ on the visual terms.
- **Preintegrated IMU residual** (Eq. 24): position/velocity/rotation/bias errors against the preintegrated terms $\hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\beta}}^{b_k}_{b_{k+1}}, \hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}}$, e.g. $\delta\boldsymbol{\alpha} = \mathbf{R}^{b_k}_w\big(\mathbf{p}^w_{b_{k+1}} - \mathbf{p}^w_{b_k} + \tfrac{1}{2}\mathbf{g}^w\Delta t_k^2 - \mathbf{v}^w_{b_k}\Delta t_k\big) - \hat{\boldsymbol{\alpha}}^{b_k}_{b_{k+1}}$ and $\delta\boldsymbol{\theta} = 2\big[\mathbf{q}^{w\,-1}_{b_k} \otimes \mathbf{q}^w_{b_{k+1}} \otimes (\hat{\boldsymbol{\gamma}}^{b_k}_{b_{k+1}})^{-1}\big]_{xyz}$, with biases corrected online.
- **Visual residual on the unit sphere** (Eq. 25): the reprojection error is projected onto the tangent plane $[\mathbf{b}_1\ \mathbf{b}_2]^T$ of the observed unit bearing, so wide-angle/fisheye cameras are handled natively.
- **Two-way marginalization.** If the second-latest frame is a keyframe, the *oldest* frame and its measurements are marginalized (Schur complement) into the prior; otherwise the second-latest frame is simply dropped (its visual measurements discarded, IMU kept) — keeping spatially separated keyframes while preserving sparsity.
- **Relocalization + 4-DoF pose graph.** DBoW2 loop candidates are verified by BRIEF descriptor matching with 2D-2D and PnP RANSAC; retrieved features enter the sliding-window optimization with the loop-frame poses fixed (tightly-coupled relocalization). Marginalized keyframes join a global pose graph whose edges carry only relative position and yaw, with residual $\mathbf{r}_{i,j} = \big[\mathbf{R}(\hat{\phi}_i, \hat{\theta}_i, \psi_i)^{-1}(\mathbf{p}^w_j - \mathbf{p}^w_i) - \hat{\mathbf{p}}^i_{ij};\ \psi_j - \psi_i - \hat{\psi}_{ij}\big]$ — only the four drift-prone DoF (x, y, z, yaw) are optimized because gravity makes roll and pitch observable.

## Results

On EuRoC (MH_03_median, MH_05_difficult) VINS-Mono's pure VIO matches OKVIS mono/stereo in accuracy, and with loop closure it has the smallest translation error. In a 2.5 km mixed indoor/outdoor walk, final drift was [−5.47, 2.76, −0.29] m (**0.88%** of trajectory) without loop closure vs. OKVIS's 2.36%, and [−0.032, 0.09, −0.07] m with loop correction. A 5.62 km, 1 h 34 min handheld circuit of the HKUST campus (25 Hz camera / 200 Hz IMU) ran in real time on an i7-4790 (feature tracking 15+5 ms at 25 Hz, window optimization 50 ms at 10 Hz, loop detection 100 ms, pose-graph optimization 130 ms) and stayed nearly drift-free against the map. Onboard closed-loop MAV flight tracking a figure-eight (61.97 m, loop closure disabled) gave [0.08, 0.09, 0.13] m final drift — **0.29%**. The system was also ported to iOS (VINS-Mobile) and compared against Google Tango on a 264 m walk, with open-source releases for both PC and phone.

## Why it matters for SLAM

VINS-Mono is arguably the reference monocular VIO system: it packaged the sliding-window + marginalization architecture pioneered by OKVIS with a practical linear initialization and a full relocalization/loop-closure back-end, all in one open-source release that runs on drones and phones. Its design choices — preintegration, Huber-robust unit-sphere reprojection factors, two-way marginalization, 4-DoF pose graph — became the standard pattern that later systems (VINS-Fusion, ORB-SLAM3's inertial mode, many commercial trackers) follow or refine.

## Related

- [IMU preintegration](imu-preintegration.md)
- [OKVIS](okvis.md)
- [VINS-Fusion](vins-fusion.md)
- [Marginalization](../level-02-getting-familiar/marginalization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
