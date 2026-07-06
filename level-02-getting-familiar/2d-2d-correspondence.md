# 2D-2D correspondence

Given feature matches between two images — with no 3D information yet — 2D-2D geometry estimates the relative camera motion. The three workhorse models are the **essential matrix**, the **fundamental matrix**, and the **homography**, each estimated by a minimal or linear solver wrapped in RANSAC.

## Five-Point Algorithm for the Essential Matrix

With calibrated cameras, the essential matrix $E$ can be estimated from 5 point correspondences (Nister, 2004). The constraints are:

- Epipolar constraint: $\mathbf{x}_2^T E\,\mathbf{x}_1 = 0$ (linear in the 9 entries of $E$).
- Internal constraints: $\det(E) = 0$ and $2EE^TE - \mathrm{trace}(EE^T)E = 0$ (cubic polynomials).

The result is up to 10 real solutions, disambiguated by additional points. Combined with RANSAC, the five-point algorithm is the preferred method for essential matrix estimation in practice: a smaller minimal sample means far fewer RANSAC iterations at the same inlier ratio.

## Eight-Point Algorithm for the Fundamental Matrix

The fundamental matrix $F$ has 7 degrees of freedom. With 8+ correspondences, the 8-point algorithm (Longuet-Higgins, 1981; Hartley, 1997) solves a linear homogeneous system $A\mathbf{f} = 0$ with $\mathbf{f} = \mathrm{vec}(F)$ via SVD. Hartley showed that **normalizing** point coordinates (zero mean, unit variance) before solving dramatically improves numerical conditioning — the "normalized 8-point algorithm" is the version everyone actually uses.

## Direct Linear Transform for Homography

When the scene is planar or the motion is a pure rotation, a homography $H$ explains the correspondences. Each correspondence $\mathbf{x}' \sim H\mathbf{x}$ gives 2 linear equations in the 8 DOF of $H$; with $N \geq 4$ correspondences the DLT stacks a $2N \times 9$ matrix and solves $A\mathbf{h} = 0$ via SVD. Normalization is again critical.

## Choosing the model

Degenerate configurations matter: a planar scene or pure rotation makes $F$/$E$ estimation ill-posed, while a general 3D scene breaks the homography assumption. ORB-SLAM famously fits both models during monocular initialization and picks the winner by a per-model score.

## Why it matters for SLAM

2D-2D correspondence is the entry point of monocular SLAM: it bootstraps the first relative pose (up to scale) before any map exists, after which triangulation creates landmarks and the pipeline switches to 2D-3D (PnP) tracking. The same solvers also verify loop-closure candidates geometrically and underpin structure-from-motion pipelines such as COLMAP.

## Related

- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [3D-3D correspondence](3d-3d-correspondence.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Keypoints](keypoints.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
