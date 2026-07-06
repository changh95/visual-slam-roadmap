# OpenVSLAM

> Sumikura 2019 · [Paper](https://arxiv.org/abs/1910.01122)

**One-line summary** — A modular, open-source visual SLAM framework built as a callable library, with an ORB-based pipeline and support for perspective, fisheye, and equirectangular (360-degree) camera models.

## Key ideas

- **Library-first design**: unlike ORB-SLAM or LSD-SLAM, which were standalone applications, OpenVSLAM exposes clean module APIs (tracking, mapping, loop closing, visualisation) so it can be embedded in third-party programs.
- **Multiple camera models**: a unified projection interface supports perspective, fisheye, equirectangular, and stereo cameras — the equirectangular support in particular set it apart from ORB-SLAM2.
- **ORB-SLAM-inspired pipeline**: three-thread architecture (tracking, local mapping, loop closing) with ORB features and DBoW-style place recognition.
- **Map save/load and localization mode**: maps can be serialised and reloaded, enabling relocalization against pre-built maps — an important feature for deployment that research systems often lacked.

## Why it matters for SLAM

OpenVSLAM was one of the first SLAM codebases engineered for usability and integration rather than just benchmark accuracy, and it was widely adopted in both research and industry. Its history also carries an important lesson: licence concerns (code resembling GPL-licensed ORB-SLAM2) led to the original repository being taken down, and the community continued development as Stella-VSLAM. It remains a good entry point for studying a well-organised feature-based SLAM architecture.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [Stella-VSLAM](stella-vslam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
