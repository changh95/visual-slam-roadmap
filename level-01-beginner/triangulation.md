# Triangulation

Given camera poses and corresponding image points in two or more views, **triangulation** recovers the 3D point that generated them. It is the step that turns matched 2D observations into map geometry.

## DLT Method

For camera $i$ with projection matrix $P_i$ and observed homogeneous point $\mathbf{p}_i = [u_i, v_i, 1]^T$, projection gives $\lambda_i \mathbf{p}_i = P_i\mathbf{X}$. Cross-multiplying eliminates the unknown scale $\lambda_i$:

$$\mathbf{p}_i \times (P_i\mathbf{X}) = \mathbf{0}$$

Each view contributes 2 independent linear equations in the 4 homogeneous coordinates of $\mathbf{X}$. Stacking the equations from $N$ views gives a homogeneous system:

$$A\mathbf{X} = \mathbf{0}$$

The least-squares solution is the right singular vector of $A$ corresponding to the smallest singular value — a direct application of SVD. This is the **Direct Linear Transform (DLT)** method.

## Mid-point Method

The mid-point method finds the 3D point that minimizes the sum of squared distances to the projection rays:

$$\mathbf{X}^* = \arg\min_{\mathbf{X}} \sum_i d^2(\mathbf{X},\ \mathrm{ray}_i)$$

This has a closed-form solution and is preferred when the rays are nearly parallel (e.g., near-forward motion, where DLT becomes poorly conditioned).

## Practical notes

- Triangulation accuracy depends on **parallax**: a wide baseline between views gives well-conditioned intersections, while tiny baselines produce points with huge depth uncertainty. SLAM systems therefore check the parallax angle before accepting a new map point.
- Linear methods (DLT, mid-point) give an initial estimate; accuracy-critical pipelines refine the point by minimizing reprojection error, which is what bundle adjustment does jointly for all points and poses.

## Why it matters for SLAM

Triangulation is how a SLAM map grows: after epipolar geometry (or PnP) provides camera poses, every new feature match becomes a candidate 3D landmark via triangulation. It is also half of the classic monocular bootstrapping recipe — recover relative pose from the essential matrix, then triangulate the initial map — and the quality checks around it (parallax, reprojection error, positive depth) are what separate robust systems from fragile ones.

## Related

- [Epipolar geometry](epipolar-geometry.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Landmark](../level-02-getting-familiar/landmark.md)

[Back to Level 1](../README.md#level-1-beginner)
