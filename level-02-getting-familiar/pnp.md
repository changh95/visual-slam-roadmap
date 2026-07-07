# PnP (Perspective-n-Point)

The **Perspective-n-Point (PnP)** problem: given $n$ 3D points $\mathbf{X}_i$ expressed in a known map (world) frame, their 2D projections $\mathbf{u}_i$ in a camera image, and the intrinsic matrix $\mathbf{K}$, estimate the camera pose $[R \mid \mathbf{t}]$ that satisfies

$$
\lambda_i \begin{bmatrix} \mathbf{u}_i \\ 1 \end{bmatrix} = \mathbf{K} \left( R \mathbf{X}_i + \mathbf{t} \right)
$$

for some positive depths $\lambda_i$. PnP is the workhorse of **2D–3D correspondence**: unlike essential-matrix estimation from 2D–2D matches, it recovers translation with **metric scale** because the 3D points already carry scale.

## Main solvers

**P3P (minimal solver).** Three correspondences suffice (pose has 6 DoF; each 2D point gives 2 constraints). Each pair of image rays subtends a known angle $\theta_{ij}$ (computed from calibrated bearing vectors), and the law of cosines constrains the unknown point depths $d_i = \lVert R\mathbf{X}_i + \mathbf{t} \rVert$:

$$
d_i^2 + d_j^2 - 2 d_i d_j \cos\theta_{ij} = \lVert \mathbf{X}_i - \mathbf{X}_j \rVert^2
$$

Three such equations reduce to a quartic polynomial with **up to 4 real solutions**. A 4th correspondence disambiguates. P3P is the minimal solver used inside RANSAC — small samples keep the required iteration count low.

**DLT (Direct Linear Transform).** From $n \geq 6$ correspondences, solve linearly for the $3 \times 4$ projection matrix $P$ (each point gives 2 homogeneous linear equations; stack and solve $A\mathbf{p} = 0$ via SVD). Then extract the pose by decomposing $P = \mathbf{K}[R \mid \mathbf{t}]$ (RQ decomposition). Simple, but it ignores the known intrinsics during the solve and minimizes an algebraic (not geometric) error, so it is less accurate than dedicated solvers.

**EPnP.** Expresses all $n$ 3D points as weighted sums of **4 virtual control points**:

$$
\mathbf{X}_i = \sum_{j=1}^{4} \alpha_{ij} \mathbf{c}_j, \qquad \sum_j \alpha_{ij} = 1
$$

The barycentric weights $\alpha_{ij}$ are invariant to the rigid transform, so the problem reduces to estimating the 12 coordinates of the control points in the camera frame, regardless of $n$. Complexity is $O(n)$, making EPnP the standard non-minimal solver for large correspondence sets (e.g., relocalization).

**Iterative refinement.** Whatever solver provides the initial pose, the final answer is refined by minimizing the total **reprojection error**

$$
\min_{R, \mathbf{t}} \sum_i \left\lVert \mathbf{u}_i - \pi\!\left(\mathbf{K}, R\mathbf{X}_i + \mathbf{t}\right) \right\rVert^2
$$

with Gauss–Newton or Levenberg–Marquardt (this is what `cv::solvePnP` with the iterative flag, and "motion-only bundle adjustment" in ORB-SLAM, do).

## Robust estimation

Real 2D–3D match sets contain outliers (wrong descriptor matches, moved objects). The standard pipeline is **P3P + RANSAC**: sample 3 correspondences, solve P3P, count inliers by reprojection-error threshold (a few pixels), keep the best model, then refine on all inliers with an M-estimator or plain least squares.

## Why it matters for SLAM

- **Tracking**: feature-based SLAM (PTAM, ORB-SLAM) estimates every frame's pose by matching current-frame keypoints to already-triangulated map points and solving PnP — this is the core of the tracking thread.
- **Relocalization and loop closing**: after tracking is lost or a loop candidate is found, PnP against the stored map recovers the pose from scratch.
- **Metric scale**: because the 3D points fix the scale, PnP-based tracking does not suffer the scale ambiguity of pure 2D–2D motion estimation.
- A practical VO pipeline is: detect ORB, match, reject outliers with RANSAC, estimate pose with EPnP/P3P, refine with Gauss–Newton/LM.

## Hands-on

- [Perspective-n-points hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch02_09)

## Related

- [2D-3D correspondence](2d-3d-correspondence.md)
- [RANSAC](ransac.md)
- [Reprojection error](reprojection-error.md)
- [Gauss-Newton](gauss-newton.md)
- [Pinhole camera model](../level-01-beginner/pinhole-camera-model.md)
