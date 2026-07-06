# FAST-LIO2

> Xu 2022 · [Paper](https://arxiv.org/abs/2107.06829)

**One-line summary** — FAST-LIO2 showed that registering raw LiDAR points directly to the map inside a tightly-coupled iterated Kalman filter — with an incremental k-d tree (ikd-Tree) as the map — is faster *and* more accurate than feature-based LiDAR-inertial odometry.

## Key ideas

- **Feature-free, direct registration**: raw scan points are matched to the map with point-to-plane residuals, exploiting subtle environmental structure that edge/planar feature extractors discard; this also makes the system naturally adaptable to LiDARs with different scanning patterns (spinning and solid-state alike).
- **Tightly-coupled iterated EKF**: IMU measurements propagate the state (pose, velocity, biases) between scans and de-skew the cloud; the iterated measurement update with all point residuals keeps the filter accurate under fast motion.
- **ikd-Tree**: a purpose-built incremental k-d tree supporting point insertion, deletion, dynamic re-balancing, and downsampling on the tree — outperforming octrees, R*-trees, and static k-d trees for the SLAM workload, and enabling the map to grow continuously with $O(\log N)$ queries.
- **Efficient and robust**: benchmarked across 19 sequences from multiple open datasets with consistently higher accuracy at much lower computation than contemporaries; reported up to 100 Hz odometry/mapping in large outdoor environments and reliable estimation under rotations up to 1000 deg/s.
- Runs on UAV, handheld, Intel and ARM platforms; both the system and ikd-Tree are open source.

## Why it matters for SLAM

FAST-LIO2 flipped the field's default from "extract features, then register" to "register everything, fast." Its ikd-Tree became a widely reused component, and its iEKF-on-manifold formulation is the reference design for filter-based LiDAR-inertial odometry. It is also the foundation of the HKU MARS ecosystem — R3LIVE and FAST-LIVO/FAST-LIVO2 all build their visual fusion on top of this LIO core — and it is the pragmatic first choice today for pure LiDAR-inertial odometry, especially on cheap solid-state sensors.

## Related

- [LOAM](loam.md) — the feature-based paradigm it displaced
- [LIO-SAM](lio-sam.md) — the factor-graph alternative with loop closure and GPS
- [FAST-LIVO](fast-livo.md) — adds direct visual fusion on the same map
- [R3LIVE](r3live.md) — uses FAST-LIO as its geometric backbone
- [PIN-SLAM](pin-slam.md) — neural-map successor to direct LiDAR registration

[Back to Level 9](../README.md#level-9-lidar--visual-lidar-fusion-slam)
