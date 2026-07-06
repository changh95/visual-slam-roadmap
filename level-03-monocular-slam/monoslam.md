# MonoSLAM

> Davison 2007 · [Paper](https://ieeexplore.ieee.org/document/4160954)

**One-line summary** — The first real-time monocular SLAM system: a single hand-held camera and an Extended Kalman Filter jointly estimating camera motion and a sparse 3D landmark map.

## Key ideas

- **EKF over camera + map**: one state vector holds the camera pose (position, orientation, velocity, angular velocity) and all 3D landmark positions; a single EKF performs prediction $\mathbf{x}_{k+1} = f(\mathbf{x}_k, \mathbf{u}_k) + \mathbf{w}_k$ and update $\mathbf{z}_k = h(\mathbf{x}_k) + \mathbf{v}_k$, where $h(\cdot)$ is perspective projection.
- **Probabilistic feature initialisation**: a single view gives no depth, so new features start as a 1-D depth distribution along the viewing ray (a particle filter) that collapses to a Gaussian once enough parallax accumulates.
- **Active search**: the filter's predicted uncertainty ellipses tell the system *where* to look for each feature match, making measurement both efficient and robust.
- **Constant-velocity motion model**: a smooth-motion prior appropriate for hand-held cameras replaces odometry, which a bare camera does not have.
- **Known limitation**: EKF cost grows as $O(N^2)$ in map size, capping the map at roughly 100 features and small workspaces.

## Why it matters for SLAM

MonoSLAM proved a single cheap camera suffices for real-time SLAM, effectively founding visual SLAM as a field (and earning Davison's group lasting influence — iMAP and MASt3R-SLAM come from the same lab decades later). Its scaling limits are equally important historically: they motivated PTAM's keyframe + bundle adjustment architecture and the filter-vs-optimisation analysis of "Visual SLAM: Why Filter?", which together set the direction of every modern system.

## Related

- [PTAM](ptam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [Visual Odometry](visual-odometry.md)
- [ORB-SLAM](orb-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
