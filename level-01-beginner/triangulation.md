# Triangulation

Given camera poses and corresponding image points in two or more views, **triangulation** recovers the 3D point that generated them. It is the step that turns matched 2D observations into map geometry.

## DLT Method

For camera $i$ with projection matrix $P_i$ and observed homogeneous point $\mathbf{p}_i = [u_i, v_i, 1]^T$, projection gives $\lambda_i \mathbf{p}_i = P_i\mathbf{X}$. Cross-multiplying eliminates the unknown scale $\lambda_i$:

$$\mathbf{p}_i \times (P_i\mathbf{X}) = \mathbf{0}$$

Writing $P_i$'s rows as $\mathbf{r}_1^T, \mathbf{r}_2^T, \mathbf{r}_3^T$, the two independent equations per view are

$$\big(u_i\,\mathbf{r}_3^T - \mathbf{r}_1^T\big)\mathbf{X} = 0, \qquad \big(v_i\,\mathbf{r}_3^T - \mathbf{r}_2^T\big)\mathbf{X} = 0$$

Stacking the equations from $N$ views gives a homogeneous system:

$$A\mathbf{X} = \mathbf{0}, \qquad A \in \mathbb{R}^{2N \times 4}$$

The least-squares solution is the right singular vector of $A$ corresponding to the smallest singular value — a direct application of SVD. This is the **Direct Linear Transform (DLT)** method. Divide the homogeneous solution by its fourth component to obtain the Euclidean point.

## Mid-point Method

The mid-point method finds the 3D point that minimizes the sum of squared distances to the projection rays:

$$\mathbf{X}^* = \arg\min_{\mathbf{X}} \sum_i d^2(\mathbf{X},\ \mathrm{ray}_i)$$

This has a closed-form solution and is preferred when the rays are nearly parallel (e.g., near-forward motion, where DLT becomes poorly conditioned). For two views it reduces to finding the shortest segment between the two rays and taking its midpoint.

## The stereo special case

For a rectified stereo pair with baseline $b$ and focal length $f_x$, triangulation collapses to a one-line formula. A point at depth $Z$ appears with horizontal **disparity** $d$ between the two images, and

$$Z = \frac{b\, f_x}{d}$$

Because depth is inversely proportional to disparity, a fixed matching error of a fraction of a pixel translates into a depth error that grows rapidly with distance — the reason stereo (and triangulation generally) degrades for far-away points and small baselines.

## Quality checks used in real systems

- **Parallax angle**: the angle between the two viewing rays. A wide baseline gives well-conditioned intersections; tiny parallax produces points with huge depth uncertainty. SLAM systems check this angle before accepting a new map point.
- **Positive depth (cheirality)**: the triangulated point must lie in front of *both* cameras; a negative depth means the match or the pose hypothesis is wrong.
- **Reprojection error**: project the triangulated point back into each view and compare with the measurements; reject if the residual exceeds a threshold.
- Linear methods (DLT, mid-point) give an initial estimate; accuracy-critical pipelines refine the point by minimizing reprojection error, which is what bundle adjustment does jointly for all points and poses.

## Common pitfalls

- **Triangulating everything**: keeping low-parallax points pollutes the map with landmarks whose depth is essentially unconstrained, destabilizing later optimization.
- **Mixing coordinate conventions**: DLT expects consistent projection matrices $P_i = \mathbf{K}[R|\mathbf{t}]$ mapping world to image; passing camera-to-world poses produces garbage that can superficially look plausible.
- **Trusting DLT's algebraic error**: DLT minimizes an algebraic quantity, not a geometric one; for accuracy, follow it with a reprojection-error refinement.

## Why it matters for SLAM

Triangulation is how a SLAM map grows: after epipolar geometry (or PnP) provides camera poses, every new feature match becomes a candidate 3D landmark via triangulation. It is also half of the classic monocular bootstrapping recipe — recover relative pose from the essential matrix, then triangulate the initial map — and the quality checks around it (parallax, reprojection error, positive depth) are what separate robust systems from fragile ones.

## Hands-on

- [Triangulation hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_07)

## Related

- [Epipolar geometry](epipolar-geometry.md)
- [Pinhole camera model](pinhole-camera-model.md)
- [Basic Linear Algebra](basic-linear-algebra.md)
- [2D-2D correspondence](../level-02-getting-familiar/2d-2d-correspondence.md)
- [Landmark](../level-02-getting-familiar/landmark.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
