# Stella-VSLAM

> Community 2021 · [Paper](https://github.com/stella-cv/stella_vslam)

**One-line summary** — The community-maintained successor to OpenVSLAM, rebooted after licence concerns, continuing a modular, library-style visual SLAM framework with first-class perspective, fisheye, and equirectangular camera support.

## Problem

OpenVSLAM (Sumikura et al., ACMMM 2019) was widely adopted for its unique multi-camera-model support, but portions of its code were suspected to derive from the GPLv3-licensed ORB-SLAM2 without carrying that licence, and the original repository was withdrawn from GitHub in 2020. That left users of a popular, deployment-oriented SLAM library without a maintained upstream — particularly painful for drone applications using fisheye lenses and indoor scanning with 360-degree cameras, where no other actively maintained system filled the gap. The stella-cv community continued the project as Stella-VSLAM, addressing the licensing problem so the framework could keep being embedded, including in commercial contexts where GPL obligations are a real constraint.

## Method & architecture

Stella-VSLAM is not a paper-backed research system but an engineering continuation of OpenVSLAM's design, which itself follows the ORB-SLAM2 three-thread architecture (tracking, local mapping, loop closing) rebuilt as a callable library:

- **Unified camera model abstraction** — a generic camera interface supports perspective (pinhole + radial-tangential distortion), fisheye (Kannala-Brandt equidistant projection), and equirectangular (360-degree) projection. All downstream modules — feature extraction, map-point triangulation, bundle adjustment — operate through this interface without modification.
- **ORB features with model-aware handling** — ORB keypoints drive tracking, mapping, and relocalization; for equirectangular input the image is handled so that feature matching and epipolar geometry remain valid on the sphere.
- **Stereo depth integration** — in stereo configuration, each left-image keypoint gets depth from an epipolar block-matched right-image correspondence, following ORB-SLAM2:

$$Z = \frac{f \cdot b}{u_L - u_R}$$

  where $f$ is the focal length, $b$ the stereo baseline, and $u_L - u_R$ the disparity.
- **DBoW2 place recognition and loop closure** — the same bag-of-words pipeline as ORB-SLAM2, with loop constraints verified via $\mathrm{Sim}(3)$ optimization in monocular mode or $\mathrm{SE}(3)$ in metric (stereo/RGB-D) modes.
- **Deployment tooling** — map save/load and a localization-only mode for map-reuse deployments, plus ROS1/ROS2 wrappers (launch files, TF2 integration), an improved build system, and ongoing community bug fixes and relocalization/map-management improvements.

## Results

There is no standalone evaluation paper; results are inherited and reproduced from OpenVSLAM. Per the roadmap book's coverage: Stella-VSLAM reproduces OpenVSLAM's published results on the EuRoC, KITTI, and TUM RGB-D benchmarks; on EuRoC with fisheye input it achieves ATE competitive with ORB-SLAM3's fisheye mode; and its equirectangular mode successfully maps indoor environments with a Ricoh Theta 360-degree camera where standard perspective SLAM fails. Community benchmarking reports confirm numerical parity with OpenVSLAM. In practice it has become the default recommendation for an embeddable, 360-degree-capable, legally clean feature-based SLAM library.

## Why it matters for SLAM

Stella-VSLAM is a practical, actively maintained entry point for feature-based visual SLAM, particularly if you need 360-degree or fisheye camera support or want to embed SLAM in a larger system. Its origin story is also a cautionary tale the SLAM community learned from: open-source licensing (GPL vs permissive) is a real engineering constraint when research code flows into products. It also appears again in Level 7 as a stereo-capable system.

## Related

- [OpenVSLAM](openvslam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
- [Disparity vs Depth](../level-07-stereo-slam/disparity-vs-depth.md)
