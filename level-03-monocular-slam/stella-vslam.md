# Stella-VSLAM

> Community 2021 · [Paper](https://github.com/stella-cv/stella_vslam)

**One-line summary** — The community-maintained successor to OpenVSLAM, rebooted after licence concerns, continuing a modular, library-style visual SLAM framework under permissive licensing.

## Key ideas

- **Licence reboot**: OpenVSLAM was taken down after concerns that parts of its code derived from the GPLv3-licensed ORB-SLAM2; the stella-cv community continued the project as Stella-VSLAM with the licensing issues addressed.
- **OpenVSLAM feature parity**: retains the modular architecture and support for perspective, fisheye, equirectangular (360-degree), and stereo cameras.
- **Library-first philosophy**: like its predecessor, it is designed as a callable library with clean APIs rather than a monolithic application, including map save/load and a localization mode.
- **Community maintenance**: ongoing bug fixes, performance improvements, and features contributed by the open-source community keep it usable as ORB-SLAM-family research code ages.

## Why it matters for SLAM

Stella-VSLAM is a practical, actively maintained entry point for feature-based visual SLAM, particularly if you need 360-degree or fisheye camera support or want to embed SLAM in a larger system. Its origin story is also a cautionary tale the SLAM community learned from: open-source licensing (GPL vs permissive) is a real engineering constraint when research code flows into products. It also appears again in Level 7 as a stereo-capable system.

## Related

- [OpenVSLAM](openvslam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
