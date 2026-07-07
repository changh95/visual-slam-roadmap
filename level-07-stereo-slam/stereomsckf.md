# StereoMSCKF

> Sun 2018 · [Paper](https://arxiv.org/abs/1712.00036)

**One-line summary** — StereoMSCKF (S-MSCKF) adapts the MSCKF filter-based VIO framework to stereo cameras, matching the computational cost of monocular solutions while providing significantly greater robustness — enabling fast autonomous MAV flight on embedded processors.

## Problem

Vision-aided inertial odometry had matured, but computational efficiency and robustness remained open challenges for autonomous flight with micro aerial vehicles, whose size and weight constraints rule out high-quality sensors and powerful processors. MAVs in search-and-rescue face drastic lighting changes, low texture, and abrupt attitude changes from wind gusts — the VIO must be robust, yet share the onboard computer with planning and control without CPU spikes. Previous stereo visual-inertial solutions were computationally expensive and optimization-based; S-MSCKF contradicts the belief that stereo must cost much more than monocular, delivering the first open-source filter-based stereo VIO that runs onboard without GPU acceleration.

## Method & architecture

**Front-end (≈80% of the compute).** FAST corners are tracked temporally with KLT optical flow, and — unusually — KLT is also used for left-right stereo matching instead of descriptors, which the authors found to cost far more CPU for a small accuracy gain. Outliers are removed by 2-point RANSAC on temporal tracks plus circular matching across the previous and current stereo pairs. Empirically, features deeper than 1 m are reliably matched with their 20 cm baseline.

**Filter state.** The EKF estimates the IMU state (with camera-IMU extrinsics) plus a sliding window of $N$ camera poses:

$$\mathbf{x}_{I}=\left({}^{I}_{G}\mathbf{q}^{\top}\;\; \mathbf{b}_{g}^{\top}\;\; {}^{G}\mathbf{v}^{\top}_{I}\;\; \mathbf{b}_{a}^{\top}\;\; {}^{G}\mathbf{p}^{\top}_{I}\;\; {}^{I}_{C}\mathbf{q}^{\top}\;\; {}^{I}\mathbf{p}^{\top}_{C}\right)^{\top}$$

where ${}^{I}_{G}\mathbf{q}$ is the world-to-IMU rotation, ${}^{G}\mathbf{v}_I,{}^{G}\mathbf{p}_I$ velocity/position, $\mathbf{b}_g,\mathbf{b}_a$ gyro/accelerometer biases. An error-state formulation ($\delta\mathbf{q}\approx(\tfrac12\,{}^{G}_{I}\tilde{\boldsymbol\theta}^\top\;\;1)^\top$) keeps orientation uncertainty 3-dimensional; propagation uses 4th-order Runge-Kutta integration of the IMU dynamics $\dot{\tilde{\mathbf{x}}}_I=\mathbf{F}\tilde{\mathbf{x}}_I+\mathbf{G}\mathbf{n}_I$.

**Stereo measurement model.** Each feature $f_j$ observed at camera pose $i$ contributes a 4D measurement stacking both views,

$$\mathbf{z}_{i}^{j}=\left(u_{i,1}^{j}\;\; v_{i,1}^{j}\;\; u_{i,2}^{j}\;\; v_{i,2}^{j}\right)^{\top},$$

the projections of the feature position in the left ($C_{i,1}$) and right ($C_{i,2}$) camera frames; keeping it in $\mathbb{R}^4$ rather than $\mathbb{R}^3$ removes the need for stereo rectification. When a track ends, the feature position ${}^{G}\mathbf{p}_j$ is triangulated by least squares, the stacked residual is linearized as $\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x}}^{j}\tilde{\mathbf{x}}+\mathbf{H}_{f}^{j}\,{}^{G}\tilde{\mathbf{p}}_{j}+\mathbf{n}^{j}$, and the feature is projected out via the null space $\mathbf{V}$ of $\mathbf{H}_f^j$:

$$\mathbf{r}^{j}_{o}=\mathbf{V}^{\top}\mathbf{r}^{j}=\mathbf{H}_{\mathbf{x},o}^{j}\tilde{\mathbf{x}}+\mathbf{n}^{j}_{o}$$

so landmarks never enter the state — the structureless MSCKF trick, now fed with stereo geometry that gives metric depth from a single frame.

**Consistency and marginalization.** VIO has four unobservable directions (global position and yaw); a naive EKF gains spurious yaw information. S-MSCKF applies the Observability Constrained EKF (OC-EKF), chosen over FEJ because it depends less on accurate initialization. Instead of MSCKF's marginalizing a third of poses at once (CPU spikes), two camera states are removed every other update, selected by a two-way keyframe-like strategy based on relative motion.

## Results

- **EuRoC** (20 Hz stereo, 200 Hz IMU), against OKVIS (stereo-optimization), ROVIO (mono-filter), VINS-Mono (mono-optimization), 5 runs each: accuracy of the four is similar except ROVIO drifts more in the machine-hall scenes; S-MSCKF fails only on `V2_03_difficult`, where continuous brightness inconsistency between the stereo images breaks KLT stereo matching. Filter-based methods use the least CPU; the S-MSCKF filter itself takes ~10% of one core at 20 Hz, with ~80% of total compute in the front-end.
- **Fast flight dataset** (public): four runs over an airport runway at top speeds of 5, 10, 15 and 17.5 m/s (40 Hz 960×800 stereo, 200 Hz IMU). S-MSCKF achieves the lowest CPU usage while maintaining accuracy similar to OKVIS and VINS-Mono (RMSE vs GPS in x-y); ROVIO was omitted due to significant scale drift.
- **Autonomous flight**: full onboard estimation through a wooded area, warehouse entry, and return — over a 700 m round trip the final drift is about 3 m, under 0.5% of distance traveled, despite indoor-outdoor lighting transitions.
- Open-source release: `KumarRobotics/msckf_vio`.

## Why it matters for SLAM

S-MSCKF established the standard stereo filter-based VIO recipe: stereo KLT front-end for instantaneous depth, structureless MSCKF back-end for efficiency, OC-EKF for consistency. It demonstrated concretely that for compute-limited aerial robots a well-engineered EKF can rival optimization-based systems at a fraction of the cost, a trade-off later systematized by OpenVINS. If your platform is a small drone or an embedded board, this lineage — MSCKF → S-MSCKF → OpenVINS — is usually where you start.

## Related

- [MSCKF](../level-06-vio-vins/msckf.md)
- [OpenVINS](../level-06-vio-vins/openvins.md)
- [VINS-Mono](../level-06-vio-vins/vins-mono.md)
- [OKVIS](../level-06-vio-vins/okvis.md)
- [ROVIO](../level-06-vio-vins/rovio.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Scale observability](scale-observability.md)
