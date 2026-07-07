# 2D-3D correspondence

Given $n$ 3D points $\{\mathbf{X}_i\}$ in a known map and their 2D projections $\{\mathbf{u}_i\}$ in a camera image, the **Perspective-n-Point (PnP)** problem estimates the camera pose $[R|\mathbf{t}]$. This is the standard way a SLAM system localizes each new frame once a map exists.

## P3P

The Perspective-3-Point problem uses exactly 3 correspondences — the minimal case, matching the 6 degrees of freedom of the pose (each 2D point gives 2 constraints). The geometry reduces to the classical "law of cosines" system: the three angles between viewing rays are known from the image, and the three inter-point distances are known from the map, yielding a polynomial system with up to 4 real solutions; a 4th correspondence disambiguates. Because it needs so few points, P3P is the minimal solver of choice inside RANSAC — the number of iterations required grows exponentially with sample size, so $s = 3$ is a huge advantage over larger solvers.

## EPnP

EPnP (Lepetit et al., 2009) expresses the $n$ 3D points as weighted sums of 4 virtual control points, reducing PnP to estimating 12 unknowns (the control-point coordinates in the camera frame) regardless of $n$. Its $O(n)$ complexity makes it efficient for large correspondence sets, and it is the default in many pipelines (`cv::solvePnP` supports it directly).

## DLT and the role of SVD

The Direct Linear Transform solves for the full $3 \times 4$ projection matrix $P$ from $n \geq 6$ correspondences as a homogeneous linear system, using SVD: the solution is the right singular vector with the smallest singular value. The pose is then extracted via decomposition of $P = \mathbf{K}[R|\mathbf{t}]$ (RQ decomposition when the intrinsics are also unknown). DLT is simpler but less accurate than EPnP; in practice, either serves as an initialization that is refined by minimizing reprojection error.

## Nonlinear refinement (motion-only bundle adjustment)

Whatever solver provides the initial pose, the accurate answer comes from minimizing the reprojection error over the pose only, with the map points held fixed:

$$T^* = \arg\min_{T \in SE(3)} \sum_{i} \rho\!\left(\big\|\mathbf{u}_i - \pi(T\,\mathbf{X}_i)\big\|^2\right)$$

where $\pi$ is the camera projection and $\rho$ a robust kernel (e.g., Huber) that limits the influence of surviving outliers. This is solved with Gauss-Newton or Levenberg-Marquardt in a few iterations — it is the "motion-only BA" step that runs on every frame in feature-based SLAM.

## Typical pipeline

1. Match current-frame keypoints against map points (descriptor matching or projection-guided search).
2. RANSAC with P3P to reject outlier matches and get an initial pose.
3. Refine the pose on all inliers by nonlinear least squares (robust kernel on reprojection error).

## Common pitfalls

- **Degenerate point configurations**: DLT fails when the 3D points are coplanar (or worse, collinear); EPnP and P3P handle planes better, but check your solver's assumptions.
- **Ambiguous solutions at low point counts**: P3P's up-to-4 solutions must be disambiguated — feeding the wrong root to refinement converges to a wrong but low-residual pose.
- **Map-point quality bounds pose quality**: PnP treats the 3D points as perfect; badly triangulated landmarks (low parallax) systematically bias the pose. This is why full bundle adjustment, which also moves the points, eventually outperforms per-frame PnP.
- **Uncalibrated distortion**: PnP on distorted pixel coordinates without undistorting first produces consistent-looking but biased poses.

## Why it matters for SLAM

PnP is the tracking backbone of feature-based SLAM: ORB-SLAM tracks every frame by matching against local map points and solving PnP, and relocalization after tracking loss is PnP against place-recognition candidates. It is also how visual localization services (query image vs. pre-built map) compute a camera pose. Alongside 2D-2D (initialization) and 3D-3D (point cloud alignment), it completes the trio of correspondence problems every SLAM engineer must know.

## Hands-on

- [Perspective-n-points hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_09)

## Related

- [2D-2D correspondence](2d-2d-correspondence.md)
- [3D-3D correspondence](3d-3d-correspondence.md)
- [Triangulation](../level-01-beginner/triangulation.md)
- [Landmark](landmark.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [ORB-SLAM](../level-03-monocular-slam/orb-slam.md)
