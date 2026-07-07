# DOOR-SLAM

> Lajoie 2020 · [Paper](https://arxiv.org/abs/1909.12198)

**One-line summary** — DOOR-SLAM (Distributed, Online, and Outlier Resilient SLAM) is a fully distributed peer-to-peer SLAM system whose pairwise-consistency-based outlier rejection lets robot teams use aggressive place-recognition thresholds while safely filtering out spurious inter-robot loop closures.

## Problem

Robot teams need a shared understanding of the environment and their location within it, without relying on an external positioning system such as GPS and with minimal information exchange. Distributed SLAM offers exactly this, but existing distributed systems were vulnerable to perception outliers: to avoid catastrophic false loop closures they used very conservative place-recognition parameters, which also rejected many *valid* loop-closure candidates and degraded trajectory accuracy. DOOR-SLAM decouples detection from validation — a robust back-end makes it safe to let more candidates through the front-end.

## Method & architecture

**Peer-to-peer architecture.** Each robot performs single-robot SLAM when no teammate is in communication range and executes a distributed protocol during a rendezvous; there is no central server and no full-connectivity requirement. The implementation uses the Buzz swarm-programming language on top of ROS. Onboard, RTAB-Map stereo visual odometry produces the robot's own pose graph; two distributed modules do the multi-robot work.

**Distributed loop closure detection** (no raw data exchange): each robot computes a NetVLAD descriptor (truncated to 128 dimensions) per keyframe. At a rendezvous, robot $\alpha$ sends robot $\beta$ only the descriptors generated since their last encounter; $\beta$ finds putative matches under a Euclidean-distance threshold and sends back, for those keyframes only, visual features (GFTT keypoints with ORB descriptors) and their 3D positions. Robot $\alpha$ runs geometric verification with OpenCV's `solvePnPRansac`; a sufficient inlier set yields an inter-robot loop-closure measurement $\bar{\mathbf{z}}_{\beta_k}^{\alpha_i}$ (relative pose between keyframe $i$ of $\alpha$ and keyframe $k$ of $\beta$).

**Distributed outlier rejection — Pairwise Consistent Measurement set maximization (PCM).** Two inter-robot loop closures $\bar{\mathbf{z}}_{\beta_k}^{\alpha_j}$ and $\bar{\mathbf{z}}_{\beta_l}^{\alpha_i}$ are pairwise consistent if the cycle they form with the two odometry segments composes to (near) identity:

$$\left\|\left(\bar{\mathbf{z}}_{\alpha_j}^{\alpha_i}\oplus\bar{\mathbf{z}}_{\beta_k}^{\alpha_j}\oplus\bar{\mathbf{z}}_{\beta_l}^{\beta_k}\right)\ominus\bar{\mathbf{z}}_{\beta_l}^{\alpha_i}\right\|_{\Sigma}\leq\gamma$$

where $\|\cdot\|_\Sigma$ is the Mahalanobis distance, $\oplus/\ominus$ are pose composition/inversion, and the likelihood threshold $\gamma$ comes from a chi-squared quantile. The largest set of mutually consistent measurements is found as a **maximum clique** of the consistency graph; everything outside the clique is rejected. Crucially, the metric only needs the loop-closure measurements and odometric pose estimates already exchanged for distributed PGO — outlier rejection comes "for free" in communication terms.

**Distributed robust PGO.** The inlier loop closures and odometry feed the two-stage distributed Gauss-Seidel optimizer of Choudhary et al.: robots first reach consensus on rotations, then recover full poses, exchanging only the pose estimates involved in inter-robot loop closures. The back-end is implemented in C++ on GTSAM.

## Results

- **Simulation (ARGoS, 5 drones)**: the distributed PCM implementation rejects outliers as expected — lower thresholds reject more measurements (including inliers), higher ones occasionally admit outliers and inflate ATE; a 1% threshold is used as the safest configuration.
- **KITTI 00** split across three robots on three NVIDIA Jetson TX2s (NetVLAD threshold 0.15, minimum 5 feature correspondences, PCM 1%): average translation error **86.85 m without outlier rejection vs 8.00 m with PCM** (no intra-robot loop closures used).
- **Drone field tests** (two DJI Matrice 100, RealSense D435, Jetson TX2, over a visually repetitive football field): loosening the NetVLAD threshold from 0.10 to 0.15 yields ~3x more *valid* inter-robot loop closures once PCM filters the extra outliers; dropping the minimum correspondences to 4-5 (RTAB-Map default: 20) doubles valid loop closures. ATE vs GPS is best (2.19 m) at the most conservative 1% PCM threshold and explodes above 75% or with PCM disabled (22.02 m).
- **Communication**: per keyframe, a 1.00 kB NetVLAD descriptor is sent instead of a 900 kB RGB image; per match, keypoint info + descriptors cost 34.51 + 25.00 kB vs 600 kB for grayscale images.
- **DARPA SubT Tunnel Circuit** (two Husky UGVs, VLP-16 lidar with ICP loop closures, >1 km coal mine): the same back-end plugged into a lidar front-end removes the gross map distortion caused by perceptual aliasing (one incorrect loop closure survives, attributed to miscalibrated measurement covariances); the distributed back-end transmitted 92.27 kB vs 196.30 kB for an equivalent centralized exchange — roughly halving the communication burden.
- Full source code is open (`MISTLab/DOOR-SLAM`).

## Why it matters for SLAM

Perceptual aliasing is the Achilles heel of multi-robot mapping: a single wrong inter-robot loop closure can fold two robots' maps into each other irreparably. DOOR-SLAM made robust outlier rejection a first-class architectural component of distributed SLAM and demonstrated the payoff — aggressive front-end thresholds become safe, yielding *more* valid loop closures, not fewer. Its PCM formulation was subsequently adopted and extended by later systems (Kimera-Multi uses graduated non-convexity toward the same goal, and Swarm-SLAM comes from the same group). It is the reference design for outlier-resilient decentralized C-SLAM.

## Related

- [Kimera-Multi](kimera-multi.md) — distributed successor with GNC-based robust PGO and semantic meshes
- [Swarm-SLAM](swarm-slam.md) — later decentralized framework by the same first author
- [Inter-robot loop closure](inter-robot-loop-closure.md) — the measurements PCM validates
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md) — single-robot view of the same outlier problem
- [Communication constraints](communication-constraints.md) — why raw data is never exchanged
- [NetVLAD](../level-05-deep-learning/netvlad.md) — the compact descriptor behind the distributed front-end
- [Visual place recognition](../level-03-monocular-slam/visual-place-recognition-vpr.md) — the front-end stage whose thresholds PCM lets you relax
