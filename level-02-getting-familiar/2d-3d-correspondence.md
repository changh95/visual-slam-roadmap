# 2D-3D correspondence

Given $n$ 3D points $\{\mathbf{X}_i\}$ in a known map and their 2D projections $\{\mathbf{u}_i\}$ in a camera image, the **Perspective-n-Point (PnP)** problem estimates the camera pose $[R|\mathbf{t}]$. This is the standard way a SLAM system localizes each new frame once a map exists.

## P3P

The Perspective-3-Point problem uses exactly 3 correspondences — the minimal case. The geometry leads to a polynomial system with up to 4 real solutions; a 4th correspondence disambiguates. Because it needs so few points, P3P is the minimal solver of choice inside RANSAC: fewer points per sample means far fewer iterations to find an outlier-free sample.

## EPnP

EPnP (Lepetit et al., 2009) expresses the $n$ 3D points as weighted sums of 4 virtual control points, reducing PnP to estimating 12 unknowns (the control-point coordinates in the camera frame) regardless of $n$. Its $O(n)$ complexity makes it efficient for large correspondence sets, and it is the default in many pipelines (`cv::solvePnP` supports it directly).

## DLT and the role of SVD

The Direct Linear Transform solves for the full $3 \times 4$ projection matrix $P$ from $n \geq 6$ correspondences as a homogeneous linear system, using SVD: the solution is the right singular vector with the smallest singular value. The pose is then extracted via decomposition of $P = \mathbf{K}[R|\mathbf{t}]$. DLT is simpler but less accurate than EPnP; in practice, either serves as an initialization that is refined by minimizing reprojection error (motion-only bundle adjustment) with Gauss-Newton or Levenberg-Marquardt.

## Typical pipeline

1. Match current-frame keypoints against map points (descriptor matching or projection-guided search).
2. RANSAC with P3P to reject outlier matches and get an initial pose.
3. Refine the pose on all inliers by nonlinear least squares (robust kernel on reprojection error).

## Why it matters for SLAM

PnP is the tracking backbone of feature-based SLAM: ORB-SLAM tracks every frame by matching against local map points and solving PnP, and relocalization after tracking loss is PnP against place-recognition candidates. It is also how visual localization services (query image vs. pre-built map) compute a camera pose. Alongside 2D-2D (initialization) and 3D-3D (point cloud alignment), it completes the trio of correspondence problems every SLAM engineer must know.

## Related

- [2D-2D correspondence](2d-2d-correspondence.md)
- [3D-3D correspondence](3d-3d-correspondence.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Landmark](landmark.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
