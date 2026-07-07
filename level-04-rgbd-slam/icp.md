# ICP

> Besl & McKay 1992 · [Paper](https://ieeexplore.ieee.org/document/121791)

**One-line summary** — Introduced the Iterative Closest Point (ICP) algorithm, the foundational method for rigid alignment of 3D point sets by iteratively minimizing point-pair distances.

## Problem

Registering 3D shapes captured from different viewpoints or sensors is essential for object recognition, inspection, and reconstruction. Prior methods required manually specified correspondences or restrictive assumptions about shape topology. A general, automatic method for aligning free-form 3D data — one that works on raw points without knowing which point matches which — was needed.

## Key ideas

- **Closest-point correspondence**: for each point $\mathbf{p}_i$ in the source set $\mathcal{P}$, find the closest point $\mathbf{q}_i$ in the target set $\mathcal{Q}$ under the current transform estimate — no manual correspondences or feature matching needed. The unknown data association is simply *approximated* by nearest neighbors and improves as the alignment improves.
- **Closed-form rigid transform**: given the correspondences, the optimal rotation $\mathbf{R}$ and translation $\mathbf{t}$ minimizing
  $$E(\mathbf{R}, \mathbf{t}) = \frac{1}{N}\sum_{i=1}^{N} \|\mathbf{q}_i - (\mathbf{R}\,\mathbf{p}_i + \mathbf{t})\|^2$$
  are computed in closed form — via SVD of the cross-covariance matrix of the centered point sets, or equivalently via the unit-quaternion method used in the original paper.
- **Iterate until convergence**: apply the transform, recompute closest-point correspondences, and repeat until the change in mean-square error falls below a threshold. Because each of the two steps (re-matching, re-aligning) can only decrease the error,
  $$E(\mathbf{R}_{k+1}, \mathbf{t}_{k+1}) \leq E(\mathbf{R}_k, \mathbf{t}_k) \quad \forall k,$$
  the algorithm converges monotonically to a *local* minimum of the mean-square distance.
- **Local convergence only**: ICP needs a reasonably good initialization; large misalignments lead to wrong local minima. In SLAM this initialization typically comes from the previous frame's pose, a constant-velocity motion model, or a coarse-to-fine pyramid.
- **Point-to-plane and other variants**: replacing the point-to-point residual with the point-to-plane residual $\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)$ (Chen & Medioni) lets flat regions slide along each other and typically converges much faster on structured scenes — this is the variant KinectFusion uses. Later refinements include Generalized ICP, trimmed ICP (robustness to partial overlap), symmetric ICP, and colored ICP.
- **Practical accelerations**: k-d trees for nearest-neighbor search, subsampling, distance/normal-compatibility rejection of bad pairs, and robust weighting — the standard engineering toolkit surveyed by Rusinkiewicz & Levoy's "efficient ICP variants".

## Results & impact

The original TPAMI 1992 paper demonstrated registration of geometric primitives and complex free-form surfaces, with convergence typically within 10-50 iterations, while documenting the sensitivity to initialization that still defines ICP's failure mode today. ICP became the standard algorithm for 3D point-cloud registration: nearly every RGB-D dense SLAM system uses an ICP variant for tracking, it is foundational for scan matching in LiDAR SLAM, and it spread far beyond robotics into medical imaging and industrial inspection. Its variants (point-to-plane, Generalized ICP, trimmed, symmetric) form one of the longest-lived algorithm families in 3D vision.

## Why it matters for SLAM

ICP is the foundation of 3D-3D registration: nearly every RGB-D dense SLAM system (KinectFusion, ElasticFusion, InfiniTAM) tracks the camera by running some ICP variant between the incoming depth frame and the map. It is equally central to LiDAR SLAM, where scan matching is essentially ICP with engineering refinements. Understanding ICP — its cost function, its closed-form solution, and its failure modes — is a prerequisite for understanding frame-to-model tracking in all of Level 4.

## Related

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](kinectfusion.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
