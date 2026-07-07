# CoPeD

> Zhou 2024 · [Paper](https://arxiv.org/abs/2405.14731)

**One-line summary** — CoPeD is a comprehensive real-world multi-robot collaborative perception dataset built around air-ground robot teams, created to fill the evaluation gap that had kept collaborative perception research stuck in simulation.

## Problem

In the past decade single-robot perception made significant advances, but multi-robot *collaborative* perception remained largely unexplored — and one major hurdle was the lack of real-world datasets. Collaborative perception requires fusing **compressed, intermittent, limited, heterogeneous, and asynchronous** environmental information across robots, under sensor noise, occlusions, and outright sensor failures. Existing multi-robot datasets were predominantly designed for SLAM (geometric mapping with limited cross-robot view overlap), while collaborative-perception datasets were V2V autonomous-driving benchmarks, mostly simulated and missing aerial viewpoints. CoPeD was built specifically to close this gap.

## Method & architecture

As a dataset paper, CoPeD's "method" is its collection, calibration, and annotation pipeline (it contains no core equations):

- **Platforms (3 ground + 2 aerial robots):** Clearpath Warthogs carry an Ouster OS1-64 3D LiDAR, LORD Microstrain 3DM-GX5-25 IMU, u-Blox EVK-M8T GNSS, RealSense D435i/D455 stereo camera, two FLIR Blackfly S cameras, and a Masterclock GMR1000 for hardware time sync; a Clearpath Jackal has a similar suite. The custom NYU-ARPL quadrotors carry a forward RealSense D435i, a downward IMX219 color camera, a PX4 autopilot, and GPS. All robots run ROS 1 on one 5G Wi-Fi subnetwork with NTP time synchronization.
- **Sequences with designed overlap:** indoor 'Indoor-NYUARPL' (38 m × 60 m lab/hallway; three 1-aerial+1-ground sequences and one 2+2 sequence, aerial robots flying 2 m above ground robots moving at 0.5 m/s) and outdoor 'HOUSE' (150 m × 30 m) and 'FOREST' (100 m × 80 m), where the team splits into air-ground subteams, aerial robots fly at 2–10 m and ground robots drive up to 1.5 m/s; one sequence even switches air-ground pairings mid-run to study formation effects. Several single-aerial-robot sequences are added for comparison.
- **Pose annotation:** aerial robots fuse GPS with OpenVINS stereo visual-inertial odometry; ground robots use IMU + wheel odometry. Cross-robot relative poses come from bundles of 8 AprilTags mounted on the ground robots, detected from the aerial robots' downward cameras and solved with PnP. Intrinsics/extrinsics are calibrated with Kalibr, IMU intrinsics via Allan covariance analysis, and a shared calibration board aligns the whole team's start poses.
- **Zero-shot perception annotation:** semantic instance masks from RAM + Grounding DINO + SAM (2D boxes by post-processing), made temporally consistent with a propagation model across frames; monocular depth annotation from ZoeDepth (chosen because the RealSense's short stereo baseline makes classical SGBM/graph-cut stereo worse than modern monocular depth).
- **Real-world noise kept in:** color jittering, temporally discontinuous LiDAR intensities, GPS denial/drift indoors and under forest canopy, temperature-dependent IMU intrinsics, and lost clock synchronization — exactly the disturbances simulation hides.

## Results

The paper's evaluation is qualitative — its contribution is infrastructural. It demonstrates the dataset on collaborative perception tasks: a graph-neural-network system where two aerial robots and one ground robot share feature maps performs multi-robot monocular depth estimation and semantic segmentation, recovering predictions of far-away objects (trees in depth, houses in segmentation) and staying robust when one robot's image sensor is corrupted, compared to a single-agent baseline. The zero-shot semantic/depth annotations are shown across indoor and outdoor sequences; see the paper for the full sequence tables and sensor specifications. Data and tools are released at `arplaboratory/CoPeD`.

## Why it matters for SLAM

Collaborative SLAM papers have historically been evaluated on single-robot datasets artificially split among virtual agents, which hides the hard parts of real deployments: asynchronous sensing, heterogeneous platforms, and genuinely different viewpoints of the same place. CoPeD gives C-SLAM systems such as Kimera-Multi and Swarm-SLAM a realistic air-ground benchmark, much as EuRoC did for single-robot VIO — and its AprilTag-based cross-robot ground truth directly supports evaluating inter-robot loop closure and map merging.

## Related

- [Kimera-Multi](kimera-multi.md) — distributed metric-semantic C-SLAM system that this kind of dataset benchmarks
- [Swarm-SLAM](swarm-slam.md) — decentralized C-SLAM framework evaluated on multi-robot data
- [Inter-robot loop closure](inter-robot-loop-closure.md) — the capability that cross-robot view overlap is designed to test
- [Map merging](map-merging.md) — aligning air and ground submaps into one frame
- [Communication constraints](communication-constraints.md) — the real-world condition (intermittent, limited links) the dataset embodies
