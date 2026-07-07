# Lie groups

Camera poses live in $\mathrm{SE}(3)$ and rotations in $\mathrm{SO}(3)$ — these are **manifolds**, not vector spaces. You cannot add two rotation matrices and get a rotation, so standard "update $x \leftarrow x + \Delta x$" optimization does not directly apply. **Lie theory** bridges this gap: each Lie group (the curved space of rotations/poses) has an associated **Lie algebra** (a flat vector space tangent to the group at identity), connected by the exponential and logarithm maps. Optimizers work in the flat algebra and map updates back onto the group.

**so(3) and SO(3).** The Lie algebra $\mathfrak{so}(3)$ consists of $3 \times 3$ skew-symmetric matrices $[\boldsymbol{\phi}]_\times$, parameterized by a vector $\boldsymbol{\phi} \in \mathbb{R}^3$ (axis times angle). The exponential map is Rodrigues' rotation formula:

$$
R = \exp([\boldsymbol{\phi}]_\times) = I + \frac{\sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|}[\boldsymbol{\phi}]_\times + \frac{1-\cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times^2
$$

The logarithm map $\log: \mathrm{SO}(3) \to \mathfrak{so}(3)$ is its inverse — it recovers the rotation vector from a rotation matrix.

**se(3) and SE(3).** For rigid-body poses, elements of $\mathfrak{se}(3)$ are parameterized by $\boldsymbol{\xi} = [\boldsymbol{\rho}^T, \boldsymbol{\phi}^T]^T \in \mathbb{R}^6$ (translation part $\boldsymbol{\rho}$, rotation part $\boldsymbol{\phi}$):

$$
\hat{\boldsymbol{\xi}} = \begin{bmatrix} [\boldsymbol{\phi}]_\times & \boldsymbol{\rho} \\ \mathbf{0}^T & 0 \end{bmatrix}, \qquad
T = \exp(\hat{\boldsymbol{\xi}}) = \begin{bmatrix} \exp([\boldsymbol{\phi}]_\times) & J\boldsymbol{\rho} \\ \mathbf{0}^T & 1 \end{bmatrix}
$$

where $J$ is the **left Jacobian** of $\mathrm{SO}(3)$:

$$
J = I + \frac{1 - \cos\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^2}[\boldsymbol{\phi}]_\times + \frac{\|\boldsymbol{\phi}\| - \sin\|\boldsymbol{\phi}\|}{\|\boldsymbol{\phi}\|^3}[\boldsymbol{\phi}]_\times^2
$$

**Why this parameterization wins.** A pose has exactly 6 degrees of freedom, and $\boldsymbol{\xi} \in \mathbb{R}^6$ is a *minimal*, singularity-managed parameterization for local updates: no constraints to maintain (unlike a $3\times4$ matrix or a unit quaternion), no gimbal lock (unlike Euler angles at their singularity). In SLAM optimization, each iteration solves for a small update $\boldsymbol{\xi}$ in the algebra and applies it as a **perturbation** on the group:

$$
T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}}) \quad \text{(right perturbation)} \qquad \text{or} \qquad T \leftarrow \exp(\hat{\boldsymbol{\xi}}) \cdot T \quad \text{(left perturbation)}
$$

Jacobians of residuals (e.g., reprojection error) are derived with respect to $\boldsymbol{\xi}$, evaluated at $\boldsymbol{\xi} = 0$.

## A worked perturbation Jacobian

The whole calculus reduces to one move: expand $\exp$ to first order, $\exp([\delta\boldsymbol{\phi}]_\times) \approx I + [\delta\boldsymbol{\phi}]_\times$, and use $[\mathbf{a}]_\times \mathbf{b} = -[\mathbf{b}]_\times \mathbf{a}$. For a rotated point $R\mathbf{p}$ under a left perturbation:

$$
\exp([\delta\boldsymbol{\phi}]_\times)\, R\,\mathbf{p} \;\approx\; (I + [\delta\boldsymbol{\phi}]_\times) R \mathbf{p}
= R\mathbf{p} + [\delta\boldsymbol{\phi}]_\times R\mathbf{p}
= R\mathbf{p} - [R\mathbf{p}]_\times\, \delta\boldsymbol{\phi}
$$

so $\partial(R\mathbf{p})/\partial\,\delta\boldsymbol{\phi} = -[R\mathbf{p}]_\times$. The right-perturbation version follows the same two lines and gives $-R[\mathbf{p}]_\times$. Chain this with the projection Jacobian $\partial\pi/\partial\mathbf{p}$ and you have derived the reprojection-error Jacobian used by every bundle-adjustment implementation — no matrix calculus tables required.

## In code

Sophus is the standalone C++ implementation of this machinery (Eigen-based), and its API mirrors the math one-to-one:

```cpp
#include <sophus/se3.hpp>

Eigen::Matrix<double, 6, 1> xi = ...;      // twist in se(3)
Sophus::SE3d T = Sophus::SE3d::exp(xi);    // exp map: algebra -> group
Eigen::Matrix<double, 6, 1> back = T.log();// log map: group -> algebra

T = T * Sophus::SE3d::exp(delta);          // right-perturbation update step
```

The same pattern is baked into every SLAM library: g2o's `SE3` vertices, Ceres' manifolds (local parameterizations), and GTSAM's `Pose3`. The machinery extends to $\mathrm{Sim}(3)$ (pose + scale), which monocular SLAM uses for loop closure because scale drifts along the trajectory.

## Common pitfalls

- **Small-angle numerics**: the $\sin\theta/\theta$-style coefficients in $\exp$, $\log$, and $J$ are $0/0$ at $\theta = 0$; implementations must switch to Taylor expansions near zero (libraries do this — your own scratch implementation must too).
- **$\log$ near $\pi$**: recovering the axis from a rotation by almost $180°$ is ill-conditioned; be careful when averaging or interpolating large rotations.
- **Left vs. right conventions**: papers and libraries freely mix left/right perturbations; the Jacobians differ (see the worked example), and silently mixing conventions is a classic source of "optimizer converges to garbage" bugs.
- **Quaternion double cover**: $q$ and $-q$ encode the same rotation; residuals and interpolation must handle the sign, or errors near $2\pi$ appear.
- **Forgetting the manifold in the solver**: feeding a raw 4-parameter quaternion or 9-parameter rotation matrix to an optimizer without a local parameterization lets the update leave the manifold — Ceres' manifold API, g2o's vertex implementations, and GTSAM's types exist precisely to prevent this.

## Why it matters for SLAM

Every optimization-based SLAM component — bundle adjustment, pose graph optimization, IMU preintegration, direct image alignment — differentiates residuals with respect to poses, and Lie group machinery is *how* that is done correctly. Residuals between poses are themselves expressed via $\log$ (as in pose graph costs $\|\log(T_{ij}^{-1} T_i^{-1} T_j)\|^2$). If you cannot read $\exp$/$\log$/perturbation notation fluently, back-end papers are unreadable; once you can, they all look pleasantly alike.

## Hands-on

- [Eigen + Sophus hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)

## Related

- [Rigid body motion](../level-01-beginner/rigid-body-motion.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Quaternion kinematics for error-state KF](../level-06-vio-vins/quaternion-kinematics-for-error-state-kf.md)
- [Lietorch](../level-05-deep-learning/lietorch.md)
