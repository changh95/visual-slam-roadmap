# GO-SLAM

> Zhang 2023 · [Paper](https://arxiv.org/abs/2309.02436)

**One-line summary** — Brought loop closure and global bundle adjustment to neural implicit SLAM by combining DROID-SLAM's learned tracking with an Instant-NGP map that is updated after global pose corrections.

## Key ideas

- **Global optimization for neural SLAM**: prior neural implicit systems (iMAP, NICE-SLAM, Co-SLAM) only optimise locally, so the neural map accumulates drift on long sequences. GO-SLAM adds loop closure detection and global bundle adjustment on top of the neural representation.
- **DROID-SLAM tracking backend**: a learned dense-flow tracking system provides robust camera poses and maintains a frame graph in which loops can be detected and closed.
- **Loop closure + global BA**: when a loop is found, all camera poses are corrected simultaneously, bounding accumulated drift instead of just refining the latest window.
- **Map update after correction**: the Instant-NGP hash-grid NeRF is retrained in the affected regions using the corrected poses, keeping the neural map consistent with the globally optimised trajectory.
- **Multi-threaded design**: tracking, neural-field mapping, and global optimisation (loop closing + global BA) run in separate threads, following the classic SLAM frontend/backend split.

## Why it matters for SLAM

GO-SLAM addressed the most glaring gap between neural-rendering SLAM and mature systems like ORB-SLAM: the lack of global consistency. It demonstrated that learned tracking and neural scene representations can be combined with the classical loop-closure machinery, and it influenced later globally consistent neural and Gaussian-splatting SLAM designs. It supports monocular, stereo, and RGB-D input, making it one of the more practical NeRF-based SLAM systems.

## Related

- [DROID-SLAM](droid-slam.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [Co-SLAM](co-slam.md)
- [iMAP](imap.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
