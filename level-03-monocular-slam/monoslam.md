# MonoSLAM

> Davison 2007 · [Paper](https://ieeexplore.ieee.org/document/4160954)

**One-line summary** — The first real-time monocular SLAM system: a single hand-held camera and an Extended Kalman Filter jointly estimating camera motion and a sparse 3D landmark map.

## Problem

Before MonoSLAM, real-time SLAM systems required stereo rigs, laser scanners, or wheel odometry; a single camera was considered insufficient because one view provides bearing but no depth, and a bare camera has no motion measurement at all. Davison, Reid, Molton, and Stasse (IEEE TPAMI 2007) showed that a single hand-held camera suffices for real-time SLAM — provided the estimation framework explicitly handles the depth uncertainty of monocular feature initialisation and supplies a motion prior in place of odometry.

## Key ideas

- **EKF over camera + map**: one state vector holds the camera pose (position, orientation, velocity, angular velocity) and all 3D landmark positions; a single EKF performs prediction $\mathbf{x}_{k+1} = f(\mathbf{x}_k, \mathbf{u}_k) + \mathbf{w}_k$ and update $\mathbf{z}_k = h(\mathbf{x}_k) + \mathbf{v}_k$, where $h(\cdot)$ is perspective projection and $\mathbf{w}_k, \mathbf{v}_k$ are Gaussian noise. Crucially, the full joint covariance couples camera and landmarks, so observing one feature improves estimates of everything.
- **Probabilistic feature initialisation**: a single view gives no depth, so new features start as a 1-D depth distribution along the viewing ray (represented with a particle filter) that collapses to a Gaussian and joins the main EKF state once enough parallax accumulates.
- **Active search**: the filter's predicted measurement uncertainty projects to an ellipse in the image telling the system *where* to look for each feature match — measurement effort goes only where it is informative, making matching both efficient and robust.
- **Constant-velocity motion model**: a smooth-motion prior appropriate for hand-held cameras replaces odometry; between images the camera is assumed to continue at its current translational and angular velocity, with acceleration as process noise.
- **Known limitation — quadratic scaling**: maintaining the full joint covariance costs $O(N^2)$ per update in the number of landmarks, capping the map at roughly 100 features and confining operation to room-sized workspaces.

## Results & impact

- First demonstration that a single camera can do real-time SLAM — interactive operation with a hand-held camera, with drift-free localisation inside the mapped workspace.
- The probabilistic depth-initialisation technique influenced subsequent monocular systems, and inverse-depth parameterisations grew out of the same problem.
- Its scaling limits set the agenda for the next decade: PTAM answered with keyframes plus bundle adjustment, and "Visual SLAM: Why Filter?" formalised why optimisation over keyframes beats filtering for visual SLAM.

## Why it matters for SLAM

MonoSLAM proved a single cheap camera suffices for real-time SLAM, effectively founding visual SLAM as a field (and beginning Davison's lab's lineage — iMAP, MonoGS, and MASt3R-SLAM come from the same group decades later). It is also the cleanest pedagogical example of filter-based SLAM: one EKF, one joint state, active search from predicted uncertainty — the baseline against which every keyframe-optimisation system since has been argued.

## Related

- [PTAM](ptam.md)
- [Visual-SLAM why filter?](visual-slam-why-filter.md)
- [Visual Odometry](visual-odometry.md)
- [ORB-SLAM](orb-slam.md)
- [Scale ambiguity](scale-ambiguity.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
