# GO-SLAM

> Zhang 2023 · [Paper](https://arxiv.org/abs/2309.02436)

**One-line summary** — Brought loop closure and global bundle adjustment to neural implicit SLAM by combining DROID-SLAM's learned tracking with an Instant-NGP map that is updated after global pose corrections.

## Problem

Neural implicit representations had shown compelling dense SLAM results, but the first generation of systems (iMAP, NICE-SLAM, Co-SLAM) optimised only locally: camera tracking errors accumulate along the trajectory and the reconstruction distorts, because nothing ever corrects poses globally. Classical SLAM solved this decades ago with loop closure and global bundle adjustment — but naively re-optimising poses breaks a neural map that was trained under the *old* poses. GO-SLAM's goal is a deep-learning-based dense SLAM framework that globally optimises poses and the 3D reconstruction together, in real time.

## Key ideas

- **Global optimization for neural SLAM**: prior neural implicit systems only optimise a local window, so the neural map accumulates drift on long sequences. GO-SLAM puts robust pose estimation at the core, supported by efficient loop closing and online full bundle adjustment.
- **DROID-SLAM tracking backend**: a learned dense-flow tracking system provides robust camera poses and maintains a frame graph in which loop candidates can be detected (by revisitation/covisibility) and closed.
- **Full BA over the complete history**: rather than refining only the latest window, the global optimisation "optimizes per frame by utilizing the learned global geometry of the complete history of input frames" (abstract) — every pose can be corrected when new evidence arrives.
- **Map update after correction**: the Instant-NGP hash-grid NeRF is updated on-the-fly after loop closures and global BA, retraining affected regions under the corrected poses so the implicit, continuous surface representation stays consistent with the globally optimised trajectory.
- **Multi-threaded design**: tracking, neural-field mapping, and global optimisation (loop closing + global BA) run in separate threads, following the classic SLAM frontend/backend split — the architecture that made ORB-SLAM practical, transplanted to a neural map.
- **Sensor-agnostic**: the same framework runs with monocular, stereo, and RGB-D input, unusual among early neural SLAM systems, most of which were RGB-D only.

## Results & impact

- On "various synthetic and real-world datasets", GO-SLAM "outperforms state-of-the-art approaches at tracking robustness and reconstruction accuracy" (abstract), with drift reduced significantly compared to local-window neural SLAM systems such as NICE-SLAM and Co-SLAM on long sequences containing loops.
- Demonstrated that the neural map need not be frozen after pose corrections — on-the-fly map refitting is feasible in real time.
- Its DROID-SLAM-frontend + neural-map-backend pattern (shared with NeRF-SLAM) became one of the standard recipes for globally consistent dense neural SLAM.

## Why it matters for SLAM

GO-SLAM addressed the most glaring gap between neural-rendering SLAM and mature systems like ORB-SLAM: the lack of global consistency. It demonstrated that learned tracking and neural scene representations can be combined with the classical loop-closure machinery, and it influenced later globally consistent neural and Gaussian-splatting SLAM designs. Supporting monocular, stereo, and RGB-D input makes it one of the more practical NeRF-based SLAM systems to actually deploy.

## Related

- [DROID-SLAM](droid-slam.md)
- [NICE-SLAM](nice-slam.md)
- [NeRF-SLAM](nerf-slam.md)
- [Co-SLAM](co-slam.md)
- [iMAP](imap.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
