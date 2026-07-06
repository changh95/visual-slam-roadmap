# ICP

> Besl & McKay 1992 · [Paper](https://ieeexplore.ieee.org/document/121791)

**One-line summary** — Introduced the Iterative Closest Point (ICP) algorithm, the foundational method for rigid alignment of 3D point sets by iteratively minimizing point-pair distances.

## Key ideas

- **Closest-point correspondence**: for each point $\mathbf{p}_i$ in the source cloud, find the closest point $\mathbf{q}_i$ in the target cloud under the current transform estimate — no manual correspondences or feature matching needed.
- **Closed-form rigid transform**: given the correspondences, the optimal rotation $\mathbf{R}$ and translation $\mathbf{t}$ minimizing
  $$E(\mathbf{R}, \mathbf{t}) = \frac{1}{N}\sum_{i=1}^{N} \|\mathbf{q}_i - (\mathbf{R}\,\mathbf{p}_i + \mathbf{t})\|^2$$
  are computed in closed form via SVD of the cross-covariance matrix or unit quaternions.
- **Iterate until convergence**: apply the transform, recompute correspondences, and repeat. The mean-square error decreases monotonically, guaranteeing convergence to a *local* minimum.
- **Local convergence only**: ICP needs a reasonably good initialization; large misalignments lead to wrong local minima. In SLAM this initialization typically comes from the previous frame's pose or a motion model.
- **Spawned many variants**: point-to-plane ICP (used by KinectFusion), Generalized ICP, trimmed ICP, symmetric ICP, and colored ICP.

## Why it matters for SLAM

ICP is the foundation of 3D-3D registration: nearly every RGB-D dense SLAM system (KinectFusion, ElasticFusion, InfiniTAM) tracks the camera by running some ICP variant between the incoming depth frame and the map. It is equally central to LiDAR SLAM, where scan matching is essentially ICP with engineering refinements. Understanding ICP — its cost function, its closed-form solution, and its failure modes — is a prerequisite for understanding frame-to-model tracking in all of Level 4.

## Related

- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
- [KinectFusion](kinectfusion.md)
- [Frame-to-model tracking](frame-to-model-tracking.md)
- [LOAM](../level-09-lidar-visual-lidar-slam/loam.md)

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
