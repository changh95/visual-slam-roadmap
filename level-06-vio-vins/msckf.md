# MSCKF
> Mourikis 2007 · [Paper](https://ieeexplore.ieee.org/document/4209642)

**One-line summary** — The Multi-State Constraint Kalman Filter achieves efficient monocular VIO by keeping a sliding window of camera *poses* (not landmarks) in the EKF state and projecting feature measurements onto the left null space of the landmark Jacobian, so complexity stays linear in the number of features.

## Problem
Classic EKF-SLAM puts every 3D landmark position in the state vector, so covariance updates scale quadratically with map size — prohibitive for vision-aided inertial navigation, where feature extractors routinely track hundreds of points per image. Pairwise alternatives (epipolar constraints, relative-pose measurements between image pairs) discard information and reuse the same pixels in statistically correlated constraints. The question MSCKF answered: can a feature track observed from *multiple* camera poses constrain the trajectory optimally, without the feature ever becoming a state variable?

## Method & architecture
The filter follows a three-step loop (Algorithm 1 of the paper): **propagate** on every IMU sample, **augment** on every image, **update** when feature tracks complete.

- **State.** The evolving IMU state is
  $$\mathbf{X}_{\mathrm{IMU}} = \begin{bmatrix} {}^I_G\bar{q}^{\,T} & \mathbf{b}_g^T & {}^G\mathbf{v}_I^T & \mathbf{b}_a^T & {}^G\mathbf{p}_I^T \end{bmatrix}^T,$$
  with unit quaternion ${}^I_G\bar{q}$ (global-to-IMU rotation), gyro/accel biases modeled as random walks, and velocity/position in the global frame; orientation error uses the minimal 3-DoF $\delta\boldsymbol{\theta}$ of the error quaternion $\delta\bar q$. The full state appends up to $N_{\max}$ past camera poses $({}^{C_i}_G\bar q,\, {}^G\mathbf{p}_{C_i})$.
- **Propagation.** IMU estimates are integrated with 5th-order Runge-Kutta; the covariance follows the Lyapunov equation $\dot{\mathbf{P}}_{II} = \mathbf{F}\mathbf{P}_{II} + \mathbf{P}_{II}\mathbf{F}^T + \mathbf{G}\mathbf{Q}_{\mathrm{IMU}}\mathbf{G}^T$ with numerically integrated state-transition matrix $\boldsymbol{\Phi}$.
- **State augmentation.** On each new image the camera pose ${}^{C}_G\hat{\bar q} = {}^{C}_I\bar q \otimes {}^{I}_G\hat{\bar q}$, ${}^G\hat{\mathbf{p}}_C = {}^G\hat{\mathbf{p}}_I + \mathbf{C}_{\hat q}^T\,{}^I\mathbf{p}_C$ is appended and the covariance expanded via its Jacobian.
- **Structureless measurement model (the core contribution).** When a feature $f_j$ tracked over $M_j$ poses is lost, its position ${}^G\hat{\mathbf{p}}_{f_j}$ is triangulated by Gauss-Newton least squares with inverse-depth parametrization. Stacking the linearized reprojection residuals of all its observations gives
  $$\mathbf{r}^{(j)} \simeq \mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{H}^{(j)}_{f}\,{}^G\widetilde{\mathbf{p}}_{f_j} + \mathbf{n}^{(j)}.$$
  Because the triangulation used the state estimate, $\mathbf{r}^{(j)}$ is correlated with $\widetilde{\mathbf{X}}$; projecting onto the left null space of $\mathbf{H}^{(j)}_f$ (basis $\mathbf{A}$) removes the feature error exactly:
  $$\mathbf{r}^{(j)}_o = \mathbf{A}^T(\mathbf{z}^{(j)} - \hat{\mathbf{z}}^{(j)}) \simeq \mathbf{A}^T\mathbf{H}^{(j)}_{\mathbf{X}}\widetilde{\mathbf{X}} + \mathbf{A}^T\mathbf{n}^{(j)},$$
  a $(2M_j-3)$-dimensional constraint coupling *all* poses that saw the feature — optimal up to linearization, computed implicitly with Givens rotations in $O(M_j^2)$.
- **Update.** Residuals of all $L$ completed features are stacked, and a QR decomposition $\mathbf{H}_X = \begin{bmatrix}\mathbf{Q}_1 & \mathbf{Q}_2\end{bmatrix}\begin{bmatrix}\mathbf{T}_H \\ \mathbf{0}\end{bmatrix}$ compresses them to $\mathbf{r}_n = \mathbf{Q}_1^T\mathbf{r}_o = \mathbf{T}_H\widetilde{\mathbf{X}} + \mathbf{n}_n$ before the standard EKF update with gain $\mathbf{K} = \mathbf{P}\mathbf{T}_H^T\big(\mathbf{T}_H\mathbf{P}\mathbf{T}_H^T + \mathbf{R}_n\big)^{-1}$. Moving-object outliers are rejected with a Mahalanobis test. When the window is full, $N_{\max}/3$ evenly spaced poses are pruned (the oldest is kept — longer baselines carry more information).

Total cost: linear in features, at most cubic in the (bounded) number of windowed poses.

## Results
Evaluated on a real-world urban drive in Minneapolis: a Pointgrey FireFly camera (640×480 @ 3 Hz) and an ISIS IMU (100 Hz) on a car, 1598 images over about 9 minutes, SIFT features, at most 30 camera poses in the state. Along the 3.2 km trajectory, 142,903 feature tracks were used for EKF updates, processed at 14 Hz on a single core of a 2 GHz Intel T7200 — faster than the 3 Hz sensor rate. The final position error was approximately 10 m, i.e. **0.31% of the traveled distance**, with no loop closure and no motion priors; estimated 3σ accuracy was better than 1° in attitude and 0.35 m/s in velocity.

## Why it matters for SLAM
MSCKF founded the filter-based branch of VIO and its structureless measurement model became standard well beyond filtering (e.g., smart factors in GTSAM/Kimera). It is the direct ancestor of S-MSCKF (stereo), ROVIO-era EKF designs, and OpenVINS, and the follow-up literature on its linearization behavior produced the observability/consistency analysis (First-Estimate Jacobians) that all modern filter-based VIO relies on. Its efficiency profile is why MSCKF-style estimators are widely associated with deployed AR/VR tracking stacks. When accuracy-per-CPU-cycle matters more than absolute accuracy, MSCKF is still the reference design.

## Related
- [OpenVINS](openvins.md) — the modern open-source MSCKF with FEJ and online calibration.
- [StereoMSCKF](../level-07-stereo-slam/stereomsckf.md) — the stereo extension (S-MSCKF).
- [ROVIO](rovio.md) — the other landmark filter-based VIO, using direct photometric updates.
- [Filter-based vs Optimization-based](filter-based-vs-optimization-based.md) — where MSCKF sits in the design space.
- [Observability](observability.md) — the analysis tradition MSCKF spawned.
- [Deployed VIO](deployed-vio.md) — where MSCKF-class efficiency matters most.
