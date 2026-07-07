# Stella-VSLAM

> Community 2021 · [Paper](https://github.com/stella-cv/stella_vslam)

**One-line summary** — The community-maintained successor to OpenVSLAM, rebooted after licence concerns, continuing a modular, library-style visual SLAM framework under permissive licensing.

## Problem

OpenVSLAM was widely adopted, but portions of its code were suspected to derive from the GPLv3-licensed ORB-SLAM2 without carrying that licence, and the original repository was taken down. That left users of a popular, deployment-oriented SLAM library without a maintained upstream. The stella-cv community continued the project as Stella-VSLAM, addressing the licensing problem so the framework could keep being used and embedded, including in commercial contexts where GPL obligations are a real constraint.

## Key ideas

- **Licence reboot**: the project's core purpose — continue OpenVSLAM's codebase and community under permissive licensing, with the problematic provenance addressed by reworking the affected components.
- **OpenVSLAM feature parity**: retains the modular architecture and support for perspective, fisheye, equirectangular (360-degree), and stereo cameras — still one of the few maintained systems with first-class equirectangular support.
- **Library-first philosophy**: like its predecessor, it is designed as a callable library with clean APIs rather than a monolithic application, including map save/load and a localization mode for map-reuse deployments.
- **Community maintenance**: ongoing bug fixes, performance improvements, relocalization and map-management improvements, and platform support contributed by the open-source community keep it usable as the original ORB-SLAM-family research code ages.

## Results & impact

Stella-VSLAM tracks OpenVSLAM's accuracy — comparable to ORB-SLAM2 on the standard public benchmarks — while being actively maintained and permissively licensed. In practice it has become the default recommendation when someone needs an embeddable, 360-degree-capable, legally clean feature-based SLAM library, and it is one of the clearest examples in the field of open-source governance directly shaping which SLAM systems get deployed.

## Why it matters for SLAM

Stella-VSLAM is a practical, actively maintained entry point for feature-based visual SLAM, particularly if you need 360-degree or fisheye camera support or want to embed SLAM in a larger system. Its origin story is also a cautionary tale the SLAM community learned from: open-source licensing (GPL vs permissive) is a real engineering constraint when research code flows into products. It also appears again in Level 7 as a stereo-capable system.

## Related

- [OpenVSLAM](openvslam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
