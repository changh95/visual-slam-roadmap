# Reprojection Error

The **reprojection error** is the fundamental geometric residual of visual SLAM: it measures how well a hypothesized 3D point and camera pose explain an actual 2D feature observation. Take a 3D point $\mathbf{X}_j$ (world frame), a camera pose $T_i \in SE(3)$ (world-to-camera), and the observed pixel location $\mathbf{z}_{ij}$ of that point in image $i$:

$$
\mathbf{e}_{ij} = \mathbf{z}_{ij} - \pi\!\left(T_i \mathbf{X}_j\right)
$$

where $\pi : \mathbb{R}^3 \to \mathbb{R}^2$ is the camera projection function. For a pinhole camera with intrinsics $(f_x, f_y, c_x, c_y)$ and camera-frame point $\mathbf{X}^c = (X, Y, Z)^T = T_i \mathbf{X}_j$:

$$
\pi(\mathbf{X}^c) = \begin{bmatrix} f_x \, X / Z + c_x \\ f_y \, Y / Z + c_y \end{bmatrix}
$$

The error lives in **pixels** — directly comparable to the feature detector's localization noise (typically around a pixel), which makes it easy to set thresholds and covariances.

## From residual to cost function

Under the assumption of Gaussian observation noise $\mathbf{z}_{ij} \sim \mathcal{N}\left(\pi(T_i\mathbf{X}_j), \Sigma_{ij}\right)$, maximum-likelihood estimation of poses and points is exactly the weighted nonlinear least-squares problem

$$
C = \sum_{(i,j) \in \mathcal{O}} \mathbf{e}_{ij}^T \, \Omega_{ij} \, \mathbf{e}_{ij}
$$

where $\Omega_{ij} = \Sigma_{ij}^{-1}$ is the **information matrix** and $\mathcal{O}$ is the set of (pose, point) observation pairs. Each summand is a squared Mahalanobis distance; in practice $\Sigma_{ij}$ is often isotropic and scaled with the image-pyramid level at which the feature was detected (coarser level = noisier = lower weight).

Because false matches produce huge residuals that would dominate a quadratic cost, real systems wrap each term in a **robust kernel** $\rho$ (Huber, Cauchy), giving $\sum \rho\left(\mathbf{e}_{ij}^T \Omega_{ij} \mathbf{e}_{ij}\right)$, and prune observations whose chi-square value exceeds a threshold.

## Optimization

The cost is nonlinear in the pose (through the $SE(3)$ action and the perspective division). Linearizing $\mathbf{e}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{e}(\mathbf{x}) + J \Delta\mathbf{x}$ around the current estimate and solving the Gauss–Newton normal equations $\left(J^T \Omega J\right)\Delta\mathbf{x} = -J^T \Omega\, \mathbf{e}$ iteratively is the standard approach. By the chain rule the Jacobian factors into

$$
\frac{\partial \mathbf{e}}{\partial (\cdot)} = -\frac{\partial \pi}{\partial \mathbf{X}^c} \cdot \frac{\partial \mathbf{X}^c}{\partial (\cdot)}
$$

with $\partial \pi / \partial \mathbf{X}^c$ a $2 \times 3$ matrix containing the $1/Z$ and $-X/Z^2$, $-Y/Z^2$ terms, and the second factor differing depending on whether we differentiate w.r.t. the pose (via a Lie-algebra perturbation, $2 \times 6$) or the point ($2 \times 3$).

## Which problems minimize it

- **Motion-only** (PnP refinement / tracking): points fixed, optimize one pose.
- **Structure-only** (triangulation refinement): poses fixed, optimize points.
- **Full bundle adjustment**: optimize all poses and points jointly — the gold standard.

Alternatives for comparison: **photometric error** (direct methods compare pixel intensities instead of feature positions) and **3D point-to-point/point-to-plane error** (ICP). Reprojection error is preferred when reliable feature correspondences exist because its pixel-space noise model matches how the measurements were actually made.

## Why it matters for SLAM

- It is the observation model of visual SLAM: virtually every feature-based estimator — PnP refinement, triangulation, local and global bundle adjustment, visual factors in factor graphs — minimizes it.
- Its chi-square statistics provide principled **outlier tests** for match pruning and RANSAC inlier counting.
- Its Jacobian structure (each error couples exactly one pose and one point) creates the sparsity that makes bundle adjustment tractable via the Schur complement.

## Related

- [Bundle Adjustment](bundle-adjustment.md)
- [PnP (Perspective-n-Point)](pnp.md)
- [Gauss-Newton](gauss-newton.md)
- [M-estimator](m-estimator.md)
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
