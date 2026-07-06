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

## The iterative part of ICP

When correspondences are *unknown*, ICP alternates between:

1. **Correspondence step**: for each source point, find the nearest neighbour in the target (kd-tree accelerated).
2. **Alignment step**: solve the closed-form problem above and apply the transform.

Repeat until convergence. ICP needs a reasonable initial guess (it converges to a local minimum) and is sensitive to outliers, so practical variants add distance thresholds, robust kernels, and normal-based rejection. **Point-to-plane ICP** replaces the point-to-point metric with a point-to-surface metric, converging faster on smooth surfaces and dominating in RGB-D and LiDAR pipelines.

## Why it matters for SLAM

ICP is the tracking engine of dense RGB-D SLAM (KinectFusion aligns each depth frame to the model with point-to-plane ICP) and of most LiDAR odometry systems, and the SVD alignment step reappears in loop closing whenever two submaps must be merged. Together with 2D-2D (no depth) and 2D-3D (one-sided depth), it completes the correspondence toolbox: which one you use is determined simply by where 3D information is available.

## Related

- [2D-2D correspondence](2d-2d-correspondence.md)
- [2D-3D correspondence](2d-3d-correspondence.md)
- [ICP](../level-04-rgbd-slam/icp.md)
- [KinectFusion](../level-04-rgbd-slam/kinectfusion.md)
- [Basic Linear Algebra](../level-01-beginner/basic-linear-algebra.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
