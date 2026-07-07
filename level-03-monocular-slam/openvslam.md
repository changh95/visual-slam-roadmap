# OpenVSLAM

> Sumikura 2019 · [Paper](https://arxiv.org/abs/1910.01122)

**One-line summary** — A modular, open-source visual SLAM framework built as a callable library, with an ORB-based pipeline and support for perspective, fisheye, and equirectangular (360-degree) camera models.

## Problem

Visual SLAM systems are essential for AR devices and autonomous robots and drones, but as the authors put it, "conventional open-source visual SLAM frameworks are not appropriately designed as libraries called from third-party programs" (abstract). ORB-SLAM and LSD-SLAM were research applications, not components: hard to embed, hard to extend, and limited to standard perspective cameras. OpenVSLAM was designed from the ground up for usability and extensibility.

## Key ideas

- **Library-first design**: clean module APIs for tracking, mapping, loop closing, and visualisation, so the SLAM system can be embedded in third-party programs instead of forked and hacked — at the time a genuinely unusual property for SLAM code.
- **Multiple camera models behind one interface**: a unified projection abstraction supports perspective, fisheye, equirectangular, and stereo cameras; the equirectangular (full 360-degree) support in particular set it apart from ORB-SLAM2 and made it popular for panoramic capture rigs.
- **ORB-SLAM-inspired pipeline**: the proven three-thread architecture (tracking, local mapping, loop closing) with ORB features and DBoW-style place recognition — the innovation is software architecture, not algorithm.
- **Map save/load and localization mode**: maps can be serialised, reloaded, and used for pure relocalization against a pre-built map — a deployment feature research systems typically lacked, and essential for products that map once and localise many times.

## Results & impact

OpenVSLAM achieved accuracy comparable to ORB-SLAM2 on the standard public benchmarks while additionally handling equirectangular and fisheye input that ORB-SLAM2 could not. It was widely adopted in research and industry as an embeddable SLAM component. Its afterlife is equally instructive: concerns that parts of the code derived from GPL-licensed ORB-SLAM2 led to the original repository being taken down, and development continued in the community as Stella-VSLAM.

## Why it matters for SLAM

OpenVSLAM was one of the first SLAM codebases engineered for usability and integration rather than just benchmark accuracy, and it was widely adopted in both research and industry. Its history also carries an important lesson: licence concerns (code resembling GPL-licensed ORB-SLAM2) led to the original repository being taken down, and the community continued development as Stella-VSLAM. It remains a good entry point for studying a well-organised feature-based SLAM architecture.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [Stella-VSLAM](stella-vslam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Camera models beyond pinhole](../level-01-beginner/camera-models-beyond-pinhole.md)
- [UcoSLAM](ucoslam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
