# FAST-LIO2

> Xu 2022 · [Paper](https://arxiv.org/abs/2107.06829)

**One-line summary** — FAST-LIO2 showed that registering raw LiDAR points directly to the map inside a tightly-coupled iterated Kalman filter — with an incremental k-d tree (ikd-Tree) as the map — is faster *and* more accurate than feature-based LiDAR-inertial odometry.

## Problem

Feature-based LiDAR pipelines discard most of each scan during edge/planar extraction, throwing away subtle environmental structure and failing where distinct features are scarce. Worse, hand-engineered feature extractors are tuned to a particular scanning pattern, so every new LiDAR — especially the emerging solid-state sensors with small fields of view and irregular scan patterns — requires re-engineering. FAST-LIO2 asks whether *all* raw points can be registered directly to the map, fast enough for real-time onboard operation.

## Key ideas

- **Feature-free, direct registration**: raw scan points are matched to the map without extracting features, using point-to-plane residuals of the form

  $$r_i = \mathbf{n}_i^\top\big(\mathbf{R}\,\mathbf{p}_i^L + \mathbf{t} - \mathbf{q}_i\big),$$

  where $\mathbf{p}_i^L$ is the point in the LiDAR frame and $(\mathbf{n}_i, \mathbf{q}_i)$ define a small plane fitted to its nearest map neighbors. This exploits subtle features that extractors discard (raising accuracy) and adapts naturally to any scanning pattern.
- **Tightly-coupled iterated EKF**: IMU measurements propagate the state (pose, velocity, biases) between scans and de-skew the cloud point-by-point; the *iterated* measurement update re-linearizes the point-to-plane residuals until convergence, keeping the filter accurate under fast motion where a single-shot EKF update would suffer linearization error.
- **ikd-Tree**: a purpose-built incremental k-d tree supporting point insertion, deletion, dynamic re-balancing, and downsampling *on the tree*. Compared with existing dynamic structures (octree, R\*-tree, nanoflann k-d tree) it achieves superior overall performance for the SLAM workload — the map grows continuously with logarithmic-time queries and never needs a full rebuild.
- **Map update inside the loop**: registration and mapping are the same operation — after each update, the scan's points are inserted into the ikd-Tree, so odometry and mapping run at the same rate.
- **Versatility as a first-class goal**: one codebase covers multi-line spinning and solid-state LiDARs, UAV and handheld platforms, and Intel and ARM processors.

## Results & impact

An exhaustive benchmark on 19 sequences from a variety of open LiDAR datasets showed consistently higher accuracy at much lower computation than other state-of-the-art LiDAR-inertial systems. The paper reports up to 100 Hz odometry and mapping in large outdoor environments, and reliable pose estimation in cluttered indoor scenes with rotations up to 1000 deg/s. Both the system and the ikd-Tree data structure are open source, and the ikd-Tree in particular became a widely reused component well beyond this paper.

## Why it matters for SLAM

FAST-LIO2 flipped the field's default from "extract features, then register" to "register everything, fast." Its ikd-Tree became a widely reused component, and its iEKF-on-manifold formulation is the reference design for filter-based LiDAR-inertial odometry. It is also the foundation of the HKU MARS ecosystem — R3LIVE and FAST-LIVO/FAST-LIVO2 all build their visual fusion on top of this LIO core — and it is the pragmatic first choice today for pure LiDAR-inertial odometry, especially on cheap solid-state sensors.

## Related

- [LOAM](loam.md) — the feature-based paradigm it displaced
- [LIO-SAM](lio-sam.md) — the factor-graph alternative with loop closure and GPS
- [FAST-LIVO](fast-livo.md) — adds direct visual fusion on the same map
- [R3LIVE](r3live.md) — uses FAST-LIO as its geometric backbone
- [PIN-SLAM](pin-slam.md) — neural-map successor to direct LiDAR registration

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
