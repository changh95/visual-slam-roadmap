# OpenVSLAM

> Sumikura 2019 · [Paper](https://arxiv.org/abs/1910.01122)

**One-line summary** — A modular, open-source visual SLAM framework built as a callable library, with an ORB-based indirect pipeline and support for perspective, fisheye, and equirectangular (360-degree) camera models plus map save/load and localization.

## Problem

Visual SLAM is essential for AR devices and autonomous robots, drones, and UAVs, but "conventional open-source visual SLAM frameworks are not appropriately designed as libraries called from third-party programs." ORB-SLAM, LSD-SLAM, and DSO — the de facto standards — are research applications: hard to embed, hard to extend, limited to perspective cameras, and (per the paper's comparison table) mostly unable to store/load maps. SfM packages like OpenMVG and OpenSfM already handled fisheye and equirectangular imagery; no real-time visual SLAM framework did.

## Method & architecture

OpenVSLAM (MM '19) is a monocular/stereo/RGB-D system implemented in C++ (Eigen, OpenCV, g2o) whose contribution is architectural rather than algorithmic — well-known SLAM approaches encapsulated in separated components with clear APIs and extensive documented sample code.

- **Three modules**: *tracking* estimates a camera pose for every frame via ORB keypoint matching and pose optimisation and decides keyframe insertion; *mapping* triangulates new 3D points from inserted keyframes and runs windowed local bundle adjustment; *global optimisation* performs loop detection, pose-graph optimisation (g2o), and global BA. Pose-graph optimisation resolves trajectory drift and also cancels scale drift for monocular input — the graph-based indirect formulation of ORB-SLAM/ProSLAM.
- **Indirect by design**: ORB features (FAST keypoints + binary descriptors) are chosen over direct methods because direct methods are more susceptible to lighting changes and perform worse on rolling-shutter sensors — i.e. on the smartphones and consumer cameras OpenVSLAM targets.
- **Camera model abstraction**: perspective, fisheye, and equirectangular cameras are interchangeable behind a base class `camera::base`; users add new models (dual fisheye, catadioptric) by deriving from it. Perspective and fisheye work in monocular, stereo, and RGB-D setups. The authors claim the first open-source visual SLAM framework accepting equirectangular imagery — omnidirectional view makes tracking independent of camera direction.
- **Map I/O and localization**: maps are stored/loaded in MessagePack format (reusable by third-party applications), and new frames can be localized against a prebuilt map. A cross-platform viewer runs in web browsers.
- **Evaluation protocol**: absolute trajectory error after Umeyama alignment — $\mathrm{Sim}(3)$ for monocular (up-to-scale trajectories), $\mathrm{SE}(3)$ for stereo.

## Results

On a Core i7-7820HK laptop, compared against ORB-SLAM2:

- **EuRoC MAV (monocular, 11 sequences)**: tracking accuracy comparable to ORB-SLAM overall; on the dark sequences MH_04 and MH_05, OpenVSLAM's trajectories are more accurate, credited to an additional robust-matching frame tracking method.
- **Tracking time, EuRoC MH_02**: mean 23.84 ms/frame vs 27.96 ms for ORB-SLAM (median 23.38 vs 24.97) — faster ORB extraction and a local map kept from growing as the global map expands.
- **KITTI Odometry (stereo, 11 sequences)**: comparable ATE; on sequence 05, mean 56.32 ms/frame vs 68.78 ms (median 54.45 vs 66.78), the larger gap due to bigger images and a more optimised stereo-matching implementation.
- **Qualitative**: successful fisheye mapping outdoors (~6400 frames, elevation changes, high-dynamic-range scenes) and indoors (~6700 frames); equirectangular THETA V mapping over a 15000-frame outdoor sequence with successful loop closing, and indoor tracking through texture-less areas thanks to omnidirectional observation.

## Why it matters for SLAM

OpenVSLAM was one of the first SLAM codebases engineered for usability and integration rather than just benchmark accuracy, and it was widely adopted in research and industry as an embeddable component — especially for panoramic capture rigs no other open system supported. Its history also carries a lesson: concerns that code derived from GPL-licensed ORB-SLAM2 led to the original repository being taken down, and the community continued development as Stella-VSLAM. It remains a good entry point for studying a well-organised feature-based SLAM architecture.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [Stella-VSLAM](stella-vslam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
- [UcoSLAM](ucoslam.md)
