# S-PTAM

> Pire 2017 · [Paper](https://github.com/lrse/sptam)

**One-line summary** — S-PTAM extends PTAM's parallel tracking-and-mapping paradigm to stereo cameras, delivering a complete, real-time, ROS-released stereo SLAM system with metric scale from the baseline and appearance-based loop closure.

## Problem

Monocular SLAM suffers from the bootstrapping problem (delayed, delicate map initialization), scale ambiguity and scale drift, and fragility under dynamic objects and fast motion. Stereo fixes all of these: triangulating depth from a single stereo view initializes points with low uncertainty and undelayed, and recovers the real scale — "essential for robots which have to interact with their surrounding workspace." What was missing was a mature, real-time, feature-based stereo SLAM that is robust indoors, outdoors, with dynamic objects, changing light and large loops — and that a robotics lab could actually deploy through ROS. S-PTAM fills that gap.

## Method & architecture

Three threads share the map: **tracking**, **local mapping**, and **loop closing**. The global frame is set at the first camera pose; the initial map is triangulated from the first stereo pair (no bootstrapping).

- **Features**: GFTT corners described with binary BRISK descriptors — chosen from an exhaustive detector/descriptor evaluation on KITTI in the paper; extraction for the two images runs in two parallel threads.
- **Tracking (per frame)**: map points inside the predicted frustum (prediction from wheel odometry or a decaying velocity model) are projected and matched to features by Hamming distance within grid cells (spatial hashing); only points in the covisibility area of nearby keyframes are considered, with frustum culling and a 45° viewing-angle test. The pose is then refined by composing the previous pose with a relative motion $\mu = (t_x, t_y, t_z, \theta_{roll}, \theta_{pitch}, \theta_{yaw})^T$ found by robust Gauss-Newton on the reprojection error:
  $$\mu' = \operatorname*{argmin}_{\mu} \sum_{i \in S} \rho\left(J_i\, \mu - \Delta z_i(\mu_{\text{prev}})\right),$$
  with Huber cost $\rho$, minimized by Levenberg-Marquardt (g2o); $J$ chains the projection derivative with the pose derivative $\partial x_i^C / \partial \mu_j = G_j\, E^{CW}_{\text{prev}}\, x_i^W$.
- **Keyframes and immediate point creation**: a frame becomes a keyframe when tracked points fall below 90% of those tracked by the last keyframe; unmatched stereo features are triangulated and inserted into the map *immediately in the tracking thread* — unlike PTAM, which defers this to the mapping thread and can lose tracking while the queue is congested.
- **Local mapping**: Local Bundle Adjustment refines up to ten queued keyframes plus nearby already-refined keyframes and their visible points, minimizing the same robust reprojection error jointly over poses and points, $\left(\mu'_{j=2\ldots N}, x'^W_{i=1\ldots M}\right) = \operatorname{argmin} \sum_j \sum_{i \in S_j} \rho_{\sigma_T}(\psi_{ji})$, with the first keyframe fixed (it defines the world frame). Bad points are removed; new point-keyframe measurements are actively searched to strengthen the graph.
- **Loop closure**: keyframes are described as bags of binary words (DBoW2, $\alpha = 0.3$); a candidate must pass the normalized similarity score $\eta(v_i, v_j) = s(v_i, v_j) / s(v_i, v_{i-1})$ where $s(v_i, v_j) = 1 - \frac{1}{2}\left\lVert \frac{v_i}{|v_i|} - \frac{v_j}{|v_j|} \right\rVert$ is the L1 similarity in $[0,1]$. Geometric validation runs P3P RANSAC over 3D-2D correspondences (loop accepted only if 80% inliers), then a full PnP + nonlinear refinement gives the relative transform $T_{C^C C^\ell}$. Correction propagates that transform along the loop with Slerp-interpolated weighting (stronger near the loop point), followed by pose graph optimization (g2o) and map point correction — while a "safe mapping window" lets tracking and LBA keep running, pausing them only briefly for the final map update.

## Results

Experiments on KITTI (00–10) and the Indoor Level 7 S-Block dataset, on a laptop with an i7 @ 2.8 GHz and 16 GB RAM:

- **KITTI benchmark**: translation error 1.19% vs. ORB-SLAM2 (stereo) 1.15% and S-LSD-SLAM 1.20%; rotation error 0.0025 deg/m — the best of the three (ORB-SLAM2 0.0027, S-LSD-SLAM 0.0033).
- **Loop closure**: geometric validation rejected false positives with 100% precision on all loop sequences (00, 02, 05, 06, 07, 09); over the ~4 km sequence 00 trajectory the maximum absolute localization error stayed below 15 m.
- **Runtime**: the tracking thread runs at ~18 Hz including loop-closure overhead.
- **Level 7 S-Block** (wheeled robot, office loops over 30+ minutes): accuracy comparable to ORB-SLAM2, with similar error peaks in the same areas.

## Why it matters for SLAM

S-PTAM is a bridge between the PTAM era and modern stereo SLAM: it showed that the tracking/mapping decomposition scales cleanly to stereo and large outdoor trajectories, and it was one of the first complete open-source stereo SLAM systems with loop closure that a robotics lab could deploy through ROS. It served as a common ground-robot baseline before ORB-SLAM2 became the dominant feature-based reference, and details like immediate point creation in the tracking thread and the safe-window loop correction remain instructive engineering lessons.

## Related

- [PTAM](../level-03-monocular-slam/ptam.md)
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md)
- [StereoMSCKF](stereomsckf.md)
- [Disparity vs Depth](disparity-vs-depth.md)
- [Stereo rectification](stereo-rectification.md)
- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
