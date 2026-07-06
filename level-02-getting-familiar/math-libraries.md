# Math libraries

Four libraries form the numerical backbone of virtually every C++ SLAM system: **Eigen** for linear algebra, and **Ceres Solver / g2o / GTSAM** for nonlinear least-squares optimization. Knowing which is which — and when a system's choice matters — is basic SLAM literacy.

**Eigen.** *The* linear algebra library for SLAM: all matrix/vector operations, decompositions (SVD, QR, Cholesky), and linear solvers. It is header-only and heavily template-optimized, so well-written Eigen code compiles down to vectorized machine code. Types you will use constantly: `Eigen::Matrix3d`, `Eigen::Vector3d`, `Eigen::Isometry3d` (rigid transforms), `Eigen::Quaterniond`, and `Eigen::Map` (wrap raw buffers without copying). Practical trivia that bites everyone once: fixed-size Eigen members require aligned allocation, and mixing Eigen versions across dependencies causes build pain — a major reason Docker is popular in SLAM.

**Ceres Solver.** Google's general-purpose nonlinear least-squares framework. You define residuals as templated cost functors; Ceres provides **automatic differentiation** (no hand-derived Jacobians), robust loss functions, manifold/local-parameterization support for rotations and poses, and a suite of sparse solvers. Used for bundle adjustment and pose graph optimization; VINS-Mono's sliding-window back-end is Ceres-based, and it is the default choice when your residuals are unusual and you want autodiff to handle the calculus.

**g2o.** "General Graph Optimization" — an explicitly graph-shaped API: **vertices** are state variables (poses, 3D points), **edges** are constraints (observations, odometry, loop closures), solved with sparse Cholesky. It is the back-end of ORB-SLAM (all versions) and LSD-SLAM, so reading g2o vertex/edge definitions is a prerequisite for reading those codebases. Jacobians are typically hand-derived, which is faster at runtime but more work to write.

**GTSAM.** Georgia Tech Smoothing and Mapping — a factor graph library with the strongest theoretical pedigree: variable elimination, the Bayes tree, and the **iSAM2 incremental solver** for real-time smoothing. It ships high-quality built-in factors (IMU preintegration, projection factors, smart/structureless factors) and a Python wrapper. It dominates the VIO and robotics-estimation world: Kimera-VIO and LIO-SAM build on it.

Rule of thumb when choosing:

| Need | Reach for |
|---|---|
| Matrix math everywhere | Eigen (non-negotiable) |
| Custom residuals, autodiff, batch BA | Ceres |
| ORB-SLAM-style graph BA / PGO | g2o |
| Incremental smoothing, IMU factors, VIO | GTSAM |

## Why it matters for SLAM

The back-end of every system you will study is written against one of these libraries, and their APIs shape how papers think: "add a factor," "define an edge," "attach a robust kernel." Being fluent means you can read any system's optimization code, prototype a new residual in an afternoon, and understand performance discussions (autodiff vs. analytic Jacobians, sparse solver choices, incremental vs. batch) that decide whether a method runs in real time.

## Related

- [C++](cpp.md)
- [Factor graph](factor-graph.md)
- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Schur complement / Sparsity](schur-complement-sparsity.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
