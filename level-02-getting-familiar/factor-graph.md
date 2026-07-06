# Factor graph

A **factor graph** is the standard modern way to write down the SLAM problem. It is a bipartite graph $\mathcal{G} = (\mathcal{V}, \mathcal{F}, \mathcal{E})$ with two kinds of nodes:

- **Variable nodes** $\mathcal{V}$: the unknowns to estimate — robot poses $T_i$, map points (landmarks) $\mathbf{X}_j$, IMU biases $\mathbf{b}$, extrinsics, time offsets.
- **Factor nodes** $\mathcal{F}$: probabilistic constraints on subsets of variables — prior factors, odometry factors, landmark observation (reprojection) factors, IMU preintegration factors, loop-closure factors.
- **Edges** $\mathcal{E}$: connect each factor to exactly the variables it involves.

The graph encodes how the joint probability of all variables decomposes into a product of local factors:

$$
p(\mathcal{V}) \propto \prod_{f \in \mathcal{F}} f(\mathcal{V}_f)
$$

where $\mathcal{V}_f$ are the variables attached to factor $f$. The MAP estimate maximizes this product; under Gaussian noise, taking the negative log turns it into exactly the sparse nonlinear least-squares problem covered elsewhere at this level — each factor becomes one squared residual term.

The power of the representation is that **graph structure = sparsity structure**. Each observation involves only one pose and one landmark; odometry connects only consecutive poses. The graph makes this locality explicit, and the resulting Jacobian/Hessian sparsity is what allows solvers to handle problems with thousands of poses and hundreds of thousands of landmarks. It is also wonderfully compositional: adding a sensor means adding a new factor type, not redesigning the estimator. A pose graph is just the special case where all variables are poses and all factors are relative-pose constraints.

The dominant libraries speak this language directly:

- **GTSAM** (Georgia Tech Smoothing and Mapping) — factor graphs as the first-class API, with the iSAM2 incremental solver; excellent for VIO.
- **g2o** — vertices/edges formulation of the same idea; used in ORB-SLAM and LSD-SLAM.
- **Ceres Solver** — a general nonlinear least-squares library; you assemble the "graph" implicitly as a set of residual blocks.

## Why it matters for SLAM

Factor graphs unified what used to be separate problem formulations — filtering, pose-graph optimization, bundle adjustment, sensor fusion — into one picture: define variables, attach factors, solve. Every modern back-end you will meet (ORB-SLAM's BA, VINS-Mono's sliding window, Kimera's iSAM2 smoother, LIO-SAM's LiDAR-inertial graph) is a factor graph with a particular choice of variables, factors, and solving schedule. Learning to *draw the factor graph* of a system is the fastest way to understand any SLAM paper's back-end.

## Related

- [MAP inference as sparse nonlinear least squares](map-inference-as-sparse-nonlinear-least-squares.md)
- [Pose graph optimization](pose-graph-optimization.md)
- [Incremental smoothing (iSAM/iSAM2)](incremental-smoothing.md)
- [Marginalization](marginalization.md)
- [Math libraries (Eigen, Ceres, GTSAM, g2o)](math-libraries.md)

[Back to Level 2](../README.md#level-2-getting-familiar-with-slam)
