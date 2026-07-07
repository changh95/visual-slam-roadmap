# 3D-3D correspondence

Given two sets of corresponding 3D points $\{\mathbf{p}_i\}$ (source) and $\{\mathbf{q}_i\}$ (target), the 3D-3D registration problem finds the rigid transformation aligning them:

$$\min_{R,\mathbf{t}} \sum_i \|\mathbf{q}_i - (R\mathbf{p}_i + \mathbf{t})\|^2$$

This arises whenever both frames provide 3D data — RGB-D or stereo frames, LiDAR scans, or two point cloud maps to be merged. The classic algorithm is **ICP (Iterative Closest Point)**.

## Closed-form SVD solution (known correspondences)

When correspondences are known, the optimal alignment has a closed form:

1. Compute centroids: $\bar{\mathbf{p}} = \frac{1}{n}\sum_i \mathbf{p}_i$, $\bar{\mathbf{q}} = \frac{1}{n}\sum_i \mathbf{q}_i$.
2. Compute cross-covariance: $H = \sum_i (\mathbf{p}_i - \bar{\mathbf{p}})(\mathbf{q}_i - \bar{\mathbf{q}})^T$.
3. SVD: $H = U\Sigma V^T$.
4. Rotation: $R = VU^T$ (with a sign correction if $\det(R) = -1$).
5. Translation: $\mathbf{t} = \bar{\mathbf{q}} - R\bar{\mathbf{p}}$.

**Why centroids first?** Setting the derivative of the cost with respect to $\mathbf{t}$ to zero shows the optimal translation always maps the source centroid onto the target centroid. Substituting it back decouples the problem: rotation is found alone on the *centered* points, then translation follows in step 5. The same construction extended with an optimal scale factor $s$ (the **Umeyama** alignment) is what trajectory-evaluation tools use to align an estimated trajectory with ground truth before computing ATE — for monocular SLAM, where scale is unobservable, the scale-aligned variant is essential.

## The iterative part of ICP

When correspondences are *unknown*, ICP alternates between:

1. **Correspondence step**: for each source point, find the nearest neighbour in the target (kd-tree accelerated).
2. **Alignment step**: solve the closed-form problem above and apply the transform.

Repeat until convergence. ICP needs a reasonable initial guess (it converges to a local minimum) and is sensitive to outliers, so practical variants add distance thresholds, robust kernels, and normal-based rejection.

## Point-to-plane and beyond

**Point-to-plane ICP** replaces the point-to-point metric with a point-to-surface metric using the target's normals $\mathbf{n}_i$:

$$\min_{R,\mathbf{t}} \sum_i \big(\mathbf{n}_i^T\,(R\mathbf{p}_i + \mathbf{t} - \mathbf{q}_i)\big)^2$$

Points are allowed to slide along the surface, penalized only perpendicular to it — which matches reality, since the "closest point" is rarely the true corresponding point. This converges much faster on smooth surfaces and dominates in RGB-D and LiDAR pipelines (it is what KinectFusion uses). The cost is no longer closed-form; it is solved by linearizing the rotation (small-angle approximation) into a 6x6 linear system per iteration. Further refinements in the same family include Generalized-ICP (plane-to-plane, covariance-weighted) and point-to-line metrics used in LiDAR odometry such as LOAM.

## Common pitfalls

- **Bad initialization**: ICP's convergence basin is small; seed it from odometry, a constant-velocity motion model, or a global method — never from identity after large motion.
- **Partial overlap**: points without a true counterpart drag the estimate; trim correspondences by distance percentile or robust kernels.
- **Degenerate geometry**: a single plane leaves 3 DOF unconstrained (2 translations + 1 rotation in-plane); long corridors and tunnels similarly under-constrain the solution — detect degeneracy via the eigenvalues of the 6x6 normal-equation matrix.
- **Reflection from the SVD**: always apply the $\det(R) = -1$ sign correction; forgetting it yields a mirrored "alignment" on noisy or planar data.

## Why it matters for SLAM

ICP is the tracking engine of dense RGB-D SLAM (KinectFusion aligns each depth frame to the model with point-to-plane ICP) and of most LiDAR odometry systems, and the SVD alignment step reappears in loop closing whenever two submaps must be merged. Together with 2D-2D (no depth) and 2D-3D (one-sided depth), it completes the correspondence toolbox: which one you use is determined simply by where 3D information is available.

## Related

- [2D-2D correspondence](2d-2d-correspondence.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [Basic Linear Algebra](../level-01-beginner/basic-linear-algebra.md)
- [Metrics](metrics.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
