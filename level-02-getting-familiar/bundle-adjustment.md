# Bundle Adjustment

**Bundle Adjustment (BA)** is the joint nonlinear refinement of camera poses and 3D landmark positions that minimizes total reprojection error. The name comes from the "bundles of rays" connecting each camera center to the 3D points it observes — BA adjusts poses and points until these bundles agree with the image measurements as well as possible. It is the gold-standard back-end of feature-based SLAM and structure-from-motion.

## The cost function

For camera pose $T_i \in SE(3)$ observing landmark $\mathbf{X}_j \in \mathbb{R}^3$ at pixel measurement $\mathbf{z}_{ij}$, the **reprojection error** is

$$\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\big(T_i\, \mathbf{X}_j\big)$$

where $\pi : \mathbb{R}^3 \to \mathbb{R}^2$ is the camera projection function (pinhole model plus distortion). BA solves

$$\min_{\{T_i\},\, \{\mathbf{X}_j\}} \sum_{(i,j) \in \mathcal{O}} \rho\big(\mathbf{e}_{ij}^T\, \Omega_{ij}\, \mathbf{e}_{ij}\big)$$

where $\mathcal{O}$ is the set of (pose, point) observation pairs, $\Omega_{ij} = \Sigma_{ij}^{-1}$ is the information matrix (inverse measurement covariance, typically scaled per pyramid level), and $\rho$ is an optional robust kernel (e.g., Huber) that caps the influence of outlier matches. Under Gaussian noise and correct associations, this is exactly the maximum-likelihood estimate.

## How it is solved

BA is a nonlinear least-squares problem, solved iteratively with Gauss-Newton or Levenberg-Marquardt. Each iteration linearizes the residuals around the current estimate, $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J\,\Delta\mathbf{x}$, and solves the (damped) normal equations

$$\big(J^T \Omega J + \lambda I\big)\, \Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$$

Poses live on the $SE(3)$ manifold, so updates use a local parameterization: a 6-vector $\boldsymbol{\xi}$ is mapped through the exponential map and composed with the current pose, $T \leftarrow T \cdot \exp(\hat{\boldsymbol{\xi}})$, keeping the state a valid rigid transform at every step.

## Sparsity and the Schur complement

Each residual involves exactly **one pose and one point**, so the Hessian approximation $H = J^T \Omega J$ has the block structure

$$H = \begin{bmatrix} B & E \\ E^T & C \end{bmatrix}$$

with $B$ ($6m \times 6m$) coupling only poses, $C$ ($3n \times 3n$) coupling only points, and $E$ the pose-point cross terms. Crucially, $C$ is **block-diagonal** with independent $3 \times 3$ blocks per landmark, so it is trivially invertible. The **Schur complement** eliminates the points first:

$$\big(B - E\, C^{-1} E^T\big)\, \Delta\mathbf{x}_{\text{cam}} = -\mathbf{b}_{\text{cam}} + E\, C^{-1}\, \mathbf{b}_{\text{pts}}$$

reducing a $(6m + 3n)$-dimensional solve to a $6m$-dimensional one — decisive when $n \gg m$ (thousands of points, tens of keyframes). Landmark updates are then recovered by cheap back-substitution. This structure exploitation is what makes real-time BA feasible; it is built into g2o, Ceres, and GTSAM.

**Gauge freedom**: the cost is invariant to a global rigid transform of all poses and points (7 degrees of freedom for monocular, where scale is also free). Solvers fix this by anchoring the first keyframe (and, for monocular, one scale reference) or adding a prior; otherwise $H$ is singular.

## Flavors used in practice

- **Motion-only BA**: fix landmarks, optimize a single camera pose — the tracking-thread pose refinement in ORB-SLAM.
- **Local BA**: optimize a window of recent/covisible keyframes and their landmarks, with neighboring keyframes fixed as anchors — runs continuously in the mapping thread.
- **Global BA**: optimize everything, typically after a loop closure, often initialized by pose-graph optimization to bring the trajectory close before the expensive full refinement.
- **Structure-only BA**: fix poses, refine points (e.g., after triangulating new landmarks).

## Why it matters for SLAM

BA is the accuracy engine of modern visual SLAM: keyframe-based systems owe their precision to repeatedly re-optimizing poses and structure against raw image measurements rather than trusting incremental estimates. The comparison by Strasdat et al. that "optimization beats filtering" for visual SLAM is essentially a statement about BA. Understanding its sparse structure — and the Schur trick — also explains the architecture of every serious SLAM back-end library and why keyframe selection (keeping $m$ small) matters so much.

## Related

- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Levenberg-Marquardt](levenberg-marquardt.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
- [M-estimator](m-estimator.md)
