# Extended Kalman Filter (EKF)

The **Extended Kalman Filter** is the workhorse of recursive state estimation with nonlinear models. It maintains a Gaussian belief $\mathcal{N}(\hat{\mathbf{x}}, P)$ over the state and alternates two steps — **predict** (propagate the belief through a motion model) and **update** (correct it with a measurement) — which is exactly the recursive Bayes filter with all densities approximated as Gaussians and all models linearized at the current estimate.

## Setup

The system is described by a nonlinear motion model and a nonlinear observation model:

$$
\mathbf{x}_k = f(\mathbf{x}_{k-1}, \mathbf{u}_k) + \mathbf{w}_k, \qquad \mathbf{w}_k \sim \mathcal{N}(\mathbf{0}, Q_k)
$$

$$
\mathbf{z}_k = h(\mathbf{x}_k) + \mathbf{v}_k, \qquad \mathbf{v}_k \sim \mathcal{N}(\mathbf{0}, R_k)
$$

where $\mathbf{x}$ is the state (e.g., camera pose, velocity, landmark positions), $\mathbf{u}$ a control or IMU input, $\mathbf{z}$ a measurement (e.g., pixel coordinates of a tracked feature), and $Q$, $R$ the process and measurement noise covariances. The EKF linearizes $f$ and $h$ with their Jacobians evaluated at the current estimate:

$$
F_k = \left.\frac{\partial f}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k-1|k-1}}, \qquad
H_k = \left.\frac{\partial h}{\partial \mathbf{x}}\right|_{\hat{\mathbf{x}}_{k|k-1}}
$$

## Predict

$$
\hat{\mathbf{x}}_{k|k-1} = f(\hat{\mathbf{x}}_{k-1|k-1}, \mathbf{u}_k)
$$

$$
P_{k|k-1} = F_k P_{k-1|k-1} F_k^T + Q_k
$$

The mean is pushed through the full nonlinear model; only the covariance uses the linearization. Uncertainty grows in this step (dead-reckoning drift).

## Update

$$
\mathbf{y}_k = \mathbf{z}_k - h(\hat{\mathbf{x}}_{k|k-1}) \qquad \text{(innovation)}
$$

$$
S_k = H_k P_{k|k-1} H_k^T + R_k \qquad \text{(innovation covariance)}
$$

$$
K_k = P_{k|k-1} H_k^T S_k^{-1} \qquad \text{(Kalman gain)}
$$

$$
\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + K_k \mathbf{y}_k, \qquad
P_{k|k} = (I - K_k H_k)\, P_{k|k-1}
$$

The gain $K_k$ weighs the measurement against the prediction: confident predictions (small $P$) or noisy sensors (large $R$) yield small corrections, and vice versa. The innovation covariance $S_k$ also supports **gating** — a Mahalanobis test $\mathbf{y}^T S^{-1} \mathbf{y} < \chi^2$ threshold rejects outlier measurements before they corrupt the state.

## EKF-SLAM

In EKF-SLAM (the formulation behind MonoSLAM), the state stacks the camera/robot pose and all landmark positions,

$$
\mathbf{x} = \begin{bmatrix} \mathbf{x}_{\text{robot}}^T & \mathbf{m}_1^T & \cdots & \mathbf{m}_n^T \end{bmatrix}^T,
$$

and $P$ stores the full joint covariance including pose-landmark and landmark-landmark correlations. Those cross-correlations are what makes loop closure work in a filter: correcting the pose also drags every correlated landmark. The costs are structural:

- **Quadratic scaling**: $P$ has $O(n^2)$ entries and each update touches all of them, capping real-time EKF-SLAM at small maps (on the order of tens to a hundred landmarks).
- **Linearization error**: Jacobians are evaluated at the current estimate once, and errors are baked permanently into $P$ — unlike optimization approaches, the filter cannot re-linearize the past. This causes the well-known **inconsistency** (overconfidence) of EKF-SLAM.
- **Rotation handling**: naive parameterizations of orientation misbehave; practical filters use the **error-state (indirect) EKF**, where the filter estimates a small error around a nominal state and quaternion kinematics handle attitude.

These limitations are why modern visual SLAM moved to keyframe-based nonlinear optimization ("why filter?" debate, Strasdat et al.), while filtering survives where its constant-time recursive form shines: visual-inertial odometry (MSCKF, ROVIO, error-state EKFs) and sensor fusion of odometry with GPS/RADAR/wheel encoders.

## Why it matters for SLAM

The EKF is the historical foundation of SLAM (EKF-SLAM was *the* solution for a decade) and is still the backbone of production VIO (MSCKF derivatives run on many AR headsets and drones). Even in optimization-centric pipelines, EKF concepts are everywhere: prediction/update structure, innovation gating for outlier rejection, covariance propagation for uncertainty, and marginalization (a fixed-lag smoother's marginalization step is algebraically a Kalman update). Understanding when the EKF's single-linearization assumption breaks is the key to understanding why bundle adjustment wins on accuracy and why MSCKF-style filters delay linearization.

## Related

- [MonoSLAM](../level-03-monocular-slam/monoslam.md)
- [MSCKF](../level-06-vio-vins/msckf.md)
- [Filter-based vs Optimization-based](../level-06-vio-vins/filter-based-vs-optimization-based.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Non-linear optimization](non-linear-optimization.md)
