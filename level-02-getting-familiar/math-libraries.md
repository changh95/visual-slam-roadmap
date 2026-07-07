# Math libraries

Four libraries form the numerical backbone of virtually every C++ SLAM system: **Eigen** for linear algebra, and **Ceres Solver / g2o / GTSAM** for nonlinear least-squares optimization. Knowing which is which — and when a system's choice matters — is basic SLAM literacy.

**Eigen.** *The* linear algebra library for SLAM: all matrix/vector operations, decompositions (SVD, QR, Cholesky), and linear solvers. It is header-only and heavily template-optimized, so well-written Eigen code compiles down to vectorized machine code. Types you will use constantly: `Eigen::Matrix3d`, `Eigen::Vector3d`, `Eigen::Isometry3d` (rigid transforms), `Eigen::Quaterniond`, and `Eigen::Map` (wrap raw buffers without copying).

```cpp
Eigen::Isometry3d T_wc = Eigen::Isometry3d::Identity();
T_wc.rotate(Eigen::AngleAxisd(0.1, Eigen::Vector3d::UnitZ()));
T_wc.pretranslate(Eigen::Vector3d(1.0, 0.0, 0.0));

Eigen::Vector3d p_c = T_wc.inverse() * p_w;   // world point into camera frame
```

Practical trivia that bites everyone once: fixed-size Eigen members require aligned allocation (`EIGEN_MAKE_ALIGNED_OPERATOR_NEW`), and mixing Eigen versions across dependencies causes build pain — a major reason Docker is popular in SLAM.

**Ceres Solver.** Google's general-purpose nonlinear least-squares framework. You define residuals as templated cost functors; Ceres provides **automatic differentiation** (no hand-derived Jacobians), robust loss functions, manifold/local-parameterization support for rotations and poses, and a suite of sparse solvers. The universal pattern:

```cpp
struct ReprojectionError {
  ReprojectionError(double u, double v) : u_(u), v_(v) {}

  template <typename T>
  bool operator()(const T* const pose, const T* const point, T* residual) const {
    // rotate+translate point by pose, project to pixel (pu, pv), then:
    // residual[0] = pu - T(u_);  residual[1] = pv - T(v_);
    return true;
  }
  double u_, v_;
};

problem.AddResidualBlock(
    new ceres::AutoDiffCostFunction<ReprojectionError, 2, 6, 3>(
        new ReprojectionError(u, v)),
    new ceres::HuberLoss(1.0), pose, point);
```

Used for bundle adjustment and pose graph optimization; VINS-Mono's sliding-window back-end is Ceres-based, and it is the default choice when your residuals are unusual and you want autodiff to handle the calculus. Solver choice matters: `DENSE_SCHUR` for bundle adjustment (exploits the camera/landmark block structure), `SPARSE_NORMAL_CHOLESKY` for pose graphs.

**g2o.** "General Graph Optimization" — an explicitly graph-shaped API: **vertices** are state variables (poses, 3D points), **edges** are constraints (observations, odometry, loop closures), solved with sparse Cholesky. It is the back-end of ORB-SLAM (all versions) and LSD-SLAM — ORB-SLAM's BA is literally `VertexSE3Expmap` pose vertices and `EdgeSE3ProjectXYZ` reprojection edges — so reading g2o vertex/edge definitions is a prerequisite for reading those codebases. Jacobians are typically hand-derived (with numeric differentiation as a fallback), which is faster at runtime but more work to write.

**GTSAM.** Georgia Tech Smoothing and Mapping — a factor graph library with the strongest theoretical pedigree: variable elimination, the Bayes tree, and the **iSAM2 incremental solver** for real-time smoothing. It ships high-quality built-in factors (IMU preintegration, projection factors, smart/structureless factors) and a Python wrapper:

```cpp
gtsam::NonlinearFactorGraph graph;
graph.addPrior(X(0), gtsam::Pose3(), priorNoise);
graph.emplace_shared<gtsam::BetweenFactor<gtsam::Pose3>>(X(0), X(1), odom, odomNoise);

gtsam::ISAM2 isam;
isam.update(graph, initialValues);        // incremental smoothing step
gtsam::Values estimate = isam.calculateEstimate();
```

It dominates the VIO and robotics-estimation world: Kimera-VIO and LIO-SAM build on it.

## Choosing

| Need | Reach for |
|---|---|
| Matrix math everywhere | Eigen (non-negotiable) |
| Custom residuals, autodiff, batch BA | Ceres |
| ORB-SLAM-style graph BA / PGO | g2o |
| Incremental smoothing, IMU factors, VIO | GTSAM |

Performance intuition worth having: autodiff costs somewhat more per iteration than hand-derived analytic Jacobians but eliminates an entire class of derivation bugs; the choice of sparse linear solver (Schur vs. plain sparse Cholesky) usually matters more than the autodiff-vs-analytic question; and all three optimizers ultimately solve the same damped normal equations — differences are API, factorization strategy, and ecosystem, not the underlying math.

## Why it matters for SLAM

The back-end of every system you will study is written against one of these libraries, and their APIs shape how papers think: "add a factor," "define an edge," "attach a robust kernel." Being fluent means you can read any system's optimization code, prototype a new residual in an afternoon, and understand performance discussions (autodiff vs. analytic Jacobians, sparse solver choices, incremental vs. batch) that decide whether a method runs in real time.

## Hands-on

- [Eigen + Sophus hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part1_ch03_05)
- [g2o hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_13)
- [GTSAM hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_14)
- [Ceres-solver hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_15)
- [SymForce hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part3_ch01_16)

## Related

- [C++](cpp.md)
- [Factor graph](factor-graph.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)
