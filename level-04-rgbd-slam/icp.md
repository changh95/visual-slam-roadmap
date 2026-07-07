# ICP

> Besl & McKay 1992 · [Paper](https://ieeexplore.ieee.org/document/121791)

**One-line summary** — Introduced the Iterative Closest Point (ICP) algorithm, the foundational method for rigid alignment of 3D point sets by iteratively minimizing point-pair distances.

## Problem

Registering 3D shapes captured from different viewpoints or sensors is essential for object recognition, inspection, and reconstruction. Prior methods required manually specified correspondences or restrictive assumptions about shape topology. A general, automatic method for aligning free-form 3D data — one that works on raw points without knowing which point matches which — was needed.

## Method & architecture

ICP alternates between two steps, each of which can only decrease the alignment error:

1. **Closest-point correspondence.** For each point $\mathbf{p}_i$ in the source set $\mathcal{P}$, find the closest point $\mathbf{q}_i$ in the target set $\mathcal{Q}$ under the current transform estimate. The unknown data association is *approximated* by nearest neighbors and improves as the alignment improves — no manual correspondences or feature matching needed.
2. **Optimal rigid transform.** Given the correspondences, compute the rotation $\mathbf{R}$ and translation $\mathbf{t}$ minimizing the mean-square objective

$$E(\mathbf{R}, \mathbf{t}) = \frac{1}{N}\sum_{i=1}^{N} \|\mathbf{q}_i - (\mathbf{R}\,\mathbf{p}_i + \mathbf{t})\|^2$$

   in closed form — via SVD of the cross-covariance matrix of the centered point sets, or equivalently the unit-quaternion method used in the original paper.
3. **Iterate until convergence.** Apply the transform, recompute closest-point correspondences, and repeat until the change in mean-square error falls below a threshold.

Because both steps are error-reducing, the iteration converges monotonically to a *local* minimum of the mean-square distance:

$$E(\mathbf{R}_{k+1}, \mathbf{t}_{k+1}) \leq E(\mathbf{R}_k, \mathbf{t}_k) \quad \forall k$$

Key properties and refinements that define how ICP is used in practice:

- **Local convergence only**: ICP needs a reasonably good initialization; large misalignments lead to wrong local minima. In SLAM this initialization comes from the previous frame's pose, a constant-velocity motion model, or a coarse-to-fine pyramid.
- **Point-to-plane variant** (Chen & Medioni 1992): replacing the point-to-point residual with $\mathbf{n}_i^\top(\mathbf{T}\mathbf{v}_i - \mathbf{u}_i)$, where $\mathbf{n}_i$ is the target surface normal, lets flat regions slide along each other and converges much faster on structured scenes — this is the variant KinectFusion uses for frame-to-model tracking.
- **Engineering toolkit** (surveyed by Rusinkiewicz & Levoy 2001): k-d trees for nearest-neighbor search, subsampling, distance/normal-compatibility rejection of bad pairs, robust weighting. Later variants include Generalized ICP, trimmed ICP (partial overlap), symmetric ICP, and colored ICP.

## Results

The original TPAMI 1992 paper demonstrated registration of geometric primitives (spheres, cylinders) and complex free-form surfaces, with convergence typically within 10-50 iterations, while documenting the sensitivity to initialization that still defines ICP's failure mode today (full text is paywalled; results as summarized in the companion book chapter — see paper for full evaluation). ICP became the standard algorithm for 3D point-cloud registration: nearly every RGB-D dense SLAM system uses an ICP variant for tracking, it is foundational for scan matching in LiDAR SLAM, and it spread into medical imaging and industrial inspection.

## Why it matters for SLAM

ICP is the foundation of 3D-3D registration: nearly every RGB-D dense SLAM system (KinectFusion, ElasticFusion, InfiniTAM) tracks the camera by running some ICP variant between the incoming depth frame and the map. It is equally central to LiDAR SLAM, where scan matching is essentially ICP with engineering refinements. Understanding ICP — its cost function, its closed-form solution, and its failure modes — is a prerequisite for understanding frame-to-model tracking in all of Level 4.

## Hands-on

- [ICP hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_06)
- [Advanced ICP hands-on](https://github.com/changh95/slam_lecture_codes/tree/main/SLAM_zero_to_hero/part2_ch03_07)

## Related

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](kinectfusion.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)
